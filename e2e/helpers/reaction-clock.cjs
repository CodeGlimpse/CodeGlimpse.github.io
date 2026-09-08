const { expect } = require('@playwright/test');

async function advanceToReactionSignal(page, pad, delay = 1200) {
    await page.clock.runFor(delay);
    // Stop on the actual signal frame so the measured input delay is exact.
    for (let frameWait = 0; frameWait < 32 && await pad.getAttribute('data-stage') !== 'ready'; frameWait += 1) {
        await page.clock.runFor(1);
    }
    await expect(pad).toHaveAttribute('data-stage', 'ready');
}

module.exports = { advanceToReactionSignal };
