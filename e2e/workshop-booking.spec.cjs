const { test, expect } = require('@playwright/test');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');
const path = require('node:path');
const demos = DEMO_REGISTRY.filter(demo => demo.caseId === 'workshop-booking');
const money = cents => `¥${(cents / 100).toFixed(2)}`;
const dateText = value => {
    const utc = new Date(`${value}T00:00:00Z`);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${utc.getUTCFullYear()}年${utc.getUTCMonth() + 1}月${utc.getUTCDate()}日 ${weekdays[utc.getUTCDay()]}`;
};
const courseButton = (page, id) => page.locator(`[data-course-id="${id}"]`);
const sessionButton = (page, id) => page.locator(`[data-session-choice="${id}"]`);
const calendarButton = (page, date) => page.locator(`[data-calendar-date="${date}"]`);

async function openWorkshop(page, demo, { showAll = true } = {}) {
    await page.goto(`/${demo.path}`);
    await expect(page.locator('[data-workshop]')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('body')).toHaveAttribute('data-template', demo.templateId);
    if (demo.templateId === 'calendar' && showAll) await calendarButton(page, 'all').click();
}

async function showAgendaStep(page, demo, step) {
    if (demo.templateId !== 'agenda') return;
    const root = page.locator('[data-workshop]');
    if (await root.getAttribute('data-agenda-step') !== String(step)) await page.locator(`[data-agenda-goto="${step}"]`).click();
    await expect(root).toHaveAttribute('data-agenda-step', String(step));
}

async function chooseCourse(page, demo, id) {
    await showAgendaStep(page, demo, 0);
    await courseButton(page, id).click();
}

async function chooseSession(page, demo, id) {
    await showAgendaStep(page, demo, 1);
    await sessionButton(page, id).click();
}

async function selectDate(page, demo, value) {
    await showAgendaStep(page, demo, 1);
    await page.getByLabel('排期日期', { exact: true }).selectOption(value);
}

async function showPreviewStep(page, demo) {
    await showAgendaStep(page, demo, 2);
}

for (const demo of demos) {
    const schedule = require(path.resolve(__dirname, '..', demo.source, demo.dataDir || 'data', 'schedule.json'));
    const scheduledDates = [...new Set(schedule.sessions.map(session => session.date))].sort();
    const monthStart = new Date(schedule.month + '-01T00:00:00Z');
    const dayCount = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
    const offset = (monthStart.getUTCDay() + 6) % 7;
    const trailing = (7 - (offset + dayCount) % 7) % 7;
    const brands = { classic: '拾光工坊', calendar: '岸陶工房', agenda: '折页印作社' };
    test.describe(demo.templateId, () => {
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
            await openWorkshop(page, demo);
            expect(JSON.parse(await page.locator('#booking-data').textContent())).toEqual(schedule);
            await expect(page.locator('.brand-copy strong')).toHaveText(brands[demo.templateId]);
            expect(await page.locator('#category-filter option').evaluateAll(options => options.map(option => option.value))).toEqual(['all', ...new Set(schedule.courses.map(course => course.category))]);
            await context.setOffline(true);
            const session = schedule.sessions.find(item => item.remaining >= 2);
            const course = schedule.courses.find(item => item.id === session.courseId);
            await page.getByLabel('手作分类', { exact: true }).selectOption(course.category);
            await expect(page.locator('[data-course-id]:visible')).toHaveCount(schedule.courses.filter(item => item.category === course.category).length);
            if (demo.templateId === 'calendar') await page.getByLabel('排期日期', { exact: true }).selectOption(session.date);
            await chooseCourse(page, demo, course.id);
            if (demo.templateId !== 'calendar') await selectDate(page, demo, session.date);
            await expect(page.locator('[data-session-id]:visible')).toHaveCount(schedule.sessions.filter(item => item.courseId === course.id && item.date === session.date).length);
            await chooseSession(page, demo, session.id);
            await showPreviewStep(page, demo);
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
            await openWorkshop(page, demo);
            const limited = schedule.sessions.find(item => item.remaining > 0 && item.remaining < 6);
            await chooseCourse(page, demo, limited.courseId);
            await chooseSession(page, demo, limited.id);
            await showPreviewStep(page, demo);
            await page.getByRole('button', { name: '查看预约单预览' }).click();
            await expect(page.locator('#booking-preview')).toBeVisible();
            await page.getByLabel('参与人数', { exact: true }).selectOption(String(limited.remaining + 1));
            await expect(sessionButton(page, limited.id)).toHaveAttribute('aria-pressed', 'true');
            await expect(page.locator('#booking-status')).toContainText('余位不足');
            await expect(page.locator('#preview-booking')).toBeDisabled();
            await expect(page.locator('#booking-preview')).toBeHidden();
            await expect(page.locator('[data-preview=course]')).toHaveText('—');
            await expect(page.locator('[data-preview=total]')).toHaveText('—');
            await page.getByLabel('参与人数', { exact: true }).selectOption('1');
            await page.getByRole('button', { name: '查看预约单预览' }).click();
            const anotherDate = schedule.sessions.find(item => item.date !== limited.date).date;
            await selectDate(page, demo, anotherDate);
            await expect(page.locator('#booking-preview')).toBeHidden();
            await expect(page.locator('[data-selection=date]')).toHaveText('尚未选场');
            await expect(sessionButton(page, limited.id)).toHaveAttribute('aria-pressed', 'false');
            await selectDate(page, demo, 'all');
            if (demo.templateId === 'calendar') await courseButton(page, limited.courseId).click();
            await chooseSession(page, demo, limited.id);
            await showPreviewStep(page, demo);
            await page.getByRole('button', { name: '查看预约单预览' }).click();
            const otherCourse = schedule.courses.find(item => item.id !== limited.courseId);
            await chooseCourse(page, demo, otherCourse.id);
            await expect(page.locator('[data-selection=course]')).toHaveText(otherCourse.title);
            await expect(page.locator('[data-selection=date]')).toHaveText('尚未选场');
            await expect(page.locator('#booking-preview')).toBeHidden();
            await expect(page.locator('#preview-booking')).toBeDisabled();
            await page.getByRole('button', { name: '重置选择', exact: true }).click();
            if (demo.templateId === 'calendar') {
                await expect(page.locator('[data-calendar-details]')).toBeHidden();
                await expect(page.locator('[data-calendar-prompt]')).toBeVisible();
                await expect(page.getByLabel('排期日期', { exact: true })).toBeFocused();
                await calendarButton(page, 'all').click();
            }
            const soldOut = schedule.sessions.find(item => item.remaining === 0);
            await expect(sessionButton(page, soldOut.id)).toBeDisabled();
            await expect(page.locator('[data-session-id]:not([hidden])')).toHaveCount(schedule.sessions.length);
        });

        test('first Tab reaches the skip link and keyboard course, session, and preview actions retain focus', async ({ page }) => {
            await openWorkshop(page, demo, { showAll: false });
            await page.keyboard.press('Tab');
            await expect(page.locator('.skip-link')).toBeFocused();
            const catalog = page.locator('a[data-demo-catalog]');
            if (await catalog.count()) {
                await page.keyboard.press('Tab');
                await expect(catalog).toBeFocused();
                await expect(catalog).toHaveText('← 返回演示目录');
            }
            if (demo.templateId === 'calendar') {
                await calendarButton(page, 'all').focus();
                await page.keyboard.press('Space');
                await expect(calendarButton(page, 'all')).toBeFocused();
            }
            const session = schedule.sessions.find(item => item.remaining > 0);
            const course = courseButton(page, session.courseId);
            await course.focus();
            await page.keyboard.press('Space');
            await expect(course).toHaveAttribute('aria-pressed', 'true');
            await expect(course).toBeFocused();
            await showAgendaStep(page, demo, 1);
            const choice = sessionButton(page, session.id);
            await choice.focus();
            await page.keyboard.press('Enter');
            await expect(choice).toHaveAttribute('aria-pressed', 'true');
            await expect(choice).toBeFocused();
            await showPreviewStep(page, demo);
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
                await openWorkshop(page, demo, { showAll: false });
                await expect(page.locator('main h1')).toHaveCount(1);
                if (demo.templateId === 'calendar') {
                    await expect(page.locator('[data-calendar-details]')).toBeHidden();
                    await expect(page.locator('[data-calendar-prompt]')).toBeVisible();
                    await expect(page.locator('.calendar-days')).toHaveCSS('display', 'grid');
                    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
                    await calendarButton(page, 'all').click();
                }
                const session = schedule.sessions.find(item => item.remaining > 0);
                await chooseCourse(page, demo, session.courseId);
                await chooseSession(page, demo, session.id);
                await showPreviewStep(page, demo);
                await page.getByRole('button', { name: '查看预约单预览' }).click();
                await expect(page.locator('#booking-preview')).toBeVisible();
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
                await page.goto(`/${demo.path}about/`);
                await expect(page.locator('main h1')).toHaveText('关于' + brands[demo.templateId] + '的排期');
                await expect(page.locator('main h1')).toHaveCount(1);
                await expect(page.locator('body')).toHaveAttribute('data-template', demo.templateId);
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
            }
        });

        if (demo.templateId === 'calendar') {
            test('ceramic calendar keeps phone date cells readable and opens complete course and time details', async ({ page }) => {
                await page.setViewportSize({ width: 1280, height: 1000 });
                await openWorkshop(page, demo, { showAll: false });
                await expect(page.locator('.calendar-workspace')).toHaveCSS('display', 'grid');
                const month = await page.locator('.calendar-month-column').boundingBox();
                const day = await page.locator('.calendar-day-column').boundingBox();
                expect(day.x).toBeGreaterThanOrEqual(month.x + month.width);
                await expect(page.locator('.calendar-slot:visible')).toHaveCount(schedule.sessions.length);
                for (const width of [320, 390]) {
                    await page.setViewportSize({ width, height: 1000 });
                    await expect(page.locator('.calendar-day-number:visible')).toHaveCount(dayCount);
                    await expect(page.locator('.calendar-slot:visible')).toHaveCount(0);
                    for (const session of schedule.sessions) {
                        const course = schedule.courses.find(item => item.id === session.courseId);
                        const cell = calendarButton(page, session.date);
                        await expect(cell.locator('.calendar-day-count')).toHaveText(`${schedule.sessions.filter(item => item.date === session.date).length} 场`);
                        await cell.click();
                        await expect(page.locator('[data-calendar-details]')).toBeVisible();
                        await expect(courseButton(page, course.id)).toBeVisible();
                        const row = page.locator(`[data-session-id="${session.id}"]`);
                        await expect(row).toBeVisible();
                        await expect(row).toContainText(course.title);
                        await expect(row).toContainText(session.start);
                    }
                    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
                }
            });

            test('calendar opens at date entry with a complete Monday-first scene month grid', async ({ page }) => {
                await openWorkshop(page, demo, { showAll: false });
                await expect(page.getByLabel('排期日期', { exact: true })).toHaveValue('');
                await expect(page.locator('[data-calendar-prompt]')).toBeVisible();
                await expect(page.locator('[data-calendar-details]')).toBeHidden();
                await expect(page.locator('[data-course-id]:visible')).toHaveCount(0);
                await expect(page.locator('[data-session-id]:visible')).toHaveCount(0);
                await expect(page.locator('[data-calendar-date][aria-pressed=true]')).toHaveCount(0);
                expect(await page.locator('.calendar-weekdays > span').allTextContents()).toEqual(['周一', '周二', '周三', '周四', '周五', '周六', '周日']);
                const days = await page.locator('.calendar-days > li').evaluateAll(cells => cells.map(cell => {
                    const number = cell.querySelector('.calendar-day-number');
                    return number ? Number(number.textContent) : null;
                }));
                expect(days).toEqual([...Array(offset).fill(null), ...Array.from({ length: dayCount }, (_, index) => index + 1), ...Array(trailing).fill(null)]);
                const dates = await page.locator('[data-calendar-date]:not([data-calendar-date="all"])').evaluateAll(buttons => buttons.map(button => button.dataset.calendarDate));
                expect(dates).toEqual(scheduledDates);
                for (const date of scheduledDates) await expect(calendarButton(page, date)).toBeEnabled();
            });

            test('keyboard dates open matching courses and sessions, enforce capacity, and clear stale previews', async ({ page }) => {
                await openWorkshop(page, demo, { showAll: false });
                const date = page.getByLabel('排期日期', { exact: true });
                const firstDay = calendarButton(page, scheduledDates[0]);
                await firstDay.focus();
                await page.keyboard.press('ArrowRight');
                await expect(calendarButton(page, scheduledDates[1])).toBeFocused();
                await page.keyboard.press('ArrowLeft');
                await expect(firstDay).toBeFocused();
                await page.keyboard.press('End');
                await expect(calendarButton(page, scheduledDates.at(-1))).toBeFocused();
                await page.keyboard.press('Home');
                await expect(firstDay).toBeFocused();
                await page.keyboard.press('ArrowDown');
                const nextWeek = scheduledDates.find(value => Number(value.slice(-2)) >= Number(scheduledDates[0].slice(-2)) + 7);
                await expect(calendarButton(page, nextWeek)).toBeFocused();
                await page.keyboard.press('ArrowUp');
                await expect(firstDay).toBeFocused();
                await expect(date).toHaveValue('');
                await expect(page.locator('[data-calendar-details]')).toBeHidden();
                await page.keyboard.press('Enter');
                await expect(firstDay).toBeFocused();
                await expect(firstDay).toHaveAttribute('aria-pressed', 'true');
                await expect(date).toHaveValue(scheduledDates[0]);
                await expect(page.locator('[data-calendar-details]')).toBeVisible();
                await expect(page.locator('[data-calendar-prompt]')).toBeHidden();
                await expect(page.locator('[data-calendar-summary]')).toContainText(dateText(scheduledDates[0]));
                const daySessions = schedule.sessions.filter(session => session.date === scheduledDates[0]);
                const dayCourseIds = [...new Set(daySessions.map(session => session.courseId))].sort();
                const visibleCourseIds = await page.locator('[data-course-id]:visible').evaluateAll(buttons => buttons.map(button => button.dataset.courseId).sort());
                expect(visibleCourseIds).toEqual(dayCourseIds);
                const visibleSessionIds = await page.locator('[data-session-id]:visible').evaluateAll(rows => rows.map(row => row.dataset.sessionId).sort());
                expect(visibleSessionIds).toEqual(daySessions.map(session => session.id).sort());

                const session = daySessions.find(item => item.remaining >= 2 && item.remaining < 6);
                const course = schedule.courses.find(item => item.id === session.courseId);
                const courseChoice = courseButton(page, course.id);
                await courseChoice.focus();
                await page.keyboard.press('Space');
                await expect(courseChoice).toBeFocused();
                await expect(courseChoice).toHaveAttribute('aria-pressed', 'true');
                const choice = sessionButton(page, session.id);
                await choice.focus();
                await page.keyboard.press('Enter');
                await expect(choice).toBeFocused();
                await expect(choice).toHaveAttribute('aria-pressed', 'true');
                await expect(page.locator(`[data-session-id="${session.id}"] .session-capacity`)).toHaveText(`示例余位 ${session.remaining} 人`);
                await page.getByLabel('参与人数', { exact: true }).selectOption('2');
                const preview = page.getByRole('button', { name: '查看预约单预览' });
                await preview.focus();
                await page.keyboard.press('Enter');
                await expect(preview).toBeFocused();
                await expect(page.locator('#booking-preview')).toBeVisible();
                await expect(page.locator('[data-preview=date]')).toHaveText(dateText(session.date));
                await expect(page.locator('[data-preview=total]')).toHaveText(money(course.priceCents * 2));
                await page.getByLabel('参与人数', { exact: true }).selectOption(String(session.remaining + 1));
                await expect(choice).toHaveAttribute('aria-pressed', 'true');
                await expect(preview).toBeDisabled();
                await expect(page.locator('#booking-status')).toContainText('余位不足');
                await expect(page.locator('#booking-preview')).toBeHidden();
                await expect(page.locator('[data-preview=total]')).toHaveText('—');

                await page.getByLabel('参与人数', { exact: true }).selectOption('2');
                await preview.click();
                await firstDay.focus();
                await page.keyboard.press('Space');
                await expect(date).toHaveValue(session.date);
                await expect(courseChoice).toHaveAttribute('aria-pressed', 'true');
                await expect(choice).toHaveAttribute('aria-pressed', 'true');
                await expect(page.locator('#booking-preview')).toBeHidden();
                await preview.click();
                const otherDay = calendarButton(page, scheduledDates[1]);
                await otherDay.focus();
                await page.keyboard.press('Space');
                await expect(otherDay).toBeFocused();
                await expect(date).toHaveValue(scheduledDates[1]);
                await expect(page.getByLabel('参与人数', { exact: true })).toHaveValue('2');
                await expect(page.locator('[data-course-id][aria-pressed=true]')).toHaveCount(0);
                await expect(page.locator('[data-session-choice][aria-pressed=true]')).toHaveCount(0);
                await expect(page.locator('[data-selection=course]')).toHaveText('尚未选课');
                await expect(page.locator('[data-selection=date]')).toHaveText('尚未选场');
                await expect(preview).toBeDisabled();
                await expect(page.locator('#booking-preview')).toBeHidden();
                await expect(page.locator('[data-preview=course]')).toHaveText('—');
            });

            test('sold-out dates remain inspectable, full month restores all records, and reset returns focus to date entry', async ({ page }) => {
                await openWorkshop(page, demo, { showAll: false });
                const soldOut = schedule.sessions.find(session => session.remaining === 0);
                const soldOutDay = calendarButton(page, soldOut.date);
                await expect(soldOutDay).toBeEnabled();
                await expect(soldOutDay).toHaveAttribute('aria-label', /全部已满额/);
                await soldOutDay.click();
                await expect(page.locator(`[data-session-id="${soldOut.id}"]`)).toBeVisible();
                await expect(sessionButton(page, soldOut.id)).toBeDisabled();
                await courseButton(page, soldOut.courseId).click();
                await expect(page.locator('#preview-booking')).toBeDisabled();
                const all = calendarButton(page, 'all');
                await all.focus();
                await page.keyboard.press('Space');
                await expect(all).toBeFocused();
                await expect(all).toHaveAttribute('aria-pressed', 'true');
                await expect(page.getByLabel('排期日期', { exact: true })).toHaveValue('all');
                await expect(page.locator('[data-calendar-summary]')).toHaveText(monthStart.getUTCFullYear() + ' 年 ' + (monthStart.getUTCMonth() + 1) + ' 月完整课程与排期');
                await expect(page.locator('[data-course-id]:visible')).toHaveCount(schedule.courses.length);
                await expect(page.locator('[data-session-id]:visible')).toHaveCount(schedule.sessions.length);
                const session = schedule.sessions.find(item => item.remaining >= 3);
                const course = schedule.courses.find(item => item.id === session.courseId);
                await courseButton(page, course.id).click();
                await sessionButton(page, session.id).click();
                await page.getByLabel('参与人数', { exact: true }).selectOption('3');
                await page.getByRole('button', { name: '查看预约单预览' }).click();
                await expect(page.locator('[data-preview=total]')).toHaveText(money(course.priceCents * 3));
                const otherCategory = schedule.courses.find(item => item.category !== course.category).category;
                await page.getByLabel('手作分类', { exact: true }).selectOption(otherCategory);
                await expect(page.locator('[data-course-id]:visible')).toHaveCount(schedule.courses.filter(item => item.category === otherCategory).length);
                await expect(page.locator('#booking-preview')).toBeHidden();
                await page.getByRole('button', { name: '重置选择', exact: true }).click();
                await expect(page.getByLabel('排期日期', { exact: true })).toHaveValue('');
                await expect(page.getByLabel('排期日期', { exact: true })).toBeFocused();
                await expect(page.getByLabel('手作分类', { exact: true })).toHaveValue('all');
                await expect(page.getByLabel('参与人数', { exact: true })).toHaveValue('1');
                await expect(page.locator('[data-calendar-prompt]')).toBeVisible();
                await expect(page.locator('[data-calendar-details]')).toBeHidden();
                await expect(page.locator('[data-calendar-date][aria-pressed=true]')).toHaveCount(0);
                await expect(page.locator('[data-course-id][aria-pressed=true]')).toHaveCount(0);
                await expect(page.locator('[data-session-choice][aria-pressed=true]')).toHaveCount(0);
                await expect(page.locator('#booking-preview')).toBeHidden();
                await expect(page.locator('[data-preview=total]')).toHaveText('—');
                await all.click();
                await expect(page.locator('[data-course-id]:visible')).toHaveCount(schedule.courses.length);
                await expect(page.locator('[data-session-id]:visible')).toHaveCount(schedule.sessions.length);
            });
        }

        if (demo.templateId === 'agenda') {
            test('paper workshop wizard gates each step and preserves selections on back while invalidating a changed course', async ({ page }) => {
                const pageErrors = [];
                page.on('pageerror', error => pageErrors.push(error.message));
                await page.setViewportSize({ width: 1280, height: 1000 });
                await page.emulateMedia({ reducedMotion: 'reduce' });
                await openWorkshop(page, demo);
                const root = page.locator('[data-workshop]');
                await expect(page.locator('.agenda-steps')).toHaveCSS('display', 'grid');
                await expect(page.locator('.agenda-step[data-agenda-step]')).toHaveCount(3);
                await expect(page.locator('.agenda-step[data-agenda-step]:visible')).toHaveCount(1);
                await expect(root).toHaveAttribute('data-agenda-step', '0');
                await expect(page.locator('[data-agenda-goto="0"]')).toHaveAttribute('aria-current', 'step');
                await expect(page.locator('[data-agenda-next="1"]')).toBeDisabled();
                await expect(page.locator('[data-agenda-goto="1"]')).toBeDisabled();
                await expect(page.locator('[data-agenda-goto="2"]')).toBeDisabled();

                const session = schedule.sessions.find(item => item.remaining >= 2);
                const course = schedule.courses.find(item => item.id === session.courseId);
                await chooseCourse(page, demo, course.id);
                await page.locator('[data-agenda-next="1"]').click();
                await expect(root).toHaveAttribute('data-agenda-step', '1');
                await expect(page.locator('#agenda-session-heading')).toBeFocused();
                await expect(page.locator('.agenda-step[data-agenda-step]:visible')).toHaveCount(1);
                await expect(page.locator('[data-agenda-next="2"]')).toBeDisabled();
                await chooseSession(page, demo, session.id);
                await page.locator('[data-agenda-next="2"]').click();
                await expect(root).toHaveAttribute('data-agenda-step', '2');
                await expect(page.locator('#agenda-preview-heading')).toBeFocused();
                await page.getByLabel('参与人数', { exact: true }).selectOption('2');
                await page.getByRole('button', { name: '查看预约单预览' }).click();
                await expect(page.locator('[data-preview=total]')).toHaveText(money(course.priceCents * 2));
                await page.locator('[data-agenda-back="1"]').click();
                await expect(sessionButton(page, session.id)).toHaveAttribute('aria-pressed', 'true');
                await expect(page.locator('#agenda-session-heading')).toBeFocused();
                await page.locator('[data-agenda-back="0"]').click();
                await expect(courseButton(page, course.id)).toHaveAttribute('aria-pressed', 'true');
                await expect(page.locator('#agenda-course-heading')).toBeFocused();
                const other = schedule.courses.find(item => item.id !== course.id);
                await chooseCourse(page, demo, other.id);
                await expect(page.locator('[data-session-choice][aria-pressed=true]')).toHaveCount(0);
                await expect(page.locator('#booking-preview')).toBeHidden();
                await expect(page.locator('[data-preview=total]')).toHaveText('—');
                await expect(page.locator('[data-agenda-goto="2"]')).toBeDisabled();
                await expect(page.locator('#preview-booking')).toBeDisabled();
                await page.getByRole('button', { name: '重置选择', exact: true }).click();
                await expect(root).toHaveAttribute('data-agenda-step', '0');
                await expect(page.getByLabel('手作分类', { exact: true })).toBeFocused();
                await expect(page.locator('[data-agenda-next="1"]')).toBeDisabled();
                expect(pageErrors).toEqual([]);
            });
        }

        test.describe('workshop without JavaScript', () => {
            test.use({ javaScriptEnabled: false });
            test('retains all courses and twelve read-only sessions with disabled controls and a real noscript paragraph', async ({ page }) => {
                await page.goto(`/${demo.path}`);
                await expect(page.locator('[data-course-id]')).toHaveCount(schedule.courses.length);
                await expect(page.locator('[data-session-id]')).toHaveCount(schedule.sessions.length);
                await expect(page.locator('[data-course-id]:visible')).toHaveCount(schedule.courses.length);
                await expect(page.locator('[data-session-id]:visible')).toHaveCount(schedule.sessions.length);
                for (const course of schedule.courses) {
                    await expect(courseButton(page, course.id)).toContainText(course.title);
                    await expect(courseButton(page, course.id)).toBeDisabled();
                }
                for (const session of schedule.sessions) {
                    await expect(sessionButton(page, session.id)).toBeDisabled();
                    await expect(page.locator('[data-session-id="' + session.id + '"] .session-capacity')).toHaveText(session.remaining === 0 ? '已满额 · 示例余位 0 人' : '示例余位 ' + session.remaining + ' 人');
                }
                await expect(page.getByLabel('手作分类', { exact: true })).toBeDisabled();
                await expect(page.getByLabel('排期日期', { exact: true })).toBeDisabled();
                await expect(page.getByLabel('参与人数', { exact: true })).toBeDisabled();
                await expect(page.locator('#preview-booking')).toBeDisabled();
                await expect(page.locator('p.noscript-note')).toBeVisible();
                await expect(page.locator('p.noscript-note')).toContainText('只读浏览全部 ' + schedule.courses.length + ' 门课程和 ' + schedule.sessions.length + ' 个示例场次');
                await expect(page.locator('#booking-preview')).toBeHidden();
                if (demo.templateId === 'calendar') {
                    await expect(page.locator('[data-calendar-details]')).toBeVisible();
                    await expect(page.locator('[data-calendar-prompt]')).toBeHidden();
                    await expect(page.locator('[data-calendar-date]:visible')).toHaveCount(scheduledDates.length + 1);
                    for (const date of [...scheduledDates, 'all']) await expect(calendarButton(page, date)).toBeDisabled();
                    await expect(page.locator('.calendar-day-number:visible')).toHaveCount(dayCount);
                }
                if (demo.templateId === 'agenda') {
                    await expect(page.locator('.agenda-step[data-agenda-step]:visible')).toHaveCount(3);
                    for (const button of await page.locator('[data-agenda-goto], [data-agenda-next], [data-agenda-back]').all()) await expect(button).toBeDisabled();
                }
            });
        });
    });
}
