const { test, expect } = require('@playwright/test');

test('bilingual demo catalog opens the independent portfolio site', async ({ page }) => {
    for (const prefix of ['', '/en']) {
        await page.goto(`${prefix}/demos/`);
        await expect(page.locator('main h1')).toHaveCount(1);
        const card = page.locator('.demo-card');
        await expect(card).toHaveAttribute('href', '/demos/creator-portfolio/');
        await expect(card.locator('img')).toHaveAttribute('alt', /.+/);
        await card.click();
        await expect(page).toHaveURL(/\/demos\/creator-portfolio\/$/);
        await expect(page.locator('main h1')).toContainText('弧光视觉作品集');
        await expect(page.locator('body')).toContainText('虚构演示');
        await expect(page.locator('main img').first()).toHaveJSProperty('complete', true);
    }
});

test('demo cards use the compact game catalog layout', async ({ page }) => {
    for (const [width, maxCardShare] of [[1280, .4], [800, .55], [390, 1]]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto('/demos/');
        const grid = await page.locator('.demos-grid').boundingBox();
        const card = await page.locator('.demo-card').boundingBox();
        const preview = await page.locator('.demo-card-preview').boundingBox();
        expect(card.width / grid.width).toBeLessThanOrEqual(maxCardShare);
        expect(preview.height).toBeLessThanOrEqual(220);
    }
});
