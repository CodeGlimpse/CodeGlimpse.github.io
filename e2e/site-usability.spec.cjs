const { test, expect } = require('@playwright/test');
const games = require('../data/games.json');
test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
    await page.route(/^https:\/\/(?:www\.googletagmanager\.com|www\.clarity\.ms|hm\.baidu\.com)\//i,
        route => route.fulfill({ body: '', contentType: 'application/javascript' }));
});
async function open(page, path) {
    await page.goto(path);
    const dismiss = page.locator('[data-privacy-dismiss]');
    if (await dismiss.isVisible()) await dismiss.click();
}

for (const language of ['zh-cn', 'en']) {
    const prefix = language === 'en' ? '/en' : '';
    test(`keeps every home article title linked in ${language}`, async ({ page }) => {
        await open(page, prefix + '/');
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('main h2.article-title > a')).toHaveCount(5);
    });
    test(`removes the standalone search and limits article search to posts in ${language}`, async ({ page, request }) => {
        for (const path of ['/search/', '/search/index.json']) expect((await request.get(prefix + path)).status()).toBe(404);
        await open(page, prefix + '/archives/');
        await expect(page.locator('#main-menu a[href*="/search/"]')).toHaveCount(0);
        const input = page.locator('#article-search');
        await expect(input).toBeVisible();
        await input.fill('ＯＰＥＮＣＬＡＷ');
        await expect(page.locator('.search-result--list article')).toHaveCount(3);
        await expect(page.locator('#article-archives')).toBeHidden();
        await input.fill('扫雷');
        await expect(page.locator('.search-result--list article')).toHaveCount(0);
        await expect(page.locator('#article-results')).toContainText(language === 'en' ? 'No matching articles' : '没有找到');
        await page.locator('[data-article-clear]').click();
        await expect(input).toBeFocused();
        await expect(page.locator('#article-archives')).toBeVisible();
        await input.dispatchEvent('compositionstart');
        await input.fill('python');
        await expect(page.locator('#article-archives')).toBeVisible();
        await input.dispatchEvent('compositionend');
        await expect(page.locator('.search-result--list article')).toHaveCount(1);
        await input.press('Enter');
        await expect(page.locator('.search-result--list article')).toHaveCount(1);
        await input.press('Escape');
        await expect(input).toHaveValue('');
        await expect(page.locator('#article-archives')).toBeVisible();
    });

    test(`normalizes tool searches and localizes feedback in ${language}`, async ({ page }) => {
        await open(page, prefix + '/tools/');
        const input = page.locator('#tool-search');
        await input.fill('ＢＡＳＥ６４');
        await expect(page.locator('.tool-card:visible')).toHaveCount(1);
        await expect(page.locator('#tool-catalog-count')).toHaveText(language === 'en' ? '1 / 22 tools' : '1 / 22 个工具');
        await page.locator('[data-tool-id="base64"] [data-tool-favorite]').click();
        await expect(page.locator('[data-tool-id="base64"] [data-tool-favorite]')).toHaveAttribute('aria-label', language === 'en' ? 'Remove favorite' : '取消收藏');
        await page.locator('[data-tool-search-clear]').click();
        await expect(input).toBeFocused();
        await expect(page.locator('.tool-card:visible')).toHaveCount(22);
        await input.dispatchEvent('compositionstart');
        await input.fill('no-match-sentinel');
        await expect(page.locator('.tool-card:visible')).toHaveCount(22);
        await input.dispatchEvent('compositionend');
        await expect(page.locator('#tool-search-empty')).toBeVisible();
        await input.press('Escape');
        await expect(input).toHaveValue('');
    });

    test(`filters game styles and picks only from the visible games in ${language}`, async ({ page }) => {
        await open(page, prefix + '/games/');
        await page.locator('select[data-game-category]').selectOption('puzzle');
        await expect(page.locator('[data-game-link]:visible')).toHaveCount(games.filter(game => game.category === 'puzzle').length);
        await page.locator('[data-game-search-input]').fill('snake');
        await expect(page.locator('[data-game-random]')).toBeDisabled();
        await page.locator('[data-game-search-clear]').click();
        await page.locator('select[data-game-category]').selectOption('multiplayer');
        await expect(page.locator('[data-game-link]:visible')).toHaveCount(1);
        await page.locator('[data-game-random]').click();
        await expect(page).toHaveURL(new RegExp(prefix + '/games/connect-four/$'));
        await expect(page.locator('[data-game-id]')).toHaveAttribute('data-phase', 'idle');
    });

    test(`preserves JSON text and inputs when entering or leaving focus mode in ${language}`, async ({ page }) => {
        await open(page, prefix + '/tools/json/');
        const input = '{"id":9007199254740993,"n":1e400,"precise":1.234567890123456789,"zero":-0}';
        await page.locator('#json-input').fill(input);
        await page.locator('[data-action="format"]').click();
        expect(await page.locator('#json-output').inputValue()).toContain('9007199254740993');
        expect(await page.locator('#json-output').inputValue()).toContain('1e400');
        await page.locator('[data-tool-focus-toggle]').click();
        await expect(page.locator('.left-sidebar')).toBeHidden();
        await expect(page.locator('#json-input')).toHaveValue(input);
        await page.locator('[data-action="minify"]').click();
        await expect(page.locator('#json-output')).toHaveValue(input);
        await page.keyboard.press('Escape');
        await expect(page.locator('.left-sidebar')).toBeVisible();
        await expect(page.locator('[data-tool-focus-toggle]')).toHaveAttribute('aria-pressed', 'false');
        await expect(page.locator('#json-input')).toHaveValue(input);
        await expect(page.locator('.article-time')).toHaveCount(0);
    });

    test(`copies section links and avoids repeated series recommendations in ${language}`, async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await open(page, prefix + '/p/openclaw-install/');
        const heading = page.locator('.article-content h2[id]').first();
        const id = await heading.getAttribute('id');
        await heading.locator('.heading-copy-link').click();
        const copied = await page.evaluate(() => navigator.clipboard.readText());
        expect(new URL(copied).pathname).toBe(prefix + '/p/openclaw-install/');
        expect(decodeURIComponent(new URL(copied).hash.slice(1))).toBe(id);
        const series = await page.locator('.article-series a').evaluateAll(links => links.map(link => link.pathname));
        const related = await page.locator('.related-content a').evaluateAll(links => links.map(link => link.pathname));
        expect(related.filter(path => series.includes(path))).toEqual([]);
        await expect(page.locator('.article-series ol a')).toHaveCount(3);
    });
}

test('mobile home navigation stays visible without covering the privacy prompt or footer', async ({ page }) => {
    for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        for (const prefix of ['', '/en']) {
            await page.emulateMedia({ colorScheme: 'dark' });
            await page.goto(prefix + '/');
            const nav = page.locator('.mobile-home-nav');
            await expect(nav).toBeVisible();
            const links = nav.locator('a');
            await expect(links).toHaveCount(3);
            expect(await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual([prefix + '/archives/', prefix + '/tools/', prefix + '/games/']);
            const navBox = await nav.boundingBox();
            const notice = page.locator('#codeglimpse-privacy-notice');
            if (await notice.isVisible()) {
                const box = await notice.boundingBox();
                expect(box.y + box.height).toBeLessThanOrEqual(navBox.y);
                await page.locator('[data-privacy-dismiss]').click();
            }
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            expect((await page.locator('.left-sidebar').boundingBox()).height).toBeLessThan(210);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await expect(nav).toBeInViewport();
            const footer = await page.locator('.site-footer').boundingBox();
            expect(footer.y + footer.height).toBeLessThanOrEqual(navBox.y);
            await links.first().click();
            await expect(page.locator('#article-search')).toBeVisible();
            await expect(page.locator('.mobile-home-nav')).toHaveCount(0);
        }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await expect(page.locator('.mobile-home-nav')).toBeHidden();
});

test('article search ignores obsolete async results after clearing and recovers from a failed index', async ({ page }) => {
    await page.route('**/archives/index.json', route => route.fulfill({ status: 503, body: 'unavailable' }));
    await open(page, '/archives/');
    await page.locator('#article-search').fill('python');
    await expect(page.locator('#article-results')).toContainText('暂时无法搜索');
    await expect(page.locator('#article-archives')).toBeVisible();
    await page.unroute('**/archives/index.json');
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/archives/index.json', async route => { await gate; await route.continue(); });
    await page.locator('#article-search').fill('OpenClaw');
    await page.locator('[data-article-clear]').click();
    release();
    await expect(page.locator('#article-archives')).toBeVisible();
    await page.locator('#article-search').fill('python');
    await expect(page.locator('.search-result--list article')).toHaveCount(1);
});

test('article and tool catalogs remain browsable without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    try {
        const page = await context.newPage();
        await page.goto('/archives/');
        await expect(page.locator('#article-archives .article-list--compact article')).toHaveCount(5);
        await expect(page.locator('[data-article-finder]')).toBeHidden();
        await page.goto('/tools/');
        await expect(page.locator('.tool-card:visible')).toHaveCount(22);
        await expect(page.locator('[data-tool-finder]')).toBeHidden();
    } finally { await context.close(); }
});

test('theme initialization and switching work when browser storage throws', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
        for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(window, name, {
            configurable: true, get() { throw new DOMException('Storage disabled', 'SecurityError'); },
        });
    });
    await page.emulateMedia({ colorScheme: 'dark' });
    await open(page, '/games/reaction/');
    await expect(page.locator('html')).toHaveAttribute('data-scheme', 'dark');
    await page.locator('#dark-mode-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-scheme', 'light');
    await page.locator('[data-game-start]').click();
    await expect(page.locator('[data-game-id]')).toHaveAttribute('data-phase', 'playing');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-scheme', 'dark');
    expect(errors).toEqual([]);
});
