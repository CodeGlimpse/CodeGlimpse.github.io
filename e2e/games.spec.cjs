const { test, expect } = require('@playwright/test');
const games = require('../data/games.json');
const ANALYTICS_URL = /^https:\/\/(?:www\.googletagmanager\.com|www\.clarity\.ms|hm\.baidu\.com)\//i;
const resetMetrics = {
    memory: ['[data-memory-moves]', '0'],
    minesweeper: ['[data-mine-cleared]', '0 / 71'],
    'lights-out': ['[data-game-moves]', '0'],
    'sliding-puzzle': ['[data-game-moves]', '0'],
    'connect-four': ['[data-game-moves]', '0'],
};

test.beforeEach(async ({ page }) => {
    await page.route(ANALYTICS_URL, route => route.fulfill({body:'',contentType:'application/javascript'}));
});

async function freezeTime(page) {
    await page.clock.install({ time: new Date('2026-09-07T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-07T12:00:01Z'));
}

async function openGame(page, id, prefix = '') {
    await page.goto(`${prefix}/games/${id}/`);
    const dismiss = page.locator('[data-privacy-dismiss]');
    if (await dismiss.isVisible()) await dismiss.click();
    const root = page.locator(`[data-game-id="${id}"]`);
    await expect(root).toHaveAttribute('data-phase','idle');
    await root.locator('[data-game-start]').click();
    await expect(root).toHaveAttribute('data-phase','playing');
    return root;
}

function contrastRatio(foreground, background) {
    const luminance = value => value.match(/[\d.]+/g).slice(0,3)
        .map(channel => Number(channel) / 255)
        .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
        .reduce((sum,channel,index) => sum + channel * [.2126,.7152,.0722][index],0);
    const values = [luminance(foreground),luminance(background)].sort((a,b) => b-a);
    return (values[0]+.05)/(values[1]+.05);
}

for (const language of ['zh-cn','en']) {
    const prefix = language === 'en' ? '/en' : '';
    test(`lists inline games without loading their code in ${language}`, async ({page}) => {
        const requests = [];
        page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/js/games/')) requests.push(request.url()); });
        await page.goto(`${prefix}/games/`);
        await expect(page.locator('h1')).toHaveText(language === 'en' ? 'Games' : '游戏');
        await expect(page.locator('[data-game-link]')).toHaveCount(games.length);
        await expect(page.locator(`#main-menu a[href="${prefix}/games/"]`)).toHaveAttribute('aria-current','page');
        await expect(page.locator('iframe')).toHaveCount(0);
        expect(requests).toEqual([]);
        for (const game of games) await expect(page.locator(`[data-game-link="${game.id}"]`)).toHaveAttribute('href',`${prefix}/games/${game.id}/`);
    });

    for (const game of games) {
        test(`plays ${game.id} directly on its ${language} page`, async ({page}) => {
            await freezeTime(page);
            const modules = [];
            page.on('request', request => { if (new URL(request.url()).pathname.startsWith(`/js/games/${game.id}.`)) modules.push(request.url()); });
            await page.goto(`${prefix}/games/${game.id}/`);
            const dismiss = page.locator('[data-privacy-dismiss]');
            if (await dismiss.isVisible()) await dismiss.click();
            const root = page.locator(`[data-game-id="${game.id}"]`);
            await expect(page.locator('h1')).toHaveCount(1);
            await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content','website');
            await expect(root).toHaveAttribute('data-clarity-mask','true');
            expect(modules).toEqual([]);
            await root.locator('[data-game-start]').click();
            await expect(root).toHaveAttribute('data-phase','playing');
            expect(modules.length).toBeGreaterThan(0);
            await expect(page.locator('iframe')).toHaveCount(0);
            await expect(page.locator(`#main-menu a[href="${prefix}/games/"]`)).toHaveAttribute('aria-current','location');
            await root.locator('[data-game-pause]').click();
            await expect(root).toHaveAttribute('data-phase','paused');
            await root.locator('[data-game-pause]').click();
            await expect(root).toHaveAttribute('data-phase','playing');
            await root.locator('[data-game-restart]').click();
            const [metric, value] = resetMetrics[game.id] || ['[data-game-score]', '0'];
            await expect(root.locator(metric)).toHaveText(value);
        });
    }
}

test('memory locks two cards, pauses the round, and clears old timers on restart', async ({page}) => {
    await freezeTime(page);
    await page.addInitScript(() => { Math.random = () => .999; });
    const root = await openGame(page,'memory');
    const cards = root.locator('[data-card-index]');
    await expect(cards.nth(0)).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(cards.nth(1)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(root.locator('[data-memory-moves]')).toHaveText('1');
    await expect(cards.nth(2)).toBeDisabled();
    await root.locator('[data-game-pause]').click();
    const time = await root.locator('[data-memory-time]').textContent();
    await page.clock.fastForward(2000);
    await expect(root.locator('[data-memory-time]')).toHaveText(time);
    await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0);
    await root.locator('[data-game-pause]').click();
    await expect(root.locator('[aria-pressed="true"]')).toHaveCount(2);
    await root.locator('[data-game-restart]').click();
    await cards.nth(0).click();
    await page.clock.fastForward(1000);
    await expect(cards.nth(0)).toHaveAttribute('aria-pressed','true');
    await expect(root.locator('[data-memory-moves]')).toHaveText('0');
});

test('snake moves on the page and stops while paused or outside the game', async ({page}) => {
    await freezeTime(page);
    const root = await openGame(page,'snake');
    const board = root.locator('canvas');
    const snapshot = () => board.evaluate(canvas => canvas.toDataURL());
    const initial = await snapshot();
    await page.keyboard.press('ArrowDown');
    await page.clock.runFor(200);
    expect(await snapshot()).not.toBe(initial);
    await root.locator('[data-game-pause]').click();
    const paused = await snapshot();
    await page.clock.fastForward(5000);
    expect(await snapshot()).toBe(paused);
    await root.locator('[data-game-pause]').click();
    await page.locator('h1').click();
    await expect(root).toHaveAttribute('data-phase','paused');
    await expect(board).not.toBeFocused();
    await page.keyboard.press('Space');
    await expect(root).toHaveAttribute('data-phase','paused');
});

test('2048 merges once, supports pointer swipes, and leaves outside keys alone', async ({page}) => {
    await page.addInitScript(() => { Math.random = () => .1; });
    const root = await openGame(page,'2048');
    await page.keyboard.press('ArrowLeft');
    await expect(root.locator('[data-game-score]')).toHaveText('4');
    const board = root.locator('[data-puzzle-board]');
    const before = await board.textContent();
    const box = await board.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * .25);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * .8);
    await page.mouse.up();
    expect(await board.textContent()).not.toBe(before);
    await page.evaluate(() => {
        document.body.tabIndex = -1;
        document.body.focus();
        document.addEventListener('keydown', event => { window.outsideGameKeyPrevented = event.defaultPrevented; }, {once:true});
    });
    const outside = await board.textContent();
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(() => window.outsideGameKeyPrevented)).toBe(false);
    expect(await board.textContent()).toBe(outside);
});

test('games work without browser storage and start fresh after a reload', async ({page}) => {
    await page.addInitScript(() => {
        for (const name of ['localStorage','sessionStorage']) Object.defineProperty(window,name,{configurable:true,get(){throw new DOMException('Storage disabled','SecurityError');}});
        Math.random = () => .1;
    });
    const root = await openGame(page,'2048');
    await page.keyboard.press('ArrowLeft');
    await expect(root.locator('[data-game-score]')).toHaveText('4');
    await page.reload();
    await expect(root).toHaveAttribute('data-phase','idle');
    await expect(root.locator('[data-game-score]')).toHaveText('0');
    await root.locator('[data-game-start]').click();
    await expect(root).toHaveAttribute('data-phase','playing');
    await expect(root.locator('[data-game-score]')).toHaveText('0');
});

test('shows a useful retry message when an unvisited game module cannot load', async ({page,context}) => {
    await page.goto('/games/memory/');
    const root = page.locator('[data-game-id="memory"]');
    await expect(root.locator('[data-game-start]')).toBeEnabled();
    await context.setOffline(true);
    await root.locator('[data-game-start]').click();
    await expect(root).toHaveAttribute('data-phase','error');
    await expect(root.locator('[data-game-status]')).toContainText('重新加载');
    await expect(root.locator('[data-game-start]')).toHaveText('重新加载页面');
    await expect(root.locator('[data-game-pause]')).toBeHidden();
});

test('games fit a phone and expose usable touch controls', async ({page}) => {
    test.setTimeout(120000);
    await page.setViewportSize({width:375,height:812});
    await page.emulateMedia({colorScheme:'dark'});
    await freezeTime(page);
    const targets = {
        memory: '[data-card-index]', snake: '[data-direction]', '2048': '[data-direction]',
        minesweeper: '[data-mine-mode="flag"]', breakout: '[data-breakout-launch]',
        'whack-a-mole': '[data-cell-index]', 'lights-out': '[data-cell-index]',
        'sliding-puzzle': '.is-movable', 'tap-flight': '[data-flight-flap]',
        'connect-four': '[data-game-restart]',
    };
    for (const {id} of games) {
        const root = await openGame(page,id);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const panel = await root.boundingBox();
        expect(panel.y).toBeGreaterThanOrEqual(0);
        expect(panel.y + panel.height).toBeLessThanOrEqual(812);
        const colors = await page.locator('.game-instructions').evaluate(element => ({
            background:getComputedStyle(element).backgroundColor,
            text:getComputedStyle(element.querySelector('p')).color,
            heading:getComputedStyle(element.querySelector('h2')).color,
        }));
        expect(contrastRatio(colors.text,colors.background)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(colors.heading,colors.background)).toBeGreaterThanOrEqual(3);
        const target = root.locator(targets[id]).first();
        const box = await target.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        await target.click();
        await expect(root).toHaveAttribute('data-phase', /^(playing|won)$/);
    }
});

test('minesweeper supports flags, a safe first reveal, paused time, loss and a clean restart', async ({page}) => {
    await freezeTime(page);
    await page.addInitScript(() => { Math.random = () => .1; });
    const root = await openGame(page, 'minesweeper');
    const cells = root.locator('[data-cell-index]');
    await page.keyboard.press('f');
    await expect(root.locator('[data-mine-flags]')).toHaveText('1 / 10');
    await page.keyboard.press('Enter');
    await expect(root.locator('[data-mine-cleared]')).toHaveText('0 / 71');
    await page.keyboard.press('f');
    await page.keyboard.press('Enter');
    await expect(cells.nth(0)).toHaveClass(/is-revealed/);
    await expect(root).toHaveAttribute('data-phase', 'playing');
    await page.clock.runFor(1200);
    await expect(root.locator('[data-game-time]')).toHaveText('0:01');
    await page.keyboard.press('p');
    await page.clock.fastForward(5000);
    await expect(root.locator('[data-game-time]')).toHaveText('0:01');
    await page.keyboard.press('p');
    await cells.nth(2).click();
    await expect(root).toHaveAttribute('data-phase', 'over');
    await expect(cells.nth(2)).toHaveClass(/is-exploded/);
    await expect(root.locator('[data-game-overlay]')).toBeHidden();
    await root.locator('[data-game-restart]').click();
    await expect(root.locator('[data-game-time]')).toHaveText('0:00');
    await expect(root.locator('[data-mine-cleared]')).toHaveText('0 / 71');
    await root.locator('[data-mine-mode="flag"]').click();
    await cells.nth(80).click();
    await expect(cells.nth(80)).toHaveText('⚑');
    await expect(root.locator('[data-mine-flags]')).toHaveText('1 / 10');
});

test('lights out handles keyboard toggles, a solved board, pause and restart', async ({page}) => {
    await page.addInitScript(() => { Math.random = () => .999; });
    const root = await openGame(page, 'lights-out');
    const cells = root.locator('[data-cell-index]');
    await expect(root.locator('[data-lights-on]')).toHaveText('3');
    await page.keyboard.press('Enter');
    await expect(root).toHaveAttribute('data-phase', 'won');
    await expect(root.locator('[data-game-moves]')).toHaveText('1');
    await expect(root.locator('[data-lights-on]')).toHaveText('0');
    await expect(root.locator('[data-game-overlay]')).toBeHidden();
    await expect(cells.nth(1)).toBeDisabled();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(root.locator('[data-game-moves]')).toHaveText('1');
    await root.locator('[data-game-restart]').click();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await expect(cells.nth(1)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(root.locator('[data-game-moves]')).toHaveText('1');
    await expect(cells.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(cells.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('p');
    await page.keyboard.press('Enter');
    await expect(root.locator('[data-game-moves]')).toHaveText('1');
    await page.keyboard.press('p');
    await expect(root).toHaveAttribute('data-phase', 'playing');
});

test('sliding puzzle distinguishes taps from swipes and moves the blank with keyboard input', async ({page}) => {
    await page.addInitScript(() => { Math.random = () => .1; });
    const root = await openGame(page, 'sliding-puzzle');
    const board = root.locator('[data-sliding-board]');
    const clicked = root.locator('.is-movable').first();
    const index = await clicked.getAttribute('data-slide-index');
    await clicked.click();
    await expect(board).toBeFocused();
    await expect(root.locator('[data-game-moves]')).toHaveText('1');
    await expect(root.locator('[data-slide-index="' + index + '"]')).toHaveAttribute('data-value', '0');
    for (let count = 0; count < 2; count += 1) await page.keyboard.press('ArrowUp');
    for (let count = 0; count < 2; count += 1) await page.keyboard.press('ArrowLeft');
    await expect(root.locator('[data-slide-index="0"]')).toHaveAttribute('data-value', '0');
    const before = Number(await root.locator('[data-game-moves]').textContent());
    await page.keyboard.press('ArrowLeft');
    await expect(root.locator('[data-game-moves]')).toHaveText(String(before));
    const box = await board.boundingBox();
    await page.mouse.move(box.x + box.width * .2, box.y + box.height * .5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .8, box.y + box.height * .5);
    await page.mouse.up();
    await expect(root.locator('[data-slide-index="1"]')).toHaveAttribute('data-value', '0');
    await expect(root.locator('[data-game-moves]')).toHaveText(String(before + 1));
    await page.keyboard.press('Space');
    await expect(root).toHaveAttribute('data-phase', 'paused');
    await page.keyboard.press('ArrowLeft');
    await expect(root.locator('[data-game-moves]')).toHaveText(String(before + 1));
});

test('connect four alternates players, highlights a win and supports keyboard columns', async ({page}) => {
    const root = await openGame(page, 'connect-four');
    const columns = root.locator('[data-connect-column]');
    for (const column of [0, 0, 1, 1, 2, 2, 3]) await columns.nth(column).click();
    await expect(root).toHaveAttribute('data-phase', 'won');
    await expect(root.locator('[data-game-status]')).toContainText('玩家 1');
    await expect(root.locator('[data-winning="true"]')).toHaveCount(4);
    await expect(columns.first()).toBeDisabled();
    await root.locator('[data-game-restart]').click();
    await expect(root.locator('[data-game-moves]')).toHaveText('0');
    await page.keyboard.press('ArrowLeft');
    await expect(root.locator('[data-connect-board]')).toHaveAttribute('data-selected-column', '2');
    await page.keyboard.press('Enter');
    await expect(root.locator('[data-connect-turn]')).toHaveText('玩家 2');
    await expect(root.locator('[data-connect-cell]').nth(37)).toHaveAttribute('data-player', '1');
    await page.keyboard.press('p');
    await page.keyboard.press('Enter');
    await expect(root.locator('[data-game-moves]')).toHaveText('1');
    await page.keyboard.press('p');
    await page.keyboard.press('Space');
    await expect(root.locator('[data-game-moves]')).toHaveText('2');
});

test('whack a mole scores once per mole and counts only unpaused round time', async ({page}) => {
    await freezeTime(page);
    await page.addInitScript(() => { Math.random = () => .999; });
    const root = await openGame(page, 'whack-a-mole');
    await page.keyboard.press('9');
    await expect(root.locator('[data-game-score]')).toHaveText('10');
    await page.keyboard.press('9');
    await expect(root.locator('[data-game-score]')).toHaveText('10');
    await page.clock.runFor(1300);
    await expect(root.locator('[data-up="true"]')).toHaveCount(1);
    await expect(root.locator('[data-up="true"]')).toHaveAttribute('data-cell-index', '7');
    await page.keyboard.press('p');
    const time = await root.locator('[data-game-time]').textContent();
    await page.clock.fastForward(30000);
    await expect(root.locator('[data-game-time]')).toHaveText(time);
    await page.keyboard.press('p');
    await page.clock.fastForward(45000);
    await expect(root).toHaveAttribute('data-phase', 'over');
    await expect(root.locator('[data-game-time]')).toHaveText('0');
    await expect(root.locator('[data-game-score]')).toHaveText('10');
    await root.locator('[data-game-restart]').click();
    await expect(root.locator('[data-game-time]')).toHaveText('45');
    await expect(root.locator('[data-game-score]')).toHaveText('0');
    await page.clock.runFor(100);
    await expect(root).toHaveAttribute('data-phase', 'playing');
});

test('breakout launches, responds to held keys, scores and freezes its canvas when paused', async ({page}) => {
    await freezeTime(page);
    const root = await openGame(page, 'breakout');
    const canvas = root.locator('canvas');
    const snapshot = () => canvas.evaluate(element => element.toDataURL());
    const ready = await snapshot();
    await root.locator('[data-breakout-launch]').click();
    await expect(root.locator('[data-breakout-launch]')).toBeDisabled();
    await page.keyboard.down('ArrowRight');
    await page.clock.runFor(100);
    await page.keyboard.up('ArrowRight');
    expect(await snapshot()).not.toBe(ready);
    await page.keyboard.press('p');
    const paused = await snapshot();
    await page.clock.fastForward(5000);
    expect(await snapshot()).toBe(paused);
    await page.keyboard.press('p');
    await page.clock.runFor(1500);
    expect(Number(await root.locator('[data-game-score]').textContent())).toBeGreaterThan(0);
    await root.locator('[data-game-restart]').click();
    await expect(root.locator('[data-game-lives]')).toHaveText('3');
    await expect(root.locator('[data-breakout-launch]')).toBeEnabled();
    await expect(root.locator('[data-game-score]')).toHaveText('0');
    await canvas.click();
    await expect(root.locator('[data-breakout-launch]')).toBeDisabled();
});

test('tap flight responds to flap controls, pauses physics and restarts after a collision', async ({page}) => {
    await freezeTime(page);
    const root = await openGame(page, 'tap-flight');
    const canvas = root.locator('canvas');
    const snapshot = () => canvas.evaluate(element => element.toDataURL());
    const initial = await snapshot();
    await page.keyboard.press('Space');
    await page.clock.runFor(150);
    expect(await snapshot()).not.toBe(initial);
    await page.keyboard.press('p');
    const paused = await snapshot();
    await page.clock.fastForward(5000);
    expect(await snapshot()).toBe(paused);
    await page.keyboard.press('p');
    await page.keyboard.press('ArrowUp');
    await page.clock.runFor(2000);
    await expect(root).toHaveAttribute('data-phase', 'over');
    await expect(root.locator('[data-flight-flap]')).toBeDisabled();
    await root.locator('[data-game-restart]').click();
    await expect(root.locator('[data-game-score]')).toHaveText('0');
    await root.locator('[data-flight-flap]').click();
    await page.clock.runFor(64);
    await expect(root).toHaveAttribute('data-phase', 'playing');
});

test('every new game remains playable with storage blocked and reload clears its round', async ({page}) => {
    test.setTimeout(120000);
    await freezeTime(page);
    await page.addInitScript(() => {
        for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(window, name, {
            configurable: true, get() { throw new DOMException('Storage disabled', 'SecurityError'); },
        });
        Math.random = () => .1;
    });
    for (const id of ['minesweeper', 'breakout', 'whack-a-mole', 'lights-out', 'sliding-puzzle', 'tap-flight', 'connect-four']) {
        const root = await openGame(page, id);
        if (id === 'minesweeper' || id === 'lights-out') await root.locator('[data-cell-index]').first().click();
        if (id === 'whack-a-mole') await page.keyboard.press('1');
        if (id === 'sliding-puzzle') await root.locator('.is-movable').first().click();
        if (id === 'connect-four') await root.locator('[data-connect-column]').first().click();
        if (id === 'breakout' || id === 'tap-flight') {
            await page.keyboard.press('Space');
            await page.clock.runFor(100);
        }
        const snapshot = () => root.locator('canvas').count().then(count => count
            ? root.locator('canvas').evaluate(canvas => canvas.toDataURL())
            : root.locator('[data-mine-board], [data-mole-board], [data-lights-board], [data-sliding-board], [data-connect-board]').evaluate(board => board.innerHTML));
        const played = await snapshot();
        await page.reload();
        await expect(root).toHaveAttribute('data-phase', 'idle');
        await root.locator('[data-game-start]').click();
        await expect(root).toHaveAttribute('data-phase', 'playing');
        const [metric, value] = resetMetrics[id] || ['[data-game-score]', '0'];
        await expect(root.locator(metric)).toHaveText(value);
        expect(await snapshot()).not.toBe(played);
    }
});

test.describe('actual touch input', () => {
    test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, colorScheme: 'dark' });
    test('new games accept taps and keep dense boards inside the phone viewport', async ({page}) => {
        test.setTimeout(120000);
        await freezeTime(page);
        await page.addInitScript(() => { Math.random = () => .1; });
        for (const id of ['minesweeper', 'breakout', 'whack-a-mole', 'lights-out', 'sliding-puzzle', 'tap-flight', 'connect-four']) {
            const root = await openGame(page, id);
            const target = root.locator({
                minesweeper: '[data-cell-index="0"]', breakout: '[data-breakout-board]',
                'whack-a-mole': '[data-up="true"]', 'lights-out': '[data-cell-index="12"]',
                'sliding-puzzle': '.is-movable', 'tap-flight': '[data-flight-board]',
                'connect-four': '[data-connect-column="0"]',
            }[id]).first();
            const box = await target.boundingBox();
            expect(box.width).toBeGreaterThanOrEqual(24);
            expect(box.height).toBeGreaterThanOrEqual(24);
            await target.tap();
            await expect(root).toHaveAttribute('data-phase', /^(playing|won)$/);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            if (id === 'minesweeper') await expect(target).toHaveClass(/is-revealed/);
            if (id === 'breakout') await expect(root.locator('[data-breakout-launch]')).toBeDisabled();
            if (id === 'whack-a-mole') await expect(root.locator('[data-game-score]')).toHaveText('10');
            if (['lights-out', 'sliding-puzzle', 'connect-four'].includes(id)) await expect(root.locator('[data-game-moves]')).toHaveText('1');
        }
    });
});
