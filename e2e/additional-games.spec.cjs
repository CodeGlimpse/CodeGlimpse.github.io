const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
    await page.route(/^https:\/\/(?:www\.googletagmanager\.com|www\.clarity\.ms|hm\.baidu\.com)\//i, route => route.fulfill({ body: '', contentType: 'application/javascript' }));
});

async function freeze(page, value = .1) {
    await page.clock.install({ time: new Date('2026-09-08T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-08T00:00:01Z'));
    await page.addInitScript(random => { Math.random = () => random; }, value);
}

async function begin(page, id) {
    await page.goto('/games/' + id + '/');
    const dismiss = page.locator('[data-privacy-dismiss]');
    if (await dismiss.isVisible()) await dismiss.click();
    const root = page.locator('[data-game-id="' + id + '"]');
    await root.locator('[data-game-start]').click();
    await expect(root).toHaveAttribute('data-phase', 'playing');
    return root;
}

function solveSudoku(values) {
    const board = [...values];
    function solve() {
        const cell = board.indexOf(0);
        if (cell === -1) return [...board];
        const row = Math.floor(cell / 4);
        const column = cell % 4;
        for (let value = 1; value <= 4; value += 1) {
            let allowed = true;
            for (let other = 0; other < 16; other += 1) {
                const otherRow = Math.floor(other / 4);
                const otherColumn = other % 4;
                if (board[other] === value && (otherRow === row || otherColumn === column
                    || (Math.floor(otherRow / 2) === Math.floor(row / 2) && Math.floor(otherColumn / 2) === Math.floor(column / 2)))) allowed = false;
            }
            if (!allowed) continue;
            board[cell] = value;
            const solution = solve();
            if (solution) return solution;
            board[cell] = 0;
        }
        return null;
    }
    return solve();
}

test('falling blocks moves, rotates, drops, pauses gravity and clears old timers on restart', async ({ page }) => {
    await freeze(page, .999);
    const root = await begin(page, 'falling-blocks');
    const canvas = root.locator('canvas');
    const snapshot = () => canvas.evaluate(element => element.toDataURL());
    const initial = await snapshot();
    await page.keyboard.press('ArrowLeft');
    expect(await snapshot()).not.toBe(initial);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await expect(root.locator('[data-game-score]')).toHaveText('1');
    await page.keyboard.press('Space');
    expect(Number(await root.locator('[data-game-score]').textContent())).toBeGreaterThan(1);
    await page.keyboard.press('p');
    const paused = await snapshot();
    await page.clock.fastForward(5000);
    expect(await snapshot()).toBe(paused);
    await page.keyboard.press('p');
    await page.clock.runFor(650);
    expect(await snapshot()).not.toBe(paused);
    await root.locator('[data-game-restart]').click();
    await expect(root.locator('[data-game-score]')).toHaveText('0');
    await expect(root.locator('[data-blocks-lines]')).toHaveText('0');
    const restarted = await snapshot();
    await page.clock.runFor(640);
    expect(await snapshot()).toBe(restarted);
    await root.locator('[data-blocks-action="drop"]').click();
    expect(Number(await root.locator('[data-game-score]').textContent())).toBeGreaterThan(0);
});

test('sokoban completes a level, undoes a winning push and resets level progress on reload', async ({ page }) => {
    const root = await begin(page, 'sokoban');
    await page.keyboard.press('ArrowUp');
    await expect(root).toHaveAttribute('data-phase', 'won');
    await expect(root.locator('[data-game-moves]')).toHaveText('1');
    await expect(root.locator('[data-sokoban-pushes]')).toHaveText('1');
    await expect(root.locator('[data-box="true"][data-goal="true"]')).toHaveCount(1);
    await root.locator('[data-sokoban-undo]').click();
    await expect(root).toHaveAttribute('data-phase', 'playing');
    await expect(root.locator('[data-game-moves]')).toHaveText('0');
    await page.keyboard.press('ArrowUp');
    await root.locator('[data-sokoban-next]').click();
    await expect(root.locator('[data-sokoban-level]')).toHaveText('2 / 6');
    await expect(root.locator('[data-game-moves]')).toHaveText('0');
    await page.keyboard.press('ArrowLeft');
    await root.locator('[data-game-restart]').click();
    await expect(root.locator('[data-sokoban-level]')).toHaveText('2 / 6');
    await expect(root.locator('[data-game-moves]')).toHaveText('0');
    await page.reload();
    await root.locator('[data-game-start]').click();
    await expect(root.locator('[data-sokoban-level]')).toHaveText('1 / 6');
});

test('tic tac toe waits for the computer, cancels pending moves and reports its winning line', async ({ page }) => {
    await freeze(page);
    const root = await begin(page, 'tic-tac-toe');
    const cells = root.locator('[data-cell-index]');
    await cells.nth(0).click();
    await expect(root.locator('[data-game-moves]')).toHaveText('1');
    await expect(cells.nth(1)).toBeDisabled();
    await page.clock.runFor(300);
    await expect(cells.nth(4)).toHaveText('O');
    await expect(root.locator('[data-game-moves]')).toHaveText('2');
    await cells.nth(1).click();
    await page.keyboard.press('p');
    await page.clock.fastForward(5000);
    await expect(root.locator('[data-game-moves]')).toHaveText('3');
    await page.keyboard.press('p');
    await root.locator('[data-game-restart]').click();
    await page.clock.runFor(600);
    await expect(root.locator('[data-game-moves]')).toHaveText('0');
    for (const cell of [0, 8, 6]) { await cells.nth(cell).click(); await page.clock.runFor(300); }
    await expect(root).toHaveAttribute('data-phase', 'over');
    await expect(root.locator('[data-winning="true"]')).toHaveCount(3);
    await expect(root.locator('[data-game-status]')).toContainText('电脑赢了');
});

test('mini sudoku protects clues, marks conflicts, supports erasing and can be solved through the UI', async ({ page }) => {
    await freeze(page);
    const root = await begin(page, 'mini-sudoku');
    const cells = root.locator('[data-cell-index]');
    const original = await cells.evaluateAll(elements => elements.map(element => ({ value: Number(element.dataset.value), given: element.dataset.given === 'true' })));
    const solution = solveSudoku(original.map(cell => cell.value));
    expect(solution).not.toBeNull();
    const clue = original.findIndex(cell => cell.given);
    await cells.nth(clue).click();
    await page.keyboard.press('1');
    await expect(root.locator('[data-game-moves]')).toHaveText('0');
    const empty = original.findIndex(cell => !cell.given);
    const peer = original.findIndex((cell, index) => cell.given && (Math.floor(index / 4) === Math.floor(empty / 4) || index % 4 === empty % 4
        || (Math.floor(index / 8) === Math.floor(empty / 8) && Math.floor(index % 4 / 2) === Math.floor(empty % 4 / 2))));
    await cells.nth(empty).click();
    await page.keyboard.press(String(original[peer].value));
    expect(await root.locator('[data-conflict="true"]').count()).toBeGreaterThan(0);
    await page.keyboard.press('Backspace');
    await expect(cells.nth(empty)).toHaveText('');
    await expect(root.locator('[data-conflict="true"]')).toHaveCount(0);
    await page.keyboard.press('p');
    const moves = await root.locator('[data-game-moves]').textContent();
    await page.keyboard.press('1');
    await expect(root.locator('[data-game-moves]')).toHaveText(moves);
    await page.keyboard.press('p');
    for (let index = 0; index < 16; index += 1) {
        if (original[index].given) continue;
        await cells.nth(index).click();
        await page.keyboard.press(String(solution[index]));
    }
    await expect(root).toHaveAttribute('data-phase', 'won');
    await expect(root.locator('[data-sudoku-empty]')).toHaveText('0');
    await expect(cells.nth(clue)).toHaveText(String(original[clue].value));
    await expect(root.locator('[data-conflict="true"]')).toHaveCount(0);
});

test('reaction ignores false starts, cancels paused signals and records five measured attempts', async ({ page }) => {
    await freeze(page, 0);
    const root = await begin(page, 'reaction');
    const pad = root.locator('[data-reaction-target]');
    await page.keyboard.press('Enter');
    await expect(pad).toHaveAttribute('data-stage', 'early');
    await expect(root.locator('[data-reaction-round]')).toHaveText('0 / 5');
    await page.keyboard.press('Enter');
    await page.clock.runFor(1200);
    await expect(pad).toHaveAttribute('data-stage', 'ready');
    await page.clock.runFor(173);
    await page.keyboard.press('Space');
    await expect(root.locator('[data-reaction-last]')).toHaveText('173 ms');
    await page.keyboard.press('Enter');
    await page.clock.runFor(1200);
    await page.keyboard.press('p');
    await page.clock.fastForward(10000);
    await expect(root.locator('[data-reaction-round]')).toHaveText('1 / 5');
    await page.keyboard.press('p');
    await expect(pad).toHaveAttribute('data-stage', 'waiting');
    for (const delay of [200, 250, 300, 350]) {
        await page.clock.runFor(1200);
        await page.clock.runFor(delay);
        await page.keyboard.press('Space');
        if (delay !== 350) await page.keyboard.press('Enter');
    }
    await expect(root).toHaveAttribute('data-phase', 'won');
    await expect(root.locator('[data-reaction-round]')).toHaveText('5 / 5');
    await expect(root.locator('[data-reaction-average]')).toHaveText('255 ms');
    await root.locator('[data-game-restart]').click();
    await expect(root.locator('[data-reaction-round]')).toHaveText('0 / 5');
    await expect(root.locator('[data-reaction-average]')).toHaveText('—');
});

test('memory sequence waits for the demonstration, replays paused rounds and clears old cues', async ({ page }) => {
    await freeze(page);
    const root = await begin(page, 'memory-sequence');
    const board = root.locator('[data-sequence-board]');
    await page.keyboard.press('1');
    await expect(root.locator('[data-game-score]')).toHaveText('0');
    await page.clock.runFor(400);
    await expect(root.locator('[data-cell-index="0"]')).toHaveAttribute('data-lit', 'true');
    await page.clock.runFor(620);
    await expect(board).toHaveAttribute('data-stage', 'input');
    await page.keyboard.press('1');
    await expect(root.locator('[data-game-score]')).toHaveText('1');
    await page.keyboard.press('p');
    await page.clock.fastForward(5000);
    await expect(root.locator('[data-lit="true"]')).toHaveCount(0);
    await page.keyboard.press('p');
    await page.clock.runFor(1700);
    await page.keyboard.press('1');
    await page.keyboard.press('p');
    await page.keyboard.press('p');
    await page.clock.runFor(1700);
    await page.keyboard.press('1');
    await expect(root.locator('[data-game-score]')).toHaveText('1');
    await page.keyboard.press('1');
    await expect(root.locator('[data-game-score]')).toHaveText('2');
    await page.clock.runFor(3000);
    await expect(board).toHaveAttribute('data-stage', 'input');
    await page.keyboard.press('2');
    await expect(root).toHaveAttribute('data-phase', 'over');
    await root.locator('[data-game-restart]').click();
    await page.clock.fastForward(5000);
    await expect(root).toHaveAttribute('data-phase', 'playing');
    await expect(root.locator('[data-game-score]')).toHaveText('0');
    await expect(root.locator('[data-wrong="true"]')).toHaveCount(0);
});
