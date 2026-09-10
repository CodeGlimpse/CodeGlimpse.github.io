const { test, expect } = require('@playwright/test');
const games = require('../data/games.json');

test.beforeEach(async ({ page }) => {
    await page.route(/^https:\/\/(?:www\.googletagmanager\.com|www\.clarity\.ms|hm\.baidu\.com)\//i, route => route.fulfill({ body: '', contentType: 'application/javascript' }));
});

async function catalog(page, prefix = '') {
    await page.goto(prefix + '/games/');
    const dismiss = page.locator('[data-privacy-dismiss]');
    if (await dismiss.isVisible()) await dismiss.click();
    await expect(page.locator('[data-game-finder]')).toBeVisible();
    return page.locator('[data-game-search-input]');
}

for (const language of ['zh-cn', 'en']) {
    const prefix = language === 'en' ? '/en' : '';
    test('filters game names and play styles in ' + language + ' without loading gameplay code', async ({ page }) => {
        const gameRequests = [];
        page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/js/games/')) gameRequests.push(request.url()); });
        const input = await catalog(page, prefix);
        const visible = page.locator('[data-game-link]:visible');
        await expect(visible).toHaveCount(games.length);
        for (const [query, id] of [['ＳＮＡＫＥ', 'snake'], ['扫雷', 'minesweeper'], ['水果 配对', 'memory'], ['四子棋', 'connect-four'], ['tetris', 'falling-blocks'], ['4x4', 'mini-sudoku']]) {
            await input.fill(query);
            await expect(visible).toHaveCount(1);
            await expect(visible).toHaveAttribute('data-game-link', id);
        }
        await input.fill('<img src=x onerror=alert(1)>');
        await expect(visible).toHaveCount(0);
        await expect(page.locator('[data-game-empty]')).toBeVisible();
        await expect(page.locator('img[src="x"]')).toHaveCount(0);
        await expect(page.locator('[data-game-results]')).toContainText(language === 'en' ? 'Showing 0' : '显示 0');
        await page.locator('[data-game-search-clear]').click();
        await expect(input).toBeFocused();
        await expect(visible).toHaveCount(games.length);
        await input.fill('snake');
        let navigations = 0;
        page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations += 1; });
        await input.press('Enter');
        expect(navigations).toBe(0);
        await expect(input).toHaveValue('snake');
        await input.press('Tab');
        await page.keyboard.press('Tab');
        await expect(page.locator('select[data-game-category]')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.locator('[data-game-random]')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(visible).toBeFocused();
        await input.focus();
        await input.press('Escape');
        await expect(input).toHaveValue('');
        await expect(visible).toHaveCount(games.length);
        expect(gameRequests).toEqual([]);
    });
}

test('game search waits for IME composition before changing results', async ({ page }) => {
    const input = await catalog(page);
    await input.dispatchEvent('compositionstart');
    await input.fill('sao');
    await expect(page.locator('[data-game-link]:visible')).toHaveCount(games.length);
    await input.fill('扫雷');
    await input.dispatchEvent('compositionend');
    await expect(page.locator('[data-game-link]:visible')).toHaveCount(1);
    await expect(page.locator('[data-game-link]:visible')).toHaveAttribute('data-game-link', 'minesweeper');
});

test('the complete game catalog stays readable without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    try {
        const page = await context.newPage();
        await page.goto('/games/');
        await expect(page.locator('[data-game-link]:visible')).toHaveCount(games.length);
        await expect(page.locator('[data-game-finder]')).toBeHidden();
        await expect(page.locator('[data-game-empty]')).toBeHidden();
    } finally { await context.close(); }
});

test('game search stays usable on a dark phone layout and opens the matching game', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: 'dark' });
    const input = await catalog(page);
    await input.fill('not-a-real-game-zzzz');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const clear = await page.locator('[data-game-search-clear]').boundingBox();
    expect(clear.width).toBeGreaterThanOrEqual(44);
    expect(clear.height).toBeGreaterThanOrEqual(44);
    await input.fill('井字棋');
    await page.locator('[data-game-link]:visible').click();
    await expect(page.locator('[data-game-id="tic-tac-toe"]')).toHaveAttribute('data-phase', 'idle');
    await expect(page.locator('[data-game-start]')).toBeEnabled();
});
