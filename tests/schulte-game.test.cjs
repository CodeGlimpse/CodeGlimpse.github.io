const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/schulte-core.js');
test('Schulte creates every number once and only accepts the next number', () => {
    let state = game.createState(() => .25);
    assert.deepEqual([...state.board].sort((a, b) => a - b), Array.from({ length: 25 }, (_, i) => i + 1));
    const original = state;
    state = game.press(state, state.board.indexOf(2));
    assert.equal(state.next, 1); assert.equal(state.mistakes, 1); assert.equal(original.mistakes, 0);
    for (let value = 1; value <= 25; value++) state = game.press(state, state.board.indexOf(value));
    assert.equal(state.status, 'won'); assert.equal(state.next, 26); assert.equal(state.mistakes, 1);
    assert.equal(game.press(state, 0), state);
});
test('Schulte ignores invalid cells and resets all round state', () => {
    const state = game.createState();
    for (const index of [-1, 25, .2, null, NaN]) assert.equal(game.press(state, index), state);
    assert.equal(game.createState().next, 1);
    assert.equal(game.createState().mistakes, 0);
});
