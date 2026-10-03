const { test, expect } = require('@playwright/test');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');

function demoFor(caseId, templateId) {
    const demo = DEMO_REGISTRY.find(item => item.caseId === caseId && item.templateId === templateId);
    if (!demo) throw new Error(`Missing portfolio template ${caseId}/${templateId}`);
    return demo;
}

function targetPath(demo, route, baseURL) {
    const base = new URL(baseURL);
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    return new URL(demo.path + route, base).pathname;
}

async function openPortfolio(page, demo, route, baseURL) {
    const response = await page.goto(targetPath(demo, route, baseURL));
    expect(response?.ok()).toBe(true);
    await expect(page.locator('body')).toHaveAttribute('data-template', demo.templateId);
    await expect(page.locator('main h1')).toHaveCount(1);
}

test.use({ reducedMotion: 'reduce' });

for (const width of [1280, 320]) {
    test(`digital archive previews a selected source record and opens its actual detail at ${width}px`, async ({ page, baseURL }) => {
        const demo = demoFor('creator-portfolio', 'archive');
        await page.setViewportSize({ width, height: 960 });
        await openPortfolio(page, demo, '', baseURL);
        const root = page.locator('[data-archive]');
        await expect(root).toHaveAttribute('data-archive-ready', 'true');
        const record = root.locator('[data-archive-entry]').last();
        const sourceLink = record.locator('[data-archive-detail]');
        const title = await sourceLink.innerText();
        const detailURL = new URL(await sourceLink.getAttribute('href'), page.url());
        const sourceImage = record.locator('.archive-entry-media img');
        const source = await sourceImage.getAttribute('src');
        const alt = await sourceImage.getAttribute('alt');
        const previewButton = record.locator('[data-archive-preview-button]');
        await expect(previewButton).toBeEnabled();
        await previewButton.click();
        await expect(previewButton).toHaveAttribute('aria-pressed', 'true');
        await expect(root.locator('[data-archive-preview-button][aria-pressed="true"]')).toHaveCount(1);
        await expect(root.locator('[data-archive-preview-title]')).toHaveText(title);
        await expect(root.locator('[data-archive-preview-media] img')).toHaveAttribute('src', source);
        await expect(root.locator('[data-archive-preview-media] img')).toHaveAttribute('alt', alt);
        await expect(root.locator('[data-archive-preview-detail]')).toHaveAttribute('href', detailURL.href);
        await root.locator('[data-archive-preview-detail]').click();
        await expect(page).toHaveURL(url => url.pathname === detailURL.pathname);
        await expect(page.locator('main h1')).toHaveText(title);
    });

    test(`cinema keyboard and thumbnail controls show the chosen image and retain its detail link at ${width}px`, async ({ page, baseURL }) => {
        const demo = demoFor('photo-portfolio', 'gallery');
        await page.setViewportSize({ width, height: 960 });
        await openPortfolio(page, demo, '', baseURL);
        const projector = page.locator('[data-gallery]');
        await expect(projector).toHaveAttribute('data-gallery-ready', 'true');
        const slides = projector.locator('[data-gallery-slide]');
        await expect(slides).toHaveCount(3);
        await expect(slides.nth(0)).toBeVisible();
        await projector.focus();
        await projector.press('ArrowRight');
        await expect(slides.nth(1)).toBeVisible();
        await expect(slides.nth(0)).toBeHidden();
        await expect(projector.locator('[data-gallery-counter]')).toHaveText('02 / 03');
        await projector.press('ArrowLeft');
        await expect(slides.nth(0)).toBeVisible();
        await projector.press('End');
        await expect(slides.nth(2)).toBeVisible();
        await projector.press('ArrowRight');
        await expect(slides.nth(0)).toBeVisible();
        await projector.press('Home');
        await expect(slides.nth(0)).toBeVisible();
        await projector.locator('[data-gallery-select="2"]').click();
        await expect(slides.nth(2)).toBeVisible();
        await expect(projector.locator('[data-gallery-select="2"]')).toBeFocused();
        await expect(projector.locator('[data-gallery-select][aria-pressed="true"]')).toHaveCount(1);
        await expect(projector.locator('[data-gallery-select="2"]')).toHaveAttribute('aria-pressed', 'true');
        const title = await slides.nth(2).getAttribute('data-gallery-title');
        const detailLink = slides.nth(2).locator('.gallery-film-copy :is(h2, h3) a');
        const detailURL = new URL(await detailLink.getAttribute('href'), page.url());
        await expect(projector.locator('[data-gallery-status]')).toContainText(title);
        await detailLink.focus();
        await detailLink.press('ArrowLeft');
        await expect(slides.nth(1)).toBeVisible();
        await expect(projector).toBeFocused();
        await projector.locator('[data-gallery-select="2"]').click();
        await detailLink.click();
        await expect(page).toHaveURL(url => url.pathname === detailURL.pathname);
        await expect(page.locator('main h1')).toHaveText(title);
    });

    test(`cobalt chapter navigation follows the scroll location at ${width}px`, async ({ page, baseURL }) => {
        const demo = demoFor('creator-portfolio', 'editorial');
        await page.setViewportSize({ width, height: 960 });
        await openPortfolio(page, demo, '', baseURL);
        const root = page.locator('[data-editorial]');
        await expect(root).toHaveAttribute('data-editorial-ready', 'true');
        const links = root.locator('[data-editorial-target]');
        const last = links.last();
        const target = await last.getAttribute('data-editorial-target');
        await expect(last).toHaveAttribute('href', `#${target}`);
        await last.click();
        await expect(root.locator(`#${target}`)).toBeInViewport();
        await expect(last).toHaveAttribute('aria-current', 'location');
        await expect(root).toHaveAttribute('data-editorial-current', target);
        await expect(root.locator('[data-editorial-target][aria-current="location"]')).toHaveCount(1);
        await page.evaluate(() => window.scrollTo(0, 0));
        await expect(links.first()).toHaveAttribute('aria-current', 'location');
        await expect(root.locator('[data-editorial-status]')).toHaveText('01 / 04');
    });

    test(`photography magazine progress follows actual reading distance at ${width}px`, async ({ page, baseURL }) => {
        const demo = demoFor('photo-portfolio', 'filmstrip');
        await page.setViewportSize({ width, height: 960 });
        await openPortfolio(page, demo, '', baseURL);
        const reading = page.locator('[data-reading-progress]');
        await expect(reading).toHaveAttribute('data-reading-ready', 'true');
        await expect(reading).toBeVisible();
        await expect(reading.locator('[data-reading-value]')).toHaveText('0%');
        await page.locator('main').evaluate(main => {
            const bounds = main.getBoundingClientRect();
            const start = bounds.top + window.scrollY;
            window.scrollTo(0, start + Math.max(1, bounds.height - window.innerHeight) / 2);
        });
        await expect.poll(async () => Number(await reading.getAttribute('data-reading-percent'))).toBeGreaterThanOrEqual(49);
        expect(Number(await reading.getAttribute('data-reading-percent'))).toBeLessThanOrEqual(51);
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await expect(reading.locator('[data-reading-value]')).toHaveText('100%');
        await expect(reading.locator('[data-reading-meter]')).toHaveJSProperty('value', 100);
        await expect(reading.locator('[data-reading-meter]')).toHaveAttribute('aria-valuetext', '已阅读 100%');
        await reading.locator('a[href="#main"]').click();
        await expect(reading.locator('[data-reading-value]')).toHaveText('0%');
    });
}

test('cinema detail viewer switches between the original cover and near view', async ({ page, baseURL }) => {
    const demo = demoFor('photo-portfolio', 'gallery');
    await openPortfolio(page, demo, 'works/rain-street/', baseURL);
    const projector = page.locator('[data-gallery]');
    await expect(projector).toHaveAttribute('data-gallery-ready', 'true');
    const figures = projector.locator('.detail-figure');
    await expect(figures).toHaveCount(2);
    await expect(figures.nth(0)).toBeVisible();
    await projector.focus();
    await projector.press('ArrowRight');
    await expect(figures.nth(1)).toBeVisible();
    await expect(figures.nth(0)).toBeHidden();
    await expect(figures.nth(1).locator('img')).toHaveAttribute('alt', /自行车轮/);
    await projector.getByRole('button', { name: '放映主图', exact: true }).click();
    await expect(figures.nth(0)).toBeVisible();
    await expect(figures.nth(0).locator('img')).toHaveAttribute('alt', /蓝色傍晚/);
});

test.describe('portfolio presentation controls without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('archive and cinema controls stay unavailable while their source content remains visible', async ({ page, baseURL }) => {
        await openPortfolio(page, demoFor('creator-portfolio', 'archive'), '', baseURL);
        await expect(page.locator('[data-archive-preview]')).toBeHidden();
        for (const button of await page.locator('[data-archive-preview-button]').all()) {
            await expect(button).toBeHidden();
            await expect(button).toBeDisabled();
        }
        for (const record of await page.locator('[data-archive-entry]').all()) await expect(record).toBeVisible();
        await openPortfolio(page, demoFor('photo-portfolio', 'gallery'), '', baseURL);
        await expect(page.locator('[data-gallery-controls]')).toBeHidden();
        await expect(page.locator('[data-gallery-thumbnails]')).toBeHidden();
        for (const slide of await page.locator('[data-gallery-slide]').all()) await expect(slide).toBeVisible();
        for (const button of await page.locator('[data-gallery] button').all()) await expect(button).toBeDisabled();
        await openPortfolio(page, demoFor('photo-portfolio', 'filmstrip'), '', baseURL);
        await expect(page.locator('[data-reading-progress]')).toBeHidden();
        await expect(page.locator('.magazine-cover')).toBeVisible();
    });
});
