const { test, expect } = require('@playwright/test');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');
for (const demo of DEMO_REGISTRY.filter(item => item.caseId === 'trip-planner')) {
test.describe(demo.templateId, () => {
const demoPath = '/' + demo.path;

async function openPlanner(page) {
    await page.goto(demoPath);
    await expect(page.locator('[data-trip-planner]')).toHaveAttribute('data-ready', 'true');
}

async function addPlaces(page, names) {
    for (const name of names) await page.getByRole('button', { name: `加入${name}`, exact: true }).click();
}

async function itineraryIds(page) {
    return page.locator('#itinerary-list > li').evaluateAll(items => items.map(item => item.dataset.stopId));
}

async function expectTotals(page, count, stay, transfer, total, budget) {
    for (const [key, value] of [['count', count], ['stayMinutes', stay], ['transferMinutes', transfer], ['totalMinutes', total], ['costCents', budget]]) {
        await expect(page.locator(`[data-total="${key}"]`)).toHaveText(String(value));
    }
}

test('trip category filters and itinerary reorder keep map lines and numbered stops synchronized', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await openPlanner(page);
    await expect(page.locator('main h1')).toHaveCount(1);
    await page.getByLabel('筛选地点类型').selectOption('自然');
    await expect(page.locator('[data-place-card]:not([hidden])')).toHaveCount(3);
    await page.getByLabel('筛选地点类型').selectOption('休憩');
    await expect(page.locator('[data-place-card]:not([hidden])')).toHaveCount(2);
    await page.getByLabel('筛选地点类型').selectOption('all');
    await addPlaces(page, ['松风脊', '雾桥溪', '阶影湖']);
    expect(await itineraryIds(page)).toEqual(['pine-ridge', 'cloud-bridge', 'terrace-lake']);
    await expect(page.locator('#itinerary-route')).toHaveAttribute('points', '160,156.8 352,112 576,190.4');
    await expect(page.locator('[data-map-id="cloud-bridge"] [data-route-number]')).toHaveText('2');
    await expect(page.locator('[data-place-id="pine-ridge"] button')).toBeDisabled();
    await page.getByRole('button', { name: '上移阶影湖', exact: true }).click();
    expect(await itineraryIds(page)).toEqual(['pine-ridge', 'terrace-lake', 'cloud-bridge']);
    await expect(page.locator('#itinerary-route')).toHaveAttribute('points', '160,156.8 576,190.4 352,112');
    await expect(page.locator('[data-map-id="terrace-lake"] [data-route-number]')).toHaveText('2');
    await page.getByLabel('筛选地点类型').selectOption('人文');
    expect(await itineraryIds(page)).toEqual(['pine-ridge', 'terrace-lake', 'cloud-bridge']);
    await expect(page.locator('[data-place-card]:not([hidden])')).toHaveCount(3);
    await page.getByRole('button', { name: '移除雾桥溪', exact: true }).click();
    await expect(page.locator('#itinerary-route')).toHaveAttribute('points', '160,156.8 576,190.4');
    await expect(page.locator('[data-route-number]:not([hidden])')).toHaveCount(2);
    expect(errors).toEqual([]);
});

test('trip totals include transfers, cap selection, warn after eight hours and reset on clear or refresh', async ({ page }) => {
    await openPlanner(page);
    await expectTotals(page, 0, 0, 0, 0, '¥0.00');
    await addPlaces(page, ['松风脊']);
    await expectTotals(page, 1, 90, 0, 90, '¥0.00');
    await expect(page.locator('#itinerary-route')).toBeHidden();
    await addPlaces(page, ['雾桥溪', '阶影湖']);
    await expectTotals(page, 3, 275, 40, 315, '¥12.00');
    await addPlaces(page, ['石灯巷', '纸谷书屋', '山麓手作所']);
    await expectTotals(page, 6, 520, 100, 620, '¥78.00');
    await expect(page.locator('[data-selection-count]')).toHaveText('6 / 6');
    await expect(page.locator('[data-place-id="warm-cup"] button')).toBeDisabled();
    await expect(page.locator('#day-warning')).toBeVisible();
    await expect(page.locator('#day-warning')).toContainText('超过 8 小时');
    await page.getByRole('button', { name: '清空行程', exact: true }).click();
    await expectTotals(page, 0, 0, 0, 0, '¥0.00');
    await expect(page.locator('#itinerary-list > li')).toHaveCount(0);
    await expect(page.locator('#itinerary-route')).toHaveAttribute('points', '');
    await expect(page.locator('#itinerary-route')).toBeHidden();
    await expect(page.locator('[data-route-number]:not([hidden])')).toHaveCount(0);
    await expect(page.locator('#day-warning')).toBeHidden();
    await expect(page.getByLabel('筛选地点类型')).toBeFocused();
    await addPlaces(page, ['松风脊']);
    await page.reload();
    await expect(page.locator('[data-trip-planner]')).toHaveAttribute('data-ready', 'true');
    await expectTotals(page, 0, 0, 0, 0, '¥0.00');
});

test('trip keyboard sorting retains the moved stop and removal focuses a neighboring stop', async ({ page }) => {
    await openPlanner(page);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await addPlaces(page, ['松风脊', '雾桥溪', '阶影湖']);
    const move = page.getByRole('button', { name: '上移雾桥溪', exact: true });
    await move.focus();
    await move.press('Enter');
    expect(await itineraryIds(page)).toEqual(['cloud-bridge', 'pine-ridge', 'terrace-lake']);
    expect(await page.evaluate(() => document.activeElement.closest('[data-stop-id]')?.dataset.stopId)).toBe('cloud-bridge');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '下移雾桥溪', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    expect(await itineraryIds(page)).toEqual(['pine-ridge', 'cloud-bridge', 'terrace-lake']);
    const remove = page.getByRole('button', { name: '移除雾桥溪', exact: true });
    await remove.focus();
    await remove.press('Enter');
    expect(await itineraryIds(page)).toEqual(['pine-ridge', 'terrace-lake']);
    await expect(page.getByRole('button', { name: '移除阶影湖', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: '移除松风脊', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('筛选地点类型')).toBeFocused();
});

test('trip planner fits phone and desktop screens without storage or external requests', async ({ page, baseURL }) => {
    const external = [];
    page.on('request', request => {
        if (new URL(request.url()).origin !== new URL(baseURL).origin) external.push(request.url());
    });
    await page.addInitScript(() => {
        for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(window, key, { get() { throw new Error('Storage unavailable'); } });
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [320, 390, 800, 1280]) {
        await page.setViewportSize({ width, height: 960 });
        await openPlanner(page);
        await addPlaces(page, ['松风脊', '雾桥溪']);
        await expectTotals(page, 2, 165, 20, 185, '¥0.00');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        const map = await page.locator('.terrain-map').boundingBox();
        expect(map.width).toBeGreaterThan(0);
        expect(map.width).toBeLessThanOrEqual(width);
        for (const panel of await page.locator('.planner-layout > .panel').all()) {
            expect((await panel.boundingBox()).width).toBeLessThanOrEqual(width);
        }
        await page.goto(`${demoPath}about/`);
        await expect(page.locator('main h1')).toHaveText('行程说明');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    }
    expect(external).toEqual([]);
});

test.describe('trip planner without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('retains eight readable places and the base map with disabled editing controls', async ({ page }) => {
        await page.goto(demoPath);
        await expect(page.locator('main h1')).toHaveCount(1);
        await expect(page.locator('[data-trip-planner]')).toHaveAttribute('data-ready', 'false');
        await expect(page.locator('[data-place-card]')).toHaveCount(8);
        await expect(page.locator('.terrain-map [data-map-id]')).toHaveCount(8);
        await expect(page.locator('.noscript-note')).toBeVisible();
        await expect(page.locator('.noscript-note')).toContainText('只读浏览八个虚构地点');
        await expect(page.getByLabel('筛选地点类型')).toBeDisabled();
        for (const button of await page.locator('button[data-action]').all()) await expect(button).toBeDisabled();
        await expectTotals(page, 0, 0, 0, 0, '¥0.00');
        await expect(page.locator('#itinerary-list > li')).toHaveCount(0);
        await expect(page.locator('#itinerary-route')).toBeHidden();
        await page.goto(`${demoPath}about/`);
        await expect(page.locator('main h1')).toHaveText('行程说明');
        await expect(page.locator('.prose')).toContainText('非真实地理导航');
    });
});

});
}
