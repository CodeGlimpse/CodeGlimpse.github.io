const { test, expect } = require('@playwright/test');
test.beforeEach(async ({ page }) => {
    await page.route(/^https:\/\/(?:www\.googletagmanager\.com|www\.clarity\.ms|hm\.baidu\.com)\//i, route => route.fulfill({ body: '', contentType: 'application/javascript' }));
});
for (const prefix of ['', '/en']) for (const path of ['/tools/qrcode/', '/games/gomoku/']) {
    test('feedback prefills only published page context: ' + prefix + path, async ({ page }) => {
        await page.goto(prefix + path + '?private=QUERY_SENTINEL#FRAGMENT_SENTINEL');
        const dismiss = page.locator('[data-privacy-dismiss]'); if (await dismiss.isVisible()) await dismiss.click();
        if (path.startsWith('/tools/')) await page.locator('#qr-input').fill('TOOL_INPUT_SENTINEL');
        else { await page.locator('[data-game-start]').click(); await page.locator('[data-gomoku-place]').click(); }
        const panel = page.locator('.page-feedback');
        await expect(panel).toBeVisible();
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        const title = await page.locator('h1').textContent();
        const issue = new URL(await panel.locator('[data-feedback-issue]').getAttribute('href'));
        expect(issue.origin).toBe('https://github.com');
        expect(issue.pathname).toBe('/CodeGlimpse/CodeGlimpse.github.io/issues/new');
        expect(issue.searchParams.get('template')).toBe('site-feedback.md');
        expect(issue.searchParams.get('title')).toContain(title.trim());
        const email = new URL(await panel.locator('[data-feedback-email]').getAttribute('href'));
        expect(email.protocol).toBe('mailto:'); expect(email.pathname).toBe('libochen@codeglimpse.top');
        expect(email.searchParams.get('subject')).toContain(title.trim());
        for (const url of [issue, email]) {
            expect(url.searchParams.get('body')).toContain(canonical);
            expect(url.searchParams.get('body')).not.toMatch(/QUERY_SENTINEL|FRAGMENT_SENTINEL|TOOL_INPUT_SENTINEL/);
        }
        await page.setViewportSize({ width: 320, height: 812 });
        await panel.scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        for (const link of await panel.locator('a').all()) {
            const bounds = await link.boundingBox(); expect(bounds.height).toBeGreaterThanOrEqual(44);
        }
    });
}
test('feedback panels are limited to tools and games', async ({ page }) => {
    for (const path of ['/', '/about/', '/p/python-environment-mismatch/']) {
        await page.goto(path); await expect(page.locator('.page-feedback')).toHaveCount(0);
    }
});
