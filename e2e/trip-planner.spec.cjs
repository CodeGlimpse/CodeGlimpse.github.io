const { test, expect } = require('@playwright/test');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');

function sitePath(baseURL, relative) {
    return new URL(relative, baseURL.endsWith('/') ? baseURL : baseURL + '/').pathname;
}
for (const demo of DEMO_REGISTRY.filter(item => item.caseId === 'trip-planner')) {
test.describe(demo.templateId, () => {
const places = require('../' + demo.source + '/' + (demo.dataDir || 'data') + '/places.json');
const mapScene = { classic: 'mountain', journal: 'oldtown', workbench: 'islands' }[demo.templateId];
const route = selected => selected.map(place => `${Number((place.x * 8).toFixed(2))},${Number((place.y * 5.6).toFixed(2))}`).join(' ');
const timing = selected => {
    let elapsed = 0;
    return selected.map((place, index) => {
        const arrival = elapsed + (index ? 20 : 0);
        elapsed = arrival + place.durationMinutes;
        return `累计 ${arrival} — ${elapsed} 分钟`;
    });
};

async function openPlanner(page, baseURL) {
    await page.goto(sitePath(baseURL, demo.path));
    await expect(page.locator('[data-trip-planner]')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('body')).toHaveAttribute('data-template', demo.templateId);
    await expect(page.locator('.terrain-map')).toHaveAttribute('data-map-scene', mapScene);
}

async function addPlaces(page, names) {
    for (const name of names) await page.getByRole('button', { name: `加入${name}`, exact: true }).click();
}

async function itineraryIds(page) {
    return page.locator('#itinerary-list > li').evaluateAll(items => items.map(item => item.dataset.stopId));
}

async function expectTotals(page, selected) {
    const count = selected.length;
    const stay = selected.reduce((sum, place) => sum + place.durationMinutes, 0);
    const transfer = Math.max(0, selected.length - 1) * 20;
    const total = stay + transfer;
    const budget = `¥${(selected.reduce((sum, place) => sum + place.costCents, 0) / 100).toFixed(2)}`;
    for (const [key, value] of [['count', count], ['stayMinutes', stay], ['transferMinutes', transfer], ['totalMinutes', total], ['costCents', budget]]) {
        await expect(page.locator(`[data-total="${key}"]`)).toHaveText(String(value));
    }
}

test('trip category filters and itinerary reorder keep map lines and numbered stops synchronized', async ({ page, baseURL }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await openPlanner(page, baseURL);
    await expect(page.locator('main h1')).toHaveCount(1);
    expect(await page.locator('#planner-data').evaluate(node => JSON.parse(node.textContent))).toEqual(places);
    await page.getByLabel('筛选地点类型').selectOption('自然');
    await expect(page.locator('[data-place-card]:not([hidden])')).toHaveCount(3);
    await page.getByLabel('筛选地点类型').selectOption('休憩');
    await expect(page.locator('[data-place-card]:not([hidden])')).toHaveCount(2);
    await page.getByLabel('筛选地点类型').selectOption('all');
    await addPlaces(page, [`${places[0].name}`, `${places[1].name}`, `${places[2].name}`]);
    expect(await itineraryIds(page)).toEqual([`${places[0].id}`, `${places[1].id}`, `${places[2].id}`]);
    await expect(page.locator('#itinerary-route')).toHaveAttribute('points', route(places.slice(0, 3)));
    await expect(page.locator(`[data-map-id="${places[1].id}"] [data-route-number]`)).toHaveText('2');
    await expect(page.locator(`[data-place-id="${places[0].id}"] button`)).toBeDisabled();
    await page.getByRole('button', { name: `上移${places[2].name}`, exact: true }).click();
    expect(await itineraryIds(page)).toEqual([`${places[0].id}`, `${places[2].id}`, `${places[1].id}`]);
    await expect(page.locator('#itinerary-route')).toHaveAttribute('points', route([places[0], places[2], places[1]]));
    await expect(page.locator(`[data-map-id="${places[2].id}"] [data-route-number]`)).toHaveText('2');
    await page.getByLabel('筛选地点类型').selectOption('人文');
    expect(await itineraryIds(page)).toEqual([`${places[0].id}`, `${places[2].id}`, `${places[1].id}`]);
    await expect(page.locator('[data-place-card]:not([hidden])')).toHaveCount(3);
    await page.getByRole('button', { name: `移除${places[1].name}`, exact: true }).click();
    await expect(page.locator('#itinerary-route')).toHaveAttribute('points', route([places[0], places[2]]));
    await expect(page.locator('[data-route-number]:not([hidden])')).toHaveCount(2);
    expect(errors).toEqual([]);
});

test('trip totals include transfers, cap selection, warn after eight hours and reset on clear or refresh', async ({ page, baseURL }) => {
    await openPlanner(page, baseURL);
    await expectTotals(page, []);
    await addPlaces(page, [`${places[0].name}`]);
    await expectTotals(page, places.slice(0, 1));
    await expect(page.locator('#itinerary-route')).toBeHidden();
    await addPlaces(page, [`${places[1].name}`, `${places[2].name}`]);
    await expectTotals(page, places.slice(0, 3));
    if (demo.templateId === 'classic') {
        await expect(page.locator('[data-total="totalMinutes"]')).toHaveText('315');
        await expect(page.locator('[data-total="costCents"]')).toHaveText('¥12.00');
        await expect(page.locator('#itinerary-route')).toHaveAttribute('points', '160,156.8 352,112 576,190.4');
    }
    await addPlaces(page, [`${places[3].name}`, `${places[4].name}`, `${places[5].name}`]);
    await expectTotals(page, places.slice(0, 6));
    await expect(page.locator('[data-selection-count]')).toHaveText('6 / 6');
    await expect(page.locator(`[data-place-id="${places[6].id}"] button`)).toBeDisabled();
    await expect(page.locator('#day-warning')).toBeVisible();
    await expect(page.locator('#day-warning')).toContainText('超过 8 小时');
    await page.getByRole('button', { name: '清空行程', exact: true }).click();
    await expectTotals(page, []);
    await expect(page.locator('#itinerary-list > li')).toHaveCount(0);
    await expect(page.locator('#itinerary-route')).toHaveAttribute('points', '');
    await expect(page.locator('#itinerary-route')).toBeHidden();
    await expect(page.locator('[data-route-number]:not([hidden])')).toHaveCount(0);
    await expect(page.locator('#day-warning')).toBeHidden();
    await expect(page.getByLabel('筛选地点类型')).toBeFocused();
    await addPlaces(page, [`${places[0].name}`]);
    await page.reload();
    await expect(page.locator('[data-trip-planner]')).toHaveAttribute('data-ready', 'true');
    await expectTotals(page, []);
});

test('trip keyboard sorting retains the moved stop and removal focuses a neighboring stop', async ({ page, baseURL }) => {
    await openPlanner(page, baseURL);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await addPlaces(page, [`${places[0].name}`, `${places[1].name}`, `${places[2].name}`]);
    const move = page.getByRole('button', { name: `上移${places[1].name}`, exact: true });
    await move.focus();
    await move.press('Enter');
    expect(await itineraryIds(page)).toEqual([`${places[1].id}`, `${places[0].id}`, `${places[2].id}`]);
    expect(await page.evaluate(() => document.activeElement.closest('[data-stop-id]')?.dataset.stopId)).toBe(`${places[1].id}`);
    await page.keyboard.press('Tab');
    if (demo.templateId === 'journal') {
        await expect(page.locator(`[data-stop-note="${places[1].id}"] > summary`)).toBeFocused();
        await page.keyboard.press('Tab');
    }
    await expect(page.getByRole('button', { name: `下移${places[1].name}`, exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    expect(await itineraryIds(page)).toEqual([`${places[0].id}`, `${places[1].id}`, `${places[2].id}`]);
    const remove = page.getByRole('button', { name: `移除${places[1].name}`, exact: true });
    await remove.focus();
    await remove.press('Enter');
    expect(await itineraryIds(page)).toEqual([`${places[0].id}`, `${places[2].id}`]);
    await expect(page.getByRole('button', { name: `移除${places[2].name}`, exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: `移除${places[0].name}`, exact: true })).toBeFocused();
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
        await openPlanner(page, baseURL);
        await addPlaces(page, [`${places[0].name}`, `${places[1].name}`]);
        await expectTotals(page, places.slice(0, 2));
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        const map = await page.locator('.terrain-map').boundingBox();
        expect(map.width).toBeGreaterThan(0);
        expect(map.width).toBeLessThanOrEqual(width);
        for (const panel of await page.locator('.planner-layout > .panel').all()) {
            expect((await panel.boundingBox()).width).toBeLessThanOrEqual(width);
        }
        await page.goto(sitePath(baseURL, demo.path + 'about/'));
        await expect(page.locator('main h1')).toHaveText('行程说明');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    }
    expect(external).toEqual([]);
});

if (demo.templateId === 'journal') {
test('old-town notebook expands independent place notes and preserves an expanded timeline stop through reorder', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await openPlanner(page, baseURL);
    await expect(page.locator('.journal-desk')).toHaveCSS('display', 'grid');
    const notebook = await page.locator('.itinerary-panel').boundingBox();
    const collection = await page.locator('.journal-library').boundingBox();
    const map = await page.locator('.map-panel').boundingBox();
    expect(collection.x).toBeGreaterThanOrEqual(notebook.x + notebook.width);
    expect(map.y).toBeGreaterThan(notebook.y);
    const placeNote = page.locator(`[data-place-id="${places[1].id}"] .journal-place-details`);
    await expect(placeNote).not.toHaveAttribute('open');
    await placeNote.locator('summary').click();
    await expect(placeNote).toHaveAttribute('open', '');
    await expect(placeNote.locator('p')).toContainText(places[1].description);
    await addPlaces(page, [`${places[0].name}`, `${places[1].name}`, `${places[2].name}`]);
    const note = page.locator(`[data-stop-note="${places[1].id}"]`);
    await expect(note).not.toHaveAttribute('open');
    await note.locator('summary').click();
    await expect(note.locator('p')).toBeVisible();
    await expect(note.locator('p')).toContainText(places[1].description);
    await page.getByRole('button', { name: `上移${places[1].name}`, exact: true }).click();
    expect(await itineraryIds(page)).toEqual([`${places[1].id}`, `${places[0].id}`, `${places[2].id}`]);
    await expect(page.locator(`[data-stop-note="${places[1].id}"]`)).toHaveAttribute('open', '');
    expect(await page.locator('#itinerary-list .stop-time').allTextContents()).toEqual(timing([places[1], places[0], places[2]]));
    await expectTotals(page, places.slice(0, 3));
    await page.getByRole('button', { name: `移除${places[1].name}`, exact: true }).click();
    await expect(page.locator(`[data-stop-note="${places[1].id}"]`)).toHaveCount(0);
    await addPlaces(page, [`${places[1].name}`]);
    await expect(page.locator(`[data-stop-note="${places[1].id}"]`)).not.toHaveAttribute('open');
});
}

if (demo.templateId === 'workbench') {
test('island map workspace supports keyboard inspection, adding from the map and collapsing panels without losing the route', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await openPlanner(page, baseURL);
    await expect(page.locator('.workbench-layout')).toHaveCSS('display', 'block');
    await expect(page.locator('.workbench-places')).toHaveCSS('position', 'absolute');
    await expect(page.locator('.workbench-itinerary')).toHaveCSS('position', 'absolute');
    await expect(page.locator('.terrain-map')).toHaveAttribute('role', 'group');
    await expect(page.locator('[data-map-choice][role="button"]')).toHaveCount(8);
    await expect(page.locator('[data-map-choice][tabindex="0"]')).toHaveCount(1);
    const pine = page.locator(`[data-map-id="${places[0].id}"]`);
    const bridge = page.locator(`[data-map-id="${places[1].id}"]`);
    await pine.focus();
    await pine.press('Enter');
    await expect(page.locator('[data-map-inspector]')).toHaveAttribute('data-map-selection', `${places[0].id}`);
    await expect(page.locator('[data-map-inspector-title]')).toHaveText(`${places[0].name}`);
    await expectTotals(page, []);
    await pine.press('ArrowRight');
    await expect(bridge).toBeFocused();
    await bridge.press('Space');
    await expect(bridge).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-map-inspector-copy]')).toContainText(places[1].description);
    await expect(page.locator('[data-map-inspector-meta]')).toContainText(`${places[1].durationMinutes} 分钟`);
    await page.getByRole('button', { name: `将${places[1].name}加入行程`, exact: true }).click();
    await expect(page.locator('[data-map-add]')).toBeDisabled();
    await expect(bridge.locator('[data-route-number]')).toHaveText('1');
    await pine.click();
    await page.getByRole('button', { name: `将${places[0].name}加入行程`, exact: true }).click();
    expect(await itineraryIds(page)).toEqual([`${places[1].id}`, `${places[0].id}`]);
    await expect(page.locator('#itinerary-route')).toHaveAttribute('points', route([places[1], places[0]]));
    await expectTotals(page, places.slice(0, 2));
    const itineraryToggle = page.locator('[data-workbench-panel="itinerary"]');
    await itineraryToggle.click();
    await expect(page.locator('#workbench-itinerary')).toBeHidden();
    await expect(itineraryToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#itinerary-route')).toHaveAttribute('points', route([places[1], places[0]]));
    const lake = page.locator(`[data-map-id="${places[2].id}"]`);
    await bridge.focus();
    await bridge.press('ArrowDown');
    await expect(lake).toBeFocused();
    await lake.press('Enter');
    await page.getByRole('button', { name: `将${places[2].name}加入行程`, exact: true }).click();
    await expect(page.locator('#workbench-itinerary')).toBeVisible();
    await expect(itineraryToggle).toHaveAttribute('aria-expanded', 'true');
    expect(await itineraryIds(page)).toEqual([`${places[1].id}`, `${places[0].id}`, `${places[2].id}`]);
    await page.locator('[data-workbench-panel="places"]').click();
    await expect(page.locator('#workbench-places')).toBeHidden();
    await page.getByRole('button', { name: '清空行程', exact: true }).click();
    await expect(page.locator('#workbench-places')).toBeVisible();
    await expect(page.getByLabel('筛选地点类型')).toBeFocused();
    await expectTotals(page, []);
    await expect(page.locator('#itinerary-route')).toBeHidden();
});
}

test.describe('trip planner without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('retains eight readable places and the base map with disabled editing controls', async ({ page, baseURL }) => {
        await page.goto(sitePath(baseURL, demo.path));
        await expect(page.locator('main h1')).toHaveCount(1);
        await expect(page.locator('[data-trip-planner]')).toHaveAttribute('data-ready', 'false');
        await expect(page.locator('[data-place-card]')).toHaveCount(8);
        await expect(page.locator('.terrain-map [data-map-id]')).toHaveCount(8);
        await expect(page.locator('.terrain-map')).toHaveAttribute('data-map-scene', mapScene);
        for (const place of places) await expect(page.locator(`[data-place-id="${place.id}"]`)).toContainText(place.name);
        await expect(page.locator('.noscript-note')).toBeVisible();
        await expect(page.locator('.noscript-note')).toContainText('只读浏览八个虚构地点');
        await expect(page.getByLabel('筛选地点类型')).toBeDisabled();
        for (const button of await page.locator('button[data-action]').all()) await expect(button).toBeDisabled();
        await expectTotals(page, []);
        await expect(page.locator('#itinerary-list > li')).toHaveCount(0);
        await expect(page.locator('#itinerary-route')).toBeHidden();
        if (demo.templateId === 'journal') {
            await expect(page.locator('.journal-place-details[open]')).toHaveCount(8);
            await expect(page.locator('.field-note-copy:visible')).toHaveCount(8);
        }
        if (demo.templateId === 'workbench') {
            await expect(page.locator('.terrain-map')).toHaveAttribute('role', 'img');
            await expect(page.locator('[data-map-choice][role="button"]')).toHaveCount(0);
            await expect(page.locator('[data-map-choice][tabindex]')).toHaveCount(0);
            for (const button of await page.locator('[data-workbench-panel]').all()) await expect(button).toBeDisabled();
        }
        await page.goto(sitePath(baseURL, demo.path + 'about/'));
        await expect(page.locator('main h1')).toHaveText('行程说明');
        await expect(page.locator('.prose')).toContainText('非真实地理导航');
    });
});

});
}
