const { test, expect } = require('@playwright/test');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');
const demo = DEMO_REGISTRY.find(item => item.caseId === 'photo-portfolio' && item.templateId === 'gallery');
const route = baseURL => new URL(demo.path, baseURL.replace(/\/?$/, '/')).pathname;

for (const width of [320, 390, 1440]) {
    test(`image-only view preserves selection, restores on Escape, and keeps source detail links at ${width}px`, async ({ page, baseURL }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewportSize({ width, height: 1000 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(route(baseURL));
        const root = page.locator('.cinema-feature');
        await expect(root).toHaveAttribute('data-gallery-ready', 'true');
        const image = page.locator('.feature-picture img').first();
        const bounds = await image.boundingBox();
        expect(bounds.y).toBeLessThan(180);
        expect(bounds.width).toBe(width);
        await expect(image).toHaveCSS('object-fit', 'cover');
        await expect(image).toHaveJSProperty('complete', true);
        if (width < 720) expect(await image.evaluate(node => node.naturalWidth)).toBeGreaterThanOrEqual(850);
        await page.getByRole('button', { name: '只看影像', exact: true }).click();
        const toggle = page.locator('[data-gallery-focus-toggle]');
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await expect(root).toHaveAttribute('data-gallery-focus', 'true');
        await expect(page.locator('.feature-intro')).toHaveCSS('opacity', '0');
        await expect(image).toHaveCSS('object-fit', 'contain');
        await root.press('ArrowRight');
        await expect(root).toHaveAttribute('data-gallery-current', '1');
        await expect(root).toHaveAttribute('data-gallery-focus', 'true');
        const selected = page.locator('[data-gallery-slide][data-current="true"]');
        await expect(selected.locator('.feature-picture img')).toHaveCSS('object-fit', 'contain');
        await root.press('Escape');
        await expect(toggle).toBeFocused();
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await expect(page.locator('.feature-intro')).toHaveCSS('opacity', '1');
        await expect(root).toHaveAttribute('data-gallery-current', '1');
        const link = selected.locator('.feature-work h2 a');
        const target = await link.getAttribute('href');
        await link.click();
        await expect(page).toHaveURL(url => url.pathname === target);
        await expect(page.locator('main h1')).toHaveText('窗边片刻');
        expect(errors).toEqual([]);
    });
}

test.describe('image-led homepage without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('every photograph and detail remains readable while enhancement controls stay unavailable', async ({ page, baseURL }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(route(baseURL));
        await expect(page.locator('main h1')).toHaveText('把片刻的光，留给慢一点的目光。');
        await expect(page.locator('.feature-slide:visible')).toHaveCount(3);
        await expect(page.locator('[data-gallery-focus-toggle]')).toBeHidden();
        for (const control of await page.locator('.cinema-feature button').all()) await expect(control).toBeDisabled();
        for (const link of await page.locator('.feature-work h2 a').all()) {
            await expect(link).toBeVisible();
            expect(await link.getAttribute('href')).toMatch(/\/works\/(rain-street|window-light|low-tide)\/$/);
        }
        await expect(page.locator('.photo-disclosure')).toContainText('AI 生成');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
});
