const { test, expect } = require('@playwright/test');

test('bilingual demo catalog opens both independent portfolio sites', async ({ page }) => {
    for (const prefix of ['', '/en']) {
        await page.goto(`${prefix}/demos/`);
        await expect(page.locator('main h1')).toHaveCount(1);
        await expect(page.locator('.demo-card')).toHaveCount(2);

        const creatorCard = page.locator('.demo-card[href="/demos/creator-portfolio/"]');
        await expect(creatorCard.locator('img')).toHaveAttribute('alt', /.+/);
        await creatorCard.click();
        await expect(page).toHaveURL(/\/demos\/creator-portfolio\/$/);
        await expect(page.locator('main h1')).toContainText('弧光视觉作品集');
        await expect(page.locator('body')).toContainText('虚构演示');
        await expect(page.locator('main img').first()).toHaveJSProperty('complete', true);

        await page.goto(`${prefix}/demos/`);
        const photoCard = page.locator('.demo-card[href="/demos/photo-portfolio/"]');
        await expect(photoCard.locator('img')).toHaveAttribute('src', '/demos/photo-portfolio/previews/rain-street.jpg');
        await expect(photoCard.locator('img')).toHaveAttribute('alt', /.+/);
        await photoCard.scrollIntoViewIfNeeded();
        await expect.poll(() => photoCard.locator('img').evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
        await photoCard.click();
        await expect(page).toHaveURL(/\/demos\/photo-portfolio\/$/);
        await expect(page.locator('main h1')).toHaveCount(1);
        await expect(page.locator('body')).toContainText('虚构演示');
        await expect(page.locator('body')).toContainText('AI 生成');
    }
});

test('photography portfolio navigation opens the work and about pages', async ({ page }) => {
    const demo = '/demos/photo-portfolio';
    await page.goto(`${demo}/`);
    await expect(page.locator(`a[href="${demo}/works/"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="${demo}/about/"]`).first()).toBeVisible();
    await page.locator(`a[href="${demo}/works/"]`).first().click();
    await expect(page).toHaveURL(/\/demos\/photo-portfolio\/works\/$/);

    for (const slug of ['rain-street', 'window-light', 'low-tide']) {
        const detail = `${demo}/works/${slug}/`;
        const link = page.locator(`a[href="${detail}"]`).first();
        await expect(link).toBeVisible();
        await link.click();
        await expect(page).toHaveURL(new RegExp(`/demos/photo-portfolio/works/${slug}/$`));
        await expect(page.locator('main h1')).toHaveCount(1);
        const image = page.locator('main img').first();
        await expect(image).toHaveAttribute('alt', /.+/);
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
        await page.goto(`${demo}/works/`);
    }

    await page.goto(`${demo}/`);
    await page.locator(`a[href="${demo}/about/"]`).first().click();
    await expect(page).toHaveURL(/\/demos\/photo-portfolio\/about\/$/);
    await expect(page.locator('main h1')).toHaveCount(1);
});

test('demo cards and photography portfolio fit desktop and mobile viewports', async ({ page }) => {
    for (const [width, maxCardShare] of [[1280, .4], [800, .55], [390, 1]]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto('/demos/');
        const grid = await page.locator('.demos-grid').boundingBox();
        for (const card of await page.locator('.demo-card').all()) {
            const box = await card.boundingBox();
            const preview = await card.locator('.demo-card-preview').boundingBox();
            expect(box.width / grid.width).toBeLessThanOrEqual(maxCardShare);
            expect(preview.height).toBeLessThanOrEqual(220);
        }

        await page.goto('/demos/photo-portfolio/');
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator('a[href="/demos/photo-portfolio/works/"]').first()).toBeVisible();
        await expect(page.locator('a[href="/demos/photo-portfolio/about/"]').first()).toBeVisible();
        const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(documentWidth).toBeLessThanOrEqual(width + 1);
    }
});
