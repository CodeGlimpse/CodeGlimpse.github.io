const { test, expect } = require('@playwright/test');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');

function demoFor(caseId, templateId) {
    return DEMO_REGISTRY.find(demo => demo.caseId === caseId && demo.templateId === templateId);
}

function targetPath(baseURL, relative) {
    return new URL(relative, baseURL.replace(/\/?$/, '/')).pathname;
}

async function titleLines(heading) {
    return heading.evaluate(element => {
        const lines = new Map();
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            for (let index = 0; index < node.length; index++) {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + 1);
                const box = range.getBoundingClientRect();
                if (box.width) {
                    const top = Math.round(box.top);
                    lines.set(top, (lines.get(top) || '') + node.textContent[index]);
                }
            }
        }
        return [...lines.values()];
    });
}

test.use({ reducedMotion: 'reduce' });

for (const width of [320, 390]) {
    test(`mobile first screens expose the work at ${width}px`, async ({ page, baseURL }) => {
        await page.setViewportSize({ width, height: 844 });
        for (const [caseId, templateId, content, limit] of [
            ['creator-portfolio', 'editorial', 'main img', 550],
            ['photo-portfolio', 'gallery', 'main img', 510],
            ['content-dashboard', 'workspace', '.workspace-stat-strip', 360],
            ['workshop-booking', 'agenda', '[data-course-id]', 640],
        ]) {
            await page.goto(targetPath(baseURL, demoFor(caseId, templateId).path));
            const item = page.locator(content).first();
            await expect(item).toBeVisible();
            const box = await item.boundingBox();
            expect(box.y, `${caseId}: meaningful content must enter the first screen`).toBeLessThan(limit);
            expect(box.width).toBeGreaterThan(width * .7);
            expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        }
    });

    test(`Chinese headlines retain complete phrases without orphan characters at ${width}px`, async ({ page, baseURL }) => {
        await page.setViewportSize({ width, height: 844 });
        for (const [caseId, templateId] of [['bookstore', 'checklist'], ['trip-planner', 'journal']]) {
            await page.goto(targetPath(baseURL, demoFor(caseId, templateId).path));
            const lines = await titleLines(page.locator('main h1'));
            expect(lines.length).toBeGreaterThan(0);
            for (const line of lines) expect(line.replace(/[^\u4e00-\u9fff]/g, '').length).toBeGreaterThanOrEqual(3);
            if (templateId === 'journal') expect(lines).toEqual(['把周末，', '走成一条山路。']);
        }
    });

    test(`all template menus are compact, keyboard accessible and stay in bounds at ${width}px`, async ({ page, baseURL }) => {
        await page.setViewportSize({ width, height: 844 });
        for (const demo of DEMO_REGISTRY) {
            await page.goto(targetPath(baseURL, demo.path));
            const toolbar = page.locator('.demo-toolbar');
            expect((await toolbar.boundingBox()).height).toBeLessThanOrEqual(64);
            const menu = page.locator('[data-demo-template-menu]');
            await expect(menu).toHaveJSProperty('open', false);
            await page.keyboard.press('Tab');
            await expect(page.locator('.skip-link')).toBeFocused();
            await page.keyboard.press('Tab');
            await expect(page.locator('[data-demo-catalog]')).toBeFocused();
            await page.keyboard.press('Tab');
            await expect(menu.locator('summary')).toBeFocused();
            await page.keyboard.press('Enter');
            await expect(menu).toHaveJSProperty('open', true);
            if (demo.caseId === 'photo-portfolio') {
                await expect(menu.locator('small')).toHaveText('不同题材与作品，切换后进入对应摄影站首页。');
            } else {
                await expect(menu.locator('small')).toContainText('切换模板将重置');
            }
            for (const link of await menu.locator('a').all()) {
                await expect(link).toBeVisible();
                const box = await link.boundingBox();
                expect(box.height).toBeGreaterThanOrEqual(44);
                expect(box.x).toBeGreaterThanOrEqual(0);
                expect(box.x + box.width).toBeLessThanOrEqual(width);
            }
            await page.keyboard.press('Enter');
            await expect(menu).toHaveJSProperty('open', false);
        }
    });
}

test('workspace metrics precede filters and collapsing controls preserves the selected range', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(targetPath(baseURL, demoFor('content-dashboard', 'workspace').path));
    await expect(page.locator('[data-dashboard]')).toHaveAttribute('data-ready', 'true');
    const menu = page.locator('[data-workspace-filters]');
    await expect(menu).toHaveJSProperty('open', false);
    const readingOrder = await page.evaluate(() => {
        const metrics = document.querySelector('.workspace-stat-strip');
        const filters = document.querySelector('[data-workspace-filters]');
        return Boolean(metrics.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(readingOrder).toBe(true);
    await menu.locator('summary').click();
    await page.getByLabel('发布月份', { exact: true }).selectOption('2026-09');
    await page.getByLabel('内容渠道').selectOption('博客');
    await expect(page.locator('[data-metric=count]')).toHaveText('3');
    await expect(page.locator('[data-metric=views]')).toHaveText('8,020');
    await menu.locator('summary').click();
    await page.setViewportSize({ width: 1280, height: 960 });
    await expect(menu).toHaveJSProperty('open', false);
    await menu.locator('summary').click();
    await expect(page.getByLabel('发布月份', { exact: true })).toHaveValue('2026-09');
    await expect(page.getByLabel('内容渠道')).toHaveValue('博客');
    await expect(page.locator('[data-metric=views]')).toHaveText('8,020');
});

test('nature desktop headline stays readable in a local sand panel without filtering the photograph', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(targetPath(baseURL, demoFor('photo-portfolio', 'gallery').path));
    const heading = page.locator('.nature-title h1');
    await expect(heading).toBeVisible();
    const lines = await titleLines(heading);
    expect(lines.map(line => line.trim())).toEqual(['山野之间，', '慢慢观看。']);
    await expect(page.locator('.nature-title')).toHaveCSS('background-color', 'rgb(238, 233, 220)');
    await expect(page.locator('.nature-opening > img')).toHaveCSS('filter', 'none');
});

for (const width of [390, 1440]) {
    test(`photography opening preserves portrait title lines and astronomy image proportions at ${width}px`, async ({ page, baseURL }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(targetPath(baseURL, demoFor('photo-portfolio', 'classic').path));
        const lines = await titleLines(page.locator('.portrait-title h1'));
        expect(lines.map(line => line.trim())).toEqual(['一张脸，', '一个时代。']);
        await page.goto(targetPath(baseURL, demoFor('photo-portfolio', 'filmstrip').path));
        const image = page.locator('.astro-cover img');
        await expect.poll(() => image.evaluate(node => node.naturalWidth)).toBeGreaterThan(0);
        const ratios = await image.evaluate(node => ({
            rendered: node.getBoundingClientRect().width / node.getBoundingClientRect().height,
            source: node.naturalWidth / node.naturalHeight,
        }));
        expect(ratios.rendered).toBeCloseTo(ratios.source, 2);
    });
}

test('catalog heading aligns with cases and real preview images fill their frames', async ({ page, baseURL }) => {
    for (const language of ['', 'en/']) {
        for (const width of [390, 1440]) {
            await page.setViewportSize({ width, height: 1000 });
            await page.goto(targetPath(baseURL, language + 'demos/'));
            const heading = await page.locator('.demos-heading').boundingBox();
            const grid = await page.locator('.demos-grid').boundingBox();
            expect(heading.x).toBeCloseTo(grid.x, 0);
            expect(heading.width).toBeCloseTo(grid.width, 0);
            for (const card of await page.locator('.demo-card').all()) {
                const preview = await card.locator('img').boundingBox();
                const box = await card.boundingBox();
                expect(preview.width).toBeGreaterThan(box.width * .95);
                expect(preview.width / preview.height).toBeCloseTo(4 / 3, 1);
            }
        }
    }
});
