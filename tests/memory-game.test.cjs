const test = require('node:test');
const assert = require('node:assert/strict');
const memory = require('../assets/js/games/memory-core.js');

test('memory creates eight pairs without retaining a previous round', () => {
    const first = memory.createState(8, () => 0.2);
    const next = memory.createState(8, () => 0.8);
    assert.equal(first.cards.length, 16);
    for (let symbol = 0; symbol < 8; symbol += 1) assert.equal(first.cards.filter(value => value === symbol).length, 2);
    assert.notDeepEqual(first.cards, next.cards);
    assert.deepEqual(next.revealed, []);
    assert.equal(next.moves, 0);
});

test('memory counts complete attempts and locks a mismatched pair until it closes', () => {
    const original = { cards: [0, 1, 0, 1], revealed: [], matched: [], moves: 0, status: 'playing' };
    let state = memory.flip(original, 0);
    assert.equal(state.moves, 0);
    assert.equal(memory.flip(state, 0), state);
    state = memory.flip(state, 1);
    assert.equal(state.moves, 1);
    assert.equal(memory.flip(state, 2), state);
    state = memory.hideMismatch(state);
    assert.deepEqual(state.revealed, []);
    assert.deepEqual(original.revealed, []);
});

test('memory preserves matched cards and finishes only after every pair', () => {
    let state = { cards: [0, 1, 0, 1], revealed: [], matched: [], moves: 0, status: 'playing' };
    for (const index of [0, 2]) state = memory.flip(state, index);
    assert.equal(state.status, 'playing');
    assert.equal(memory.flip(state, 0), state);
    for (const index of [1, 3]) state = memory.flip(state, index);
    assert.equal(state.status, 'won');
    assert.equal(state.moves, 2);
    assert.equal(memory.flip(state, 1), state);
});

test('memory ignores invalid card indexes and validates deck size', () => {
    const state = memory.createState();
    for (const index of [-1, 16, 0.5, NaN]) assert.equal(memory.flip(state, index), state);
    assert.throws(() => memory.createState(0), RangeError);
});
