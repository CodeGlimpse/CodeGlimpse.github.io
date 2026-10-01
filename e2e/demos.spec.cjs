const { test, expect } = require('@playwright/test');
const { DEMO_CASES, DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');

const photoDemo = DEMO_REGISTRY.find((demo) => demo.id === 'photo-portfolio');
const photoPath = `/${photoDemo.path}`;
const photoWorkPages = photoDemo.checks.pages.filter((path) => /^works\/[^/]+\/$/.test(path));

async function expectImageLoaded(image) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty('complete', true);
    await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
}

async function expectImageAspectRatio(image, aspectRatio) {
    await expectImageLoaded(image);
    const box = await image.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.width / box.height).toBeCloseTo(aspectRatio, 2);
}

test('bilingual demo catalog presents registry copy and opens every demo', async ({ page }) => {
    for (const [prefix, language] of [['', 'zh-cn'], ['/en', 'en']]) {
        for (const demo of DEMO_REGISTRY) {
            await page.goto(`${prefix}/demos/`);
            await expect(page.locator('main h1')).toHaveCount(1);
            await expect(page.locator('.demo-card')).toHaveCount(DEMO_REGISTRY.length);
            await expect(page.locator('.demo-case')).toHaveCount(DEMO_CASES.length);

            const demoPath = `/${demo.path}`;
            const copy = demo.copy[language];
            const card = page.locator(`.demo-card[href="${demoPath}"]`);
            await expect(card.locator('h3')).toHaveText(copy.title);
            await expect(page.locator(`[data-demo-case="${demo.caseId}"] .demo-card-label`)).toHaveText(copy.label);
            await expect(card.locator('.demo-card-copy > p')).toHaveText(copy.description);
            await expect(card.locator('.demo-card-features li')).toHaveText(copy.features);

            const preview = card.locator('.demo-card-preview img');
            await expect(preview).toHaveAttribute('src', `/${demo.preview.image}`);
            await expect(preview).toHaveAttribute('alt', copy.previewAlt);
            await expect(preview).toHaveAttribute('width', String(demo.preview.width));
            await expect(preview).toHaveAttribute('height', String(demo.preview.height));
            await expectImageLoaded(preview);
            await expect(preview).toHaveJSProperty('naturalWidth', demo.preview.width);
            await expect(preview).toHaveJSProperty('naturalHeight', demo.preview.height);
            await expect(preview).toHaveCSS('object-fit', 'contain');

            await card.click();
            await expect(page).toHaveURL((url) => url.pathname === demoPath);
            await expect(page.locator('main h1')).toHaveCount(1);
            for (const text of demo.checks.requiredText) {
                await expect(page.locator('body')).toContainText(text);
            }
            const contentImage = page.locator('main img').first();
            if (await contentImage.count()) await expectImageLoaded(contentImage);
        }
    }
});

for (const demo of DEMO_REGISTRY) {
    test(`${demo.id} pages return to the demo catalog`, async ({ page }) => {
        const demoPath = `/${demo.path}`;
        for (const relativePage of demo.checks.pages) {
            await page.goto(`${demoPath}${relativePage}`);
            const catalogLink = page.locator('[data-demo-catalog]');
            await expect(catalogLink).toHaveCount(1);
            await expect(catalogLink).toHaveAttribute('href', '/demos/');
            await expect(catalogLink).toHaveText('← 返回演示目录');
            await expect(catalogLink).toBeVisible();
            await catalogLink.click();
            await expect(page).toHaveURL((url) => url.pathname === '/demos/');
        }

        await page.goto(demoPath);
        const keyboardLink = page.locator('[data-demo-catalog]');
        await page.keyboard.press('Tab');
        await expect(page.locator('.skip-link')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(keyboardLink).toBeFocused();
        await keyboardLink.press('Enter');
        await expect(page).toHaveURL((url) => url.pathname === '/demos/');
    });
}

test('photography portfolio navigation opens the work and about pages', async ({ page }) => {
    await page.goto(photoPath);
    await expect(page.locator(`a[href="${photoPath}works/"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="${photoPath}about/"]`).first()).toBeVisible();
    await page.locator(`a[href="${photoPath}works/"]`).first().click();
    await expect(page).toHaveURL((url) => url.pathname === `${photoPath}works/`);

    for (const relativePage of photoWorkPages) {
        const detail = `${photoPath}${relativePage}`;
        const link = page.locator(`a[href="${detail}"]`).first();
        await expect(link).toBeVisible();
        await link.click();
        await expect(page).toHaveURL((url) => url.pathname === detail);
        await expect(page.locator('main h1')).toHaveCount(1);
        const image = page.locator('main img').first();
        await expect(image).toHaveAttribute('alt', /.+/);
        await expectImageLoaded(image);
        await page.goto(`${photoPath}works/`);
    }

    await page.goto(photoPath);
    await page.locator(`a[href="${photoPath}about/"]`).first().click();
    await expect(page).toHaveURL((url) => url.pathname === `${photoPath}about/`);
    await expect(page.locator('main h1')).toHaveCount(1);
});

test('demo cards and photography portfolio fit desktop and mobile viewports', async ({ page }) => {
    for (const [width, maxCardShare] of [[1280, .35], [800, .55], [390, 1]]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto('/demos/');
        await expect(page.locator('.demo-card')).toHaveCount(DEMO_REGISTRY.length);
        const grid = await page.locator('.demos-grid').boundingBox();
        for (const card of await page.locator('.demo-card').all()) {
            const box = await card.boundingBox();
            const preview = await card.locator('.demo-card-preview').boundingBox();
            expect(box.width / grid.width).toBeLessThanOrEqual(maxCardShare);
            expect(preview.height).toBeLessThanOrEqual(220);
        }

        await page.goto(photoPath);
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator(`a[href="${photoPath}works/"]`).first()).toBeVisible();
        await expect(page.locator(`a[href="${photoPath}about/"]`).first()).toBeVisible();
        const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(documentWidth).toBeLessThanOrEqual(width + 1);
    }
});

for (const [width, heroAspectRatio] of [[390, 1], [800, 1.24], [1280, 1.24]]) {
    test(`photography portfolio images keep their aspect ratios at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(photoPath);
        const heroImage = page.locator('.hero-picture img');
        await expect(heroImage).toHaveCount(1);
        await expectImageAspectRatio(heroImage, heroAspectRatio);

        const homeImages = page.locator('.selected .work-card-media img');
        await expect(homeImages).toHaveCount(photoWorkPages.length - 1);
        for (const image of await homeImages.all()) {
            await expectImageAspectRatio(image, 1.45);
        }

        await page.goto(`${photoPath}works/`);
        const workImages = page.locator('.works-grid .work-card-media img');
        await expect(workImages).toHaveCount(photoWorkPages.length);
        for (const image of await workImages.all()) {
            await expectImageAspectRatio(image, 1.17);
        }
    });
}
