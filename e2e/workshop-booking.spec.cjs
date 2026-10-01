const { test, expect } = require('@playwright/test');
const schedule = require('../demos/workshop-booking/data/schedule.json');
const demoPath = '/demos/workshop-booking/';
const money = cents => `¥${(cents / 100).toFixed(2)}`;
const dateText = value => {
    const utc = new Date(`${value}T00:00:00Z`);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${utc.getUTCFullYear()}年${utc.getUTCMonth() + 1}月${utc.getUTCDate()}日 ${weekdays[utc.getUTCDay()]}`;
};
const courseButton = (page, id) => page.locator(`[data-course-id="${id}"]`);
const sessionButton = (page, id) => page.locator(`[data-session-choice="${id}"]`);

async function openWorkshop(page) {
    await page.goto(demoPath);
    await expect(page.locator('[data-workshop]')).toHaveAttribute('data-ready', 'true');
}

test('craft and date filters lead to a complete local reservation preview with independently calculated totals', async ({ page, context, baseURL }) => {
    const externalRequests = [];
    const pageErrors = [];
    page.on('request', request => {
        if (new URL(request.url()).origin !== new URL(baseURL).origin) externalRequests.push(request.url());
    });
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.addInitScript(() => {
        for (const key of ['localStorage', 'sessionStorage']) {
            Object.defineProperty(window, key, { get() { throw new Error('Storage unavailable'); } });
        }
    });
    await openWorkshop(page);
    await context.setOffline(true);
    const session = schedule.sessions.find(item => item.remaining >= 2);
    const course = schedule.courses.find(item => item.id === session.courseId);
    await page.getByLabel('手作分类', { exact: true }).selectOption(course.category);
    await expect(page.locator('[data-course-id]:visible')).toHaveCount(schedule.courses.filter(item => item.category === course.category).length);
    await courseButton(page, course.id).click();
    await page.getByLabel('排期日期', { exact: true }).selectOption(session.date);
    await expect(page.locator('[data-session-id]:visible')).toHaveCount(schedule.sessions.filter(item => item.courseId === course.id && item.date === session.date).length);
    await sessionButton(page, session.id).click();
    await page.getByLabel('参与人数', { exact: true }).selectOption('2');
    await page.getByRole('button', { name: '查看预约单预览' }).click();
    await expect(page.locator('#booking-preview')).toBeVisible();
    await expect(page.locator('[data-preview=course]')).toHaveText(course.title);
    await expect(page.locator('[data-preview=date]')).toHaveText(dateText(session.date));
    await expect(page.locator('[data-preview=time]')).toHaveText(`${session.start} — ${session.end}`);
    await expect(page.locator('[data-preview=quantity]')).toHaveText('2 人');
    await expect(page.locator('[data-preview=unit]')).toHaveText(`${money(course.priceCents)} / 人`);
    await expect(page.locator('[data-preview=total]')).toHaveText(money(course.priceCents * 2));
    await expect(page.locator('#booking-status')).toContainText('没有提交任何信息');
    expect(externalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    await context.setOffline(false);
    await page.reload();
    await expect(page.locator('[data-workshop]')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#booking-preview')).toBeHidden();
    await expect(page.getByLabel('参与人数', { exact: true })).toHaveValue('1');
    await expect(page.locator('[data-course-id][aria-pressed=true]')).toHaveCount(0);
});

test('insufficient capacity preserves the chosen session, blocks preview, and changes clear stale summaries', async ({ page }) => {
    await openWorkshop(page);
    const limited = schedule.sessions.find(item => item.remaining > 0 && item.remaining < 6);
    await courseButton(page, limited.courseId).click();
    await sessionButton(page, limited.id).click();
    await page.getByRole('button', { name: '查看预约单预览' }).click();
    await expect(page.locator('#booking-preview')).toBeVisible();
    await page.getByLabel('参与人数', { exact: true }).selectOption(String(limited.remaining + 1));
    await expect(sessionButton(page, limited.id)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#booking-status')).toContainText('余位不足');
    await expect(page.getByRole('button', { name: '查看预约单预览' })).toBeDisabled();
    await expect(page.locator('#booking-preview')).toBeHidden();
    await expect(page.locator('[data-preview=course]')).toHaveText('—');
    await expect(page.locator('[data-preview=total]')).toHaveText('—');
    await page.getByLabel('参与人数', { exact: true }).selectOption('1');
    await page.getByRole('button', { name: '查看预约单预览' }).click();
    const anotherDate = schedule.sessions.find(item => item.date !== limited.date).date;
    await page.getByLabel('排期日期', { exact: true }).selectOption(anotherDate);
    await expect(page.locator('#booking-preview')).toBeHidden();
    await expect(page.locator('[data-selection=date]')).toHaveText('尚未选场');
    await expect(sessionButton(page, limited.id)).toHaveAttribute('aria-pressed', 'false');
    await page.getByLabel('排期日期', { exact: true }).selectOption('all');
    await sessionButton(page, limited.id).click();
    await page.getByRole('button', { name: '查看预约单预览' }).click();
    const otherCourse = schedule.courses.find(item => item.id !== limited.courseId);
    await courseButton(page, otherCourse.id).click();
    await expect(page.locator('[data-selection=course]')).toHaveText(otherCourse.title);
    await expect(page.locator('[data-selection=date]')).toHaveText('尚未选场');
    await expect(page.locator('#booking-preview')).toBeHidden();
    await expect(page.getByRole('button', { name: '查看预约单预览' })).toBeDisabled();
    await page.getByRole('button', { name: '重置选择', exact: true }).click();
    const soldOut = schedule.sessions.find(item => item.remaining === 0);
    await expect(sessionButton(page, soldOut.id)).toBeDisabled();
    await expect(page.locator('[data-session-id]:visible')).toHaveCount(schedule.sessions.length);
});

test('first Tab reaches the skip link and keyboard course, session, and preview actions retain focus', async ({ page }) => {
    await openWorkshop(page);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    const catalog = page.locator('a[data-demo-catalog]');
    if (await catalog.count()) {
        await page.keyboard.press('Tab');
        await expect(catalog).toBeFocused();
        await expect(catalog).toHaveText('← 返回演示目录');
    }
    const session = schedule.sessions.find(item => item.remaining > 0);
    const course = courseButton(page, session.courseId);
    await course.focus();
    await page.keyboard.press('Space');
    await expect(course).toHaveAttribute('aria-pressed', 'true');
    await expect(course).toBeFocused();
    const choice = sessionButton(page, session.id);
    await choice.focus();
    await page.keyboard.press('Enter');
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
    await expect(choice).toBeFocused();
    const preview = page.getByRole('button', { name: '查看预约单预览' });
    await preview.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#booking-preview')).toBeVisible();
    await expect(preview).toBeFocused();
    await expect(page.locator('#booking-status')).toHaveAttribute('aria-live', 'polite');
});

test('course selection, preview, and explanation fit 320 and 390 pixel phones', async ({ page }) => {
    for (const width of [320, 390, 800, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await openWorkshop(page);
        await expect(page.locator('main h1')).toHaveCount(1);
        const session = schedule.sessions.find(item => item.remaining > 0);
        await courseButton(page, session.courseId).click();
        await sessionButton(page, session.id).click();
        await page.getByRole('button', { name: '查看预约单预览' }).click();
        await expect(page.locator('#booking-preview')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        await page.goto(`${demoPath}about/`);
        await expect(page.locator('main h1')).toHaveText('关于这份排期');
        await expect(page.locator('main h1')).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    }
});

test.describe('workshop without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('retains all courses and twelve read-only sessions with disabled controls and a real noscript paragraph', async ({ page }) => {
        await page.goto(demoPath);
        await expect(page.locator('[data-course-id]')).toHaveCount(schedule.courses.length);
        await expect(page.locator('[data-session-id]')).toHaveCount(schedule.sessions.length);
        for (const course of schedule.courses) {
            await expect(courseButton(page, course.id)).toContainText(course.title);
            await expect(courseButton(page, course.id)).toBeDisabled();
        }
        for (const session of schedule.sessions) await expect(sessionButton(page, session.id)).toBeDisabled();
        await expect(page.getByLabel('手作分类', { exact: true })).toBeDisabled();
        await expect(page.getByLabel('排期日期', { exact: true })).toBeDisabled();
        await expect(page.getByLabel('参与人数', { exact: true })).toBeDisabled();
        await expect(page.getByRole('button', { name: '查看预约单预览' })).toBeDisabled();
        await expect(page.locator('p.noscript-note')).toBeVisible();
        await expect(page.locator('p.noscript-note')).toContainText('只读浏览全部六门课程和十二个示例场次');
        await expect(page.locator('#booking-preview')).toBeHidden();
    });
});
