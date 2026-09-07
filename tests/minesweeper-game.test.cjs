const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/minesweeper-core.js');
const random = require('./helpers/game-random.cjs');

test('minesweeper keeps every first reveal and its neighbours safe, including corners', () => {
    for (let first = 0; first < 81; first += 1) {
        const original = game.createState();
        const state = game.reveal(original, first, random(first + 1));
        assert.equal(state.cells.filter(cell => cell.mine).length, 10);
        for (const index of [first, ...game.neighbors(first)]) assert.equal(state.cells[index].mine, false);
        assert.ok(state.cells[first].revealed);
        assert.ok(state.revealed >= 4);
        state.cells.forEach((cell, index) => {
            assert.equal(cell.adjacent, game.neighbors(index).filter(other => state.cells[other].mine).length);
        });
        assert.equal(original.placed, false);
        assert.equal(original.cells.some(cell => cell.revealed || cell.mine), false);
    }
});

test('minesweeper caps flags, protects flagged cells, and never plants mines on a flag action', () => {
    let state = game.createState();
    for (let index = 0; index < 10; index += 1) state = game.flag(state, index);
    assert.equal(state.flags, 10);
    assert.equal(state.placed, false);
    assert.equal(game.flag(state, 10), state);
    assert.equal(game.reveal(state, 0), state);
    const unflagged = game.flag(state, 0);
    assert.equal(unflagged.flags, 9);
    assert.equal(state.cells[0].flagged, true);
    assert.equal(unflagged.cells[0].flagged, false);
});

test('minesweeper flood reveal stops at flags and never exposes a mine', () => {
    const flagged = game.flag(game.createState(), 39);
    const state = game.reveal(flagged, 40, random(17));
    assert.equal(state.cells[39].revealed, false);
    assert.equal(state.cells[39].flagged, true);
    assert.equal(state.cells.some(cell => cell.mine && cell.revealed), false);
    assert.equal(state.revealed, state.cells.filter(cell => cell.revealed).length);
    assert.equal(game.flag(state, 40), state);
    for (const invalid of [-1, 81, .5, NaN]) {
        assert.equal(game.flag(state, invalid), state);
        assert.equal(game.reveal(state, invalid), state);
    }
});

test('minesweeper wins by revealing safe cells and freezes both finished outcomes', () => {
    const initial = game.reveal(game.createState(), 40, random(5));
    const mine = initial.cells.findIndex(cell => cell.mine);
    const lost = game.reveal(initial, mine);
    assert.equal(lost.status, 'over');
    assert.equal(lost.exploded, mine);
    assert.equal(game.reveal(lost, 0), lost);
    assert.equal(game.flag(lost, 0), lost);
    let won = initial;
    initial.cells.forEach((cell, index) => { if (!cell.mine) won = game.reveal(won, index); });
    assert.equal(won.status, 'won');
    assert.equal(won.revealed, 71);
    assert.equal(game.flag(won, mine), won);
    assert.equal(game.reveal(won, mine), won);
    assert.equal(game.createState().revealed, 0);
});
