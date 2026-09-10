const { test, expect } = require('@playwright/test');
const link = require('../assets/js/games/link-pairs-core.js');
test.beforeEach(async ({ page }) => {
    await page.route(/^https:\/\/(?:www\.googletagmanager\.com|www\.clarity\.ms|hm\.baidu\.com)\//i, route => route.fulfill({ body: '', contentType: 'application/javascript' }));
});
async function open(page, id, prefix = '') {
    await page.goto(prefix + '/games/' + id + '/');
    const notice = page.locator('[data-privacy-dismiss]'); if (await notice.isVisible()) await notice.click();
    const root = page.locator('[data-game-id]');
    await root.locator('[data-game-start]').click();
    await expect(root).toHaveAttribute('data-phase', 'playing');
    return root;
}
async function freeze(page) {
    await page.clock.install({ time: new Date('2026-09-10T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-10T00:00:01Z'));
}

for (const prefix of ['', '/en']) {
    test('Schulte supports mistakes, completion, pause and reset ' + prefix, async ({ page }) => {
        await freeze(page);
        const root = await open(page, 'schulte', prefix);
        await root.locator('[data-number="2"]').click();
        await expect(root.locator('[data-schulte-mistakes]')).toHaveText('1');
        await root.locator('[data-number="1"]').click();
        await expect(root.locator('[data-game-score]')).toHaveText('1');
        await page.clock.runFor(2250);
        await root.locator('[data-game-pause]').click();
        const time = await root.locator('[data-game-time]').textContent();
        await page.clock.runFor(5000);
        await expect(root.locator('[data-game-time]')).toHaveText(time);
        await root.locator('[data-game-pause]').click();
        for (let value = 2; value <= 25; value++) await root.locator(`[data-number="${value}"]`).click();
        await expect(root).toHaveAttribute('data-phase', 'won');
        await expect(root.locator('[data-game-score]')).toHaveText('25');
        await root.locator('[data-game-restart]').click();
        await expect(root.locator('[data-game-score]')).toHaveText('0');
        await expect(root.locator('[data-schulte-mistakes]')).toHaveText('0');
        await expect(root.locator('[data-game-time]')).toHaveText('0:00');
    });

    test('Link Pairs hints, shuffles and completes a playable round ' + prefix, async ({ page }) => {
        await freeze(page);
        const root = await open(page, 'link-pairs', prefix);
        await root.locator('[data-link-hint]').click();
        await expect(root.locator('.link-tile.is-hint')).toHaveCount(2);
        await expect(root.locator('[data-link-path]')).not.toHaveAttribute('points', '');
        await root.locator('[data-link-shuffle]').click();
        await expect(root.locator('[data-link-shuffles]')).toHaveText('1');
        await page.clock.runFor(1250);
        await root.locator('[data-game-pause]').click();
        const elapsed = await root.locator('[data-game-time]').textContent();
        await page.clock.runFor(3000);
        await expect(root.locator('[data-game-time]')).toHaveText(elapsed);
        await root.locator('[data-game-pause]').click();
        for (let round = 0; round < 12; round++) {
            const board = await root.locator('[data-cell-index]').evaluateAll(cells => cells.map(cell => Number(cell.dataset.value)));
            const pair = link.findPair(board); expect(pair).not.toBeNull();
            await root.locator(`[data-cell-index="${pair.from}"]`).click();
            await root.locator(`[data-cell-index="${pair.to}"]`).click();
        }
        await expect(root).toHaveAttribute('data-phase', 'won');
        await expect(root.locator('[data-game-score]')).toHaveText('12');
        await root.locator('[data-game-restart]').click();
        await expect(root.locator('[data-game-score]')).toHaveText('0');
        await expect(root.locator('[data-link-shuffles]')).toHaveText('0');
    });

    test('Gomoku requires confirmation and highlights the winning five ' + prefix, async ({ page }) => {
        const root = await open(page, 'gomoku', prefix);
        const sequence = [105,210,106,212,107,214,108,216,109];
        for (let move = 0; move < sequence.length; move++) {
            await root.locator(`[data-cell-index="${sequence[move]}"]`).click();
            await expect(root.locator('[data-game-moves]')).toHaveText(String(move));
            await root.locator('[data-gomoku-place]').click();
        }
        await expect(root).toHaveAttribute('data-phase', 'won');
        await expect(root.locator('.is-winning')).toHaveCount(5);
        await expect(root.locator('[data-game-moves]')).toHaveText('9');
        await root.locator('[data-game-restart]').click();
        await expect(root.locator('[data-game-moves]')).toHaveText('0');
        await root.locator('[data-cell-index="112"]').focus();
        await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
        await expect(root.locator('[data-cell-index="113"]')).toHaveAttribute('data-player', '1');
        await page.keyboard.press('Enter');
        await expect(root.locator('[data-game-moves]')).toHaveText('1');
    });
}

test('new games work without storage and reload starts a new round', async ({ page }) => {
    await page.addInitScript(() => {
        for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(window, name, { configurable: true, get() { throw new DOMException('Blocked', 'SecurityError'); } });
    });
    for (const id of ['schulte', 'link-pairs', 'gomoku']) {
        const root = await open(page, id);
        if (id === 'schulte') await root.locator('[data-number="1"]').click();
        if (id === 'link-pairs') await root.locator('[data-link-shuffle]').click();
        if (id === 'gomoku') await root.locator('[data-gomoku-place]').click();
        await page.reload();
        await expect(root).toHaveAttribute('data-phase', 'idle');
        await root.locator('[data-game-start]').click();
        await expect(root.locator(id === 'gomoku' ? '[data-game-moves]' : '[data-game-score]')).toHaveText('0');
    }
});

test.describe('phone controls', () => {
    test.use({ viewport: { width: 320, height: 812 }, hasTouch: true, isMobile: true, colorScheme: 'dark' });
    test('new game boards fit and Gomoku supports precise touch adjustment', async ({ page }) => {
        for (const id of ['schulte', 'link-pairs', 'gomoku']) {
            const root = await open(page, id);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            if (id === 'schulte') { await root.locator('[data-number="1"]').tap(); await expect(root.locator('[data-game-score]')).toHaveText('1'); }
            if (id === 'link-pairs') {
                const box = await root.locator('[data-cell-index]').first().boundingBox();
                expect(box.width).toBeGreaterThanOrEqual(44);
                await root.locator('[data-link-hint]').tap(); await expect(root.locator('.is-hint')).toHaveCount(2);
            }
            if (id === 'gomoku') {
                await root.locator('[data-gomoku-step="right"]').tap(); await root.locator('[data-gomoku-place]').tap();
                await expect(root.locator('[data-cell-index="113"]')).toHaveAttribute('data-player', '1');
            }
        }
    });
});
