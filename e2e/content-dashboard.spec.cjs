const { test, expect } = require('@playwright/test');
const entries = require('../demos/content-dashboard/data/entries.json');
const demoPath = '/demos/content-dashboard/';
const totalViews = entries.reduce((sum, row) => sum + row.views, 0);
const totalInteractions = entries.reduce((sum, row) => sum + row.interactions, 0);
const number = value => value.toLocaleString('zh-CN');

async function openDashboard(page) {
    await page.goto(demoPath);
    await expect(page.locator('[data-dashboard]')).toHaveAttribute('data-ready', 'true');
}

async function expectTotals(page, count, views, interactions) {
    await expect(page.locator('[data-metric=count]')).toHaveText(number(count));
    await expect(page.locator('[data-metric=views]')).toHaveText(number(views));
    await expect(page.locator('[data-metric=interactions]')).toHaveText(number(interactions));
    await expect(page.locator('[data-metric=rate]')).toHaveText(`${(views ? interactions / views * 100 : 0).toFixed(2)}%`);
    await expect(page.locator('#content-rows tr')).toHaveCount(count);
}

test('dashboard filters link exact totals, channel bars, and table records', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await openDashboard(page);
    await expectTotals(page, 24, totalViews, totalInteractions);
    await page.getByLabel('发布月份', { exact: true }).selectOption('2026-09');
    await page.getByLabel('内容渠道').selectOption('博客');
    await expectTotals(page, 3, 8020, 590);
    expect(await page.locator('#content-rows tr').evaluateAll(rows => rows.every(row => row.dataset.entryId.startsWith('content-202609')))).toBe(true);
    await expect(page.locator('[data-channel="博客"] .channel-total')).toHaveText('8,020');
    await expect(page.locator('[data-channel="视频"] .channel-total')).toHaveText('0');
    await expect(page.locator('[data-channel="社区"] .channel-total')).toHaveText('0');
    const widths = await page.locator('[data-channel="博客"] .bar-track').evaluate(track => ({ track: track.getBoundingClientRect().width, bar: track.firstElementChild.getBoundingClientRect().width }));
    expect(widths.bar).toBeGreaterThan(0);
    expect(widths.bar).toBeCloseTo(widths.track, 1);
    expect(errors).toEqual([]);
});

test('sorting changes only row order and compares numeric rates and dates', async ({ page }) => {
    await openDashboard(page);
    const metricBefore = await page.locator('[data-metric]').allTextContents();
    for (const field of ['views', 'interactions', 'rate', 'published']) {
        await page.getByLabel('排序依据').selectOption(field);
        for (const direction of ['asc', 'desc']) {
            await page.getByLabel('排序方向').selectOption(direction);
            const ids = await page.locator('#content-rows tr').evaluateAll(rows => rows.map(row => row.dataset.entryId));
            const ordered = ids.map(id => entries.find(row => row.id === id));
            const value = row => field === 'rate' ? (row.views ? row.interactions / row.views : 0) : row[field];
            for (let i = 1; i < ordered.length; i++) {
                expect(direction === 'asc' ? value(ordered[i - 1]) <= value(ordered[i]) : value(ordered[i - 1]) >= value(ordered[i])).toBe(true);
            }
        }
    }
    expect(await page.locator('[data-metric]').allTextContents()).toEqual(metricBefore);
});

test('search handles composition, empty results, zero views, and reset', async ({ page }) => {
    await openDashboard(page);
    const search = page.getByLabel('标题关键词');
    await search.focus();
    await search.dispatchEvent('compositionstart');
    await search.fill('不存在的标题');
    await expect(page.locator('#content-rows tr')).toHaveCount(24);
    await search.dispatchEvent('compositionend');
    await expectTotals(page, 0, 0, 0);
    await expect(page.locator('#empty-state')).toBeVisible();
    await expect(search).toBeFocused();
    await search.fill('九月 复盘');
    await expectTotals(page, 1, 0, 0);
    await expect(page.locator('#empty-state')).toBeHidden();
    await expect(page.locator('[data-cell=rate]')).toHaveText('0.00%');
    await page.getByRole('button', { name: '重置', exact: true }).click();
    await expectTotals(page, 24, totalViews, totalInteractions);
    await expect(search).toHaveValue('');
    await expect(page.locator('#content-rows tr').first()).toHaveAttribute('data-entry-id', 'content-202609-02');
});

test('dashboard filters offline without storage access or external requests', async ({ page, context, baseURL }) => {
    const externalRequests = [];
    page.on('request', request => {
        if (new URL(request.url()).origin !== new URL(baseURL).origin) externalRequests.push(request.url());
    });
    await page.addInitScript(() => {
        for (const key of ['localStorage', 'sessionStorage']) {
            Object.defineProperty(window, key, { get() { throw new Error('Storage unavailable'); } });
        }
    });
    await openDashboard(page);
    await context.setOffline(true);
    await page.getByLabel('标题关键词').fill('素材 标记');
    await expectTotals(page, 1, 1920, 118);
    await context.setOffline(false);
    expect(externalRequests).toEqual([]);
});

test('dashboard and explanation fit phone, tablet and desktop after rendering', async ({ page }) => {
    for (const width of [320, 390, 800, 1280]) {
        await page.setViewportSize({ width, height: 960 });
        await openDashboard(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        const titleBox = await page.locator('#content-rows [data-cell=title]').first().boundingBox();
        expect(titleBox.width).toBeGreaterThan(width <= 390 ? width * .6 : 100);
        for (const key of ['views', 'interactions', 'rate']) {
            const box = await page.locator(`#content-rows [data-cell=${key}]`).first().boundingBox();
            expect(box.width).toBeGreaterThan(50);
        }
        await page.goto(`${demoPath}about/`);
        await expect(page.locator('main h1')).toHaveText('数据说明');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    }
});

test.describe('dashboard without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('retains the complete data table, readable chart, and totals', async ({ page }) => {
        await page.goto(demoPath);
        await expectTotals(page, 24, totalViews, totalInteractions);
        await expect(page.locator('.noscript-note')).toBeVisible();
        await expect(page.locator('.noscript-note')).toContainText('全部示例数据');
        await expect(page.getByLabel('发布月份', { exact: true })).toBeDisabled();
        await expect(page.locator('#channel-chart .channel-total')).toHaveCount(3);
        const channelSum = (await page.locator('#channel-chart .channel-total').allTextContents()).reduce((sum, value) => sum + Number(value.replace(/,/g, '')), 0);
        expect(channelSum).toBe(totalViews);
    });
});
