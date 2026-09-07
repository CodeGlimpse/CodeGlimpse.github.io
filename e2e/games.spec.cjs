const { test, expect } = require('@playwright/test');
const games = require('../data/games.json');
const ANALYTICS_URL = /^https:\/\/(?:www\.googletagmanager\.com|www\.clarity\.ms|hm\.baidu\.com)\//i;

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
            await expect(root.locator(game.id === 'memory' ? '[data-memory-moves]' : '[data-game-score]')).toHaveText('0');
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
    await page.setViewportSize({width:375,height:812});
    await page.emulateMedia({colorScheme:'dark'});
    await freezeTime(page);
    for (const id of ['memory','snake','2048']) {
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
        const target = root.locator(id === 'memory' ? '[data-card-index]' : '[data-direction]').first();
        const box = await target.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        await target.click();
        await expect(root).toHaveAttribute('data-phase','playing');
    }
});
