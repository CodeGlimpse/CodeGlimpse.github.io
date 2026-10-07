const { test, expect } = require('@playwright/test');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');
const path = require('node:path');

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
        for (const [caseId, templateId] of [['bookstore', 'checklist'], ['trip-planner', 'journal'], ['trip-planner', 'classic'], ['workshop-booking', 'classic']]) {
            await page.goto(targetPath(baseURL, demoFor(caseId, templateId).path));
            const lines = await titleLines(page.locator('main h1'));
            expect(lines.length).toBeGreaterThan(0);
            for (const line of lines) expect(line.replace(/[^\u4e00-\u9fff]/g, '').length).toBeGreaterThanOrEqual(3);
            if (templateId === 'journal') expect(lines).toEqual(['从旧钟楼，', '走到晚茶铺。']);
            if (caseId === 'trip-planner' && templateId === 'classic') expect(lines).toEqual(['把周末，', '走成一条山路。']);
            if (caseId === 'workshop-booking' && templateId === 'classic') expect(lines).toEqual(['给自己，', '留一段手作时间。']);
        }
    });

    test(`all template menus are compact, keyboard accessible and stay in bounds at ${width}px`, async ({ page, baseURL }) => {
        await page.setViewportSize({ width, height: 844 });
        for (const demo of DEMO_REGISTRY) {
            await page.goto(targetPath(baseURL, demo.path));
            const toolbar = page.locator('.demo-toolbar');
            expect((await toolbar.boundingBox()).height, demo.id).toBeLessThanOrEqual(64);
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
                await expect(menu.locator('small')).toHaveText('不同场景，切换后进入对应首页，临时操作将重置。');
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

test('two-line scene menu labels remain compact with full text and usable touch targets', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    for (const demo of DEMO_REGISTRY.filter(item => item.caseId !== 'photo-portfolio')) {
        await page.goto(targetPath(baseURL, demo.path));
        const summary = page.locator('[data-demo-template-menu] > summary');
        // Different system fonts can wrap the same label. Force two lines so
        // this remains reproducible on both Windows and the Ubuntu CI runner.
        await summary.evaluate(element => element.replaceChildren(
            document.createTextNode('场景'), document.createElement('br'), document.createTextNode('两行场景名称')
        ));
        await expect(summary).toHaveText('场景两行场景名称');
        const box = await summary.boundingBox();
        expect(box.height, demo.id).toBeGreaterThanOrEqual(44);
        expect((await page.locator('.demo-toolbar').boundingBox()).height, demo.id).toBeLessThanOrEqual(64);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), demo.id).toBeLessThanOrEqual(320);
        await summary.click();
        await expect(page.locator('[data-demo-template-menu]')).toHaveJSProperty('open', true);
        await expect(page.locator('[data-demo-template-menu] a')).toHaveCount(3);
    }
});

for (const width of [320, 390]) {
    test(`trip map labels remain readable, separate and inside their maps at ${width}px`, async ({ page, baseURL }) => {
        await page.setViewportSize({ width, height: 900 });
        for (const demo of DEMO_REGISTRY.filter(item => item.caseId === 'trip-planner')) {
            await page.goto(targetPath(baseURL, demo.path));
            const labels = await page.locator('.map-place-name').evaluateAll(nodes => nodes.map(node => {
                const box = node.getBoundingClientRect();
                const map = node.ownerSVGElement.getBoundingClientRect();
                const matrix = node.getScreenCTM();
                return { name: node.textContent, x: box.x, y: box.y, width: box.width, height: box.height, fontSize: parseFloat(getComputedStyle(node).fontSize) * Math.hypot(matrix.c, matrix.d), left: box.left - map.left, right: box.right - map.right, top: box.top - map.top, bottom: box.bottom - map.bottom };
            }));
            expect(labels).toHaveLength(8);
            for (const label of labels) {
                expect(label.fontSize, `${demo.id}: ${label.name}`).toBeGreaterThanOrEqual(12);
                expect(label.left).toBeGreaterThanOrEqual(-1);
                expect(label.right).toBeLessThanOrEqual(1);
                expect(label.top).toBeGreaterThanOrEqual(-1);
                expect(label.bottom).toBeLessThanOrEqual(1);
            }
            for (let i = 0; i < labels.length; i++) {
                for (const other of labels.slice(i + 1)) {
                    const label = labels[i];
                    const overlaps = Math.min(label.x + label.width, other.x + other.width) > Math.max(label.x, other.x)
                        && Math.min(label.y + label.height, other.y + other.height) > Math.max(label.y, other.y);
                    expect(overlaps, `${demo.id}: ${label.name} / ${other.name}`).toBe(false);
                }
            }
        }
    });
}

test('workspace metrics precede filters and collapsing controls preserves the selected range', async ({ page, baseURL }) => {
    const demo = demoFor('content-dashboard', 'workspace');
    const records = require(path.resolve(__dirname, '..', demo.source, demo.dataDir, 'entries.json'));
    const month = records[0].published.slice(0, 7);
    const channel = records[0].channel;
    const filtered = records.filter(record => record.published.startsWith(month) && record.channel === channel);
    const views = filtered.reduce((sum, record) => sum + record.views, 0).toLocaleString('en-US');
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
    await page.getByLabel('发布月份', { exact: true }).selectOption(month);
    await page.getByLabel('发布载体', { exact: true }).selectOption(channel);
    await expect(page.locator('[data-metric=count]')).toHaveText(String(filtered.length));
    await expect(page.locator('[data-metric=views]')).toHaveText(views);
    await menu.locator('summary').click();
    await page.setViewportSize({ width: 1280, height: 960 });
    await expect(menu).toHaveJSProperty('open', false);
    await menu.locator('summary').click();
    await expect(page.getByLabel('发布月份', { exact: true })).toHaveValue(month);
    await expect(page.getByLabel('发布载体', { exact: true })).toHaveValue(channel);
    await expect(page.locator('[data-metric=views]')).toHaveText(views);
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
