const { test, expect } = require('@playwright/test');
const { advanceToReactionSignal } = require('./helpers/reaction-clock.cjs');

test.beforeEach(async ({ page }) => {
    await page.route(/^https:\/\/(?:www\.googletagmanager\.com|www\.clarity\.ms|hm\.baidu\.com)\//i, route => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.clock.install({ time: new Date('2026-09-08T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-08T00:00:01Z'));
    await page.addInitScript(() => {
        Math.random = () => 0;
    });
});

async function openReaction(page) {
    await page.goto('/games/reaction/');
    const dismiss = page.locator('[data-privacy-dismiss]');
    if (await dismiss.isVisible()) await dismiss.click();
    const root = page.locator('[data-game-id="reaction"]');
    await root.locator('[data-game-start]').click();
    await expect(root).toHaveAttribute('data-phase', 'playing');
    const pad = root.locator('[data-reaction-target]');
    return { root, pad };
}

test('reaction records the mouse press without including an 80 ms hold', async ({ page }) => {
    const { root, pad } = await openReaction(page);
    await advanceToReactionSignal(page, pad);
    await page.clock.runFor(230);
    const box = await pad.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const beforeRelease = await root.locator('[data-reaction-last]').textContent();
    await page.clock.runFor(80);
    await page.mouse.up();
    const afterRelease = await root.locator('[data-reaction-last]').textContent();
    await expect(root.locator('[data-reaction-round]')).toHaveText('1 / 5');
    expect(beforeRelease).toBe('230 ms');
    expect(afterRelease).toBe('230 ms');
    await expect(pad).toHaveAttribute('data-stage', 'result');
});

for (const key of ['Space', 'Enter']) {
    test('reaction records ' + key + ' on keydown and ignores repeats and release', async ({ page }) => {
        const { root, pad } = await openReaction(page);
        await advanceToReactionSignal(page, pad);
        await page.clock.runFor(230);
        await page.keyboard.down(key);
        await expect(root.locator('[data-reaction-last]')).toHaveText('230 ms');
        await page.clock.runFor(80);
        await page.keyboard.down(key);
        await page.keyboard.up(key);
        await expect(root.locator('[data-reaction-last]')).toHaveText('230 ms');
        await expect(root.locator('[data-reaction-round]')).toHaveText('1 / 5');
        await expect(pad).toHaveAttribute('data-stage', 'result');
    });
}

test('reaction excludes event queue delay and rejects a press timestamped before green', async ({ page }) => {
    const { root, pad } = await openReaction(page);
    await advanceToReactionSignal(page, pad);
    await page.clock.runFor(230);
    await page.evaluate(() => {
        const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse', isPrimary: true });
        Object.defineProperty(event, 'timeStamp', { value: performance.now() });
        window.queuedReactionPress = event;
    });
    await page.clock.runFor(80);
    await pad.evaluate(element => element.dispatchEvent(window.queuedReactionPress));
    await expect(root.locator('[data-reaction-last]')).toHaveText('230 ms');
    await root.locator('[data-game-restart]').click();
    await page.clock.runFor(1000);
    await page.evaluate(() => {
        const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse', isPrimary: true });
        Object.defineProperty(event, 'timeStamp', { value: performance.now() });
        window.queuedReactionPress = event;
    });
    await advanceToReactionSignal(page, pad, 200);
    await pad.evaluate(element => element.dispatchEvent(window.queuedReactionPress));
    await expect(pad).toHaveAttribute('data-stage', 'early');
    await expect(root.locator('[data-reaction-round]')).toHaveText('0 / 5');
});

test('reaction waits for a paint frame and cancels pending frames on pause and restart', async ({ page }) => {
    const { root, pad } = await openReaction(page);
    await page.clock.runFor(1200);
    await expect(pad).toHaveAttribute('data-stage', 'waiting');
    await root.locator('[data-game-pause]').click();
    await page.clock.runFor(40);
    await expect(root).toHaveAttribute('data-phase', 'paused');
    await expect(pad).toHaveAttribute('data-stage', 'waiting');
    await root.locator('[data-game-pause]').click();
    await page.clock.runFor(1200);
    await root.locator('[data-game-restart]').click();
    await page.clock.runFor(40);
    await expect(pad).toHaveAttribute('data-stage', 'waiting');
    await advanceToReactionSignal(page, pad, 1160);
    const style = await pad.evaluate(element => ({
        transition: getComputedStyle(element).transitionDuration,
        animation: getComputedStyle(element).animationName,
    }));
    expect(style).toEqual({ transition: '0s', animation: 'none' });
});

test('reaction ignores non-primary inputs and preserves virtual click activation', async ({ page }) => {
    const { root, pad } = await openReaction(page);
    await advanceToReactionSignal(page, pad);
    await page.clock.runFor(230);
    await pad.dispatchEvent('pointerdown', { button: 2, pointerType: 'mouse', isPrimary: true });
    await pad.dispatchEvent('pointerdown', { button: 0, pointerType: 'touch', isPrimary: false });
    await expect(root.locator('[data-reaction-round]')).toHaveText('0 / 5');
    await pad.evaluate(element => element.click());
    await expect(root.locator('[data-reaction-last]')).toHaveText('230 ms');
    await expect(root.locator('[data-reaction-round]')).toHaveText('1 / 5');
});

test.describe('reaction touch timing', () => {
    test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
    test('records touch contact without waiting for lift and ignores the generated click', async ({ page, context }) => {
        const { root, pad } = await openReaction(page);
        await advanceToReactionSignal(page, pad);
        await page.clock.runFor(230);
        const box = await pad.boundingBox();
        const session = await context.newCDPSession(page);
        try {
            await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
            await expect(root.locator('[data-reaction-last]')).toHaveText('230 ms');
            await page.clock.runFor(80);
            await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await expect(root.locator('[data-reaction-last]')).toHaveText('230 ms');
            await expect(root.locator('[data-reaction-round]')).toHaveText('1 / 5');
            await expect(pad).toHaveAttribute('data-stage', 'result');
        } finally { await session.detach(); }
    });
});
