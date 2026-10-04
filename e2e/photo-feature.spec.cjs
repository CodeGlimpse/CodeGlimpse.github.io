const { test, expect } = require('@playwright/test');
const { createHash } = require('node:crypto');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');
const photoDemos = DEMO_REGISTRY.filter(demo => demo.caseId === 'photo-portfolio');
const openings = { classic: '.portrait-opening', gallery: '.nature-opening', filmstrip: '.astro-opening' };
const detailPattern = /^works\/[^/]+\/$/;

function pagePath(demo, route, baseURL) {
    const base = new URL(baseURL);
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    return new URL(demo.path + route, base).pathname;
}

function detailRoutes(demo) {
    return demo.checks.pages.filter(route => detailPattern.test(route));
}

async function openPhoto(page, demo, route, baseURL) {
    const destination = pagePath(demo, route, baseURL);
    const response = await page.goto(destination);
    expect(response?.ok(), `${destination} must exist`).toBe(true);
    await expect(page.locator('body')).toHaveAttribute('data-template', demo.templateId);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main h1')).toBeVisible();
}

async function expectImageLoaded(image) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute('alt', /\S/);
    await expect(image).toHaveJSProperty('complete', true);
    await expect.poll(() => image.evaluate(node => node.naturalWidth)).toBeGreaterThan(0);
}

async function expectNoOverflow(page, width) {
    const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        page: document.documentElement.scrollWidth,
    }));
    expect(dimensions.viewport).toBeGreaterThan(0);
    expect(dimensions.viewport).toBeLessThanOrEqual(width);
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function expectHomepageWorks(page, demo, baseURL) {
    const routes = detailRoutes(demo);
    expect(routes).toHaveLength(3);
    const links = await page.locator('main a[href]').evaluateAll(anchors => anchors
        .map(anchor => new URL(anchor.href))
        .filter(url => /\/works\/[^/]+\/$/.test(url.pathname))
        .map(url => ({ pathname: url.pathname, origin: url.origin, search: url.search, hash: url.hash })));
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const link of links) {
        expect(link.origin).toBe(new URL(page.url()).origin);
        expect(link.search).toBe('');
        expect(link.hash).toBe('');
    }
    expect([...new Set(links.map(link => link.pathname))].sort())
        .toEqual(routes.map(route => pagePath(demo, route, baseURL)).sort());
    await expect(page.locator('main img')).toHaveCount(3);
    for (const image of await page.locator('main img').all()) await expectImageLoaded(image);
}

test.use({ reducedMotion: 'reduce' });

for (const [index, demo] of photoDemos.entries()) {
    for (const width of [320, 390, 1440]) {
        test(`${demo.templateId} photography has its own works, homepage switching and original-image dialog at ${width}px`, async ({ page, baseURL }) => {
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.setViewportSize({ width, height: 960 });
            await openPhoto(page, demo, '', baseURL);
            const heading = (await page.locator('main h1').textContent()).trim();
            await expect(page.locator(openings[demo.templateId])).toHaveCount(1);
            await expect(page.locator('[data-gallery], [data-reading-progress]')).toHaveCount(0);
            await expect(page.locator('.image-dialog')).toBeHidden();
            await expectHomepageWorks(page, demo, baseURL);
            await expectNoOverflow(page, width);

            const menu = page.locator('[data-demo-template-menu]');
            await menu.locator('summary').click();
            for (const sibling of photoDemos) {
                const link = menu.locator(`a[data-demo-template="${sibling.templateId}"]`);
                await expect(link).toBeVisible();
                await expect(link).toHaveAttribute('href', pagePath(sibling, '', baseURL));
            }
            const sibling = photoDemos[(index + 1) % photoDemos.length];
            await menu.locator(`a[data-demo-template="${sibling.templateId}"]`).click();
            await expect(page).toHaveURL(url => url.pathname === pagePath(sibling, '', baseURL));
            await expect(page.locator('body')).toHaveAttribute('data-template', sibling.templateId);
            await expect(page.locator('main h1')).not.toHaveText(heading);

            for (const route of detailRoutes(demo)) {
                await openPhoto(page, demo, route, baseURL);
                const image = page.locator('.detail-figure img');
                await expect(image).toHaveCount(1);
                await expectImageLoaded(image);
                await expect(image).toHaveCSS('object-fit', 'contain');
                const opener = page.locator('button[data-image]');
                await expect(opener).toHaveCount(1);
                await expect(opener).toBeVisible();
                const original = await opener.getAttribute('data-image');
                const source = new URL(original, page.url());
                expect(source.origin).toBe(new URL(page.url()).origin);
                expect(source.pathname.startsWith(pagePath(demo, route, baseURL))).toBe(true);
                const response = await page.request.get(source.href);
                expect(response.ok(), `${source.pathname} must load`).toBe(true);
                expect(response.headers()['content-type']).toMatch(/^image\//);
                expect((await response.body()).length).toBeGreaterThan(0);

                await opener.click();
                const dialog = page.locator('.image-dialog');
                await expect(dialog).toBeVisible();
                await expect(dialog).toHaveJSProperty('open', true);
                const fullImage = dialog.locator('img');
                await expect(fullImage).toHaveAttribute('src', original);
                await expect(fullImage).toHaveAttribute('alt', await image.getAttribute('alt'));
                await expect(fullImage).toHaveCSS('object-fit', 'contain');
                await expectImageLoaded(fullImage);
                const bounds = await dialog.boundingBox();
                expect(bounds.x).toBeGreaterThanOrEqual(0);
                expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
                await page.keyboard.press('Escape');
                await expect(dialog).toBeHidden();
                await expect(opener).toBeFocused();
                await opener.click();
                await dialog.locator('[data-close-image]').click();
                await expect(dialog).toBeHidden();
                await expect(opener).toBeFocused();
                await expectNoOverflow(page, width);
            }
            expect(errors).toEqual([]);
        });
    }
}

test('photography genres have distinct authored titles, work routes and original photograph bytes', async ({ page, baseURL }) => {
    expect(photoDemos).toHaveLength(3);
    const records = [];
    for (const demo of photoDemos) {
        expect(demo.differentContent).toBe(true);
        await openPhoto(page, demo, '', baseURL);
        const title = (await page.locator('main h1').textContent()).trim();
        const routes = detailRoutes(demo);
        expect(routes).toHaveLength(3);
        await openPhoto(page, demo, routes[0], baseURL);
        const source = new URL(await page.locator('button[data-image]').getAttribute('data-image'), page.url());
        expect(source.origin).toBe(new URL(page.url()).origin);
        expect(source.pathname.startsWith(pagePath(demo, routes[0], baseURL))).toBe(true);
        const response = await page.request.get(source.href);
        expect(response.ok()).toBe(true);
        expect(response.headers()['content-type']).toMatch(/^image\//);
        records.push({ title, routes, sha256: createHash('sha256').update(await response.body()).digest('hex') });
    }
    expect(new Set(records.map(record => record.title)).size).toBe(3);
    expect(new Set(records.flatMap(record => record.routes)).size).toBe(9);
    expect(new Set(records.map(record => record.sha256)).size).toBe(3);
});

test.describe('photography without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    for (const [index, demo] of photoDemos.entries()) {
        test(`${demo.templateId} retains every photo, detail and source while original-image controls stay hidden`, async ({ page, baseURL }) => {
            await page.setViewportSize({ width: 390, height: 844 });
            await openPhoto(page, demo, '', baseURL);
            await expectHomepageWorks(page, demo, baseURL);
            await expectNoOverflow(page, 390);
            const menu = page.locator('[data-demo-template-menu]');
            await menu.locator('summary').click();
            const sibling = photoDemos[(index + 1) % photoDemos.length];
            await menu.locator(`a[data-demo-template="${sibling.templateId}"]`).click();
            await expect(page).toHaveURL(url => url.pathname === pagePath(sibling, '', baseURL));
            await expect(page.locator('body')).toHaveAttribute('data-template', sibling.templateId);
            for (const route of detailRoutes(demo)) {
                await openPhoto(page, demo, route, baseURL);
                await expectImageLoaded(page.locator('.detail-figure img'));
                await expect(page.locator('button[data-image]')).toBeHidden();
                await expect(page.locator('button[data-image]')).toHaveJSProperty('hidden', true);
                await expect(page.locator('.image-dialog')).toBeHidden();
                const sources = page.locator('.photo-facts .source-credit a');
                await expect(sources).toHaveCount(2);
                for (const source of await sources.all()) await expect(source).toBeVisible();
                await expectNoOverflow(page, 390);
            }
        });
    }
});
