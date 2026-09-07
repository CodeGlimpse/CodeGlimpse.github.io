const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/memory-sequence-core.js');
const random = require('./helpers/game-random.cjs');

test('memory sequence ignores demonstration input and ends on a wrong pad', () => {
    const state = game.createState(() => .25);
    assert.equal(game.press(state, 1), state);
    const input = game.beginInput(state);
    for (const index of [-1, 4, .5]) assert.equal(game.press(input, index), input);
    const lost = game.press(input, 0);
    assert.equal(lost.status, 'over');
    assert.equal(lost.wrong, 0);
    assert.equal(lost.score, 0);
    assert.equal(game.press(lost, 1), lost);
    assert.equal(game.replay(lost), lost);
});

test('memory sequence tracks partial input and adds exactly one pad after a complete pattern', () => {
    const state = { ...game.createState(), sequence: [0, 1], stage: 'input', score: 1 };
    const partial = game.press(state, 0);
    assert.equal(partial.inputIndex, 1);
    assert.equal(partial.score, 1);
    const next = game.press(partial, 1, () => .75);
    assert.deepEqual(next.sequence, [0, 1, 3]);
    assert.equal(next.score, 2);
    assert.equal(next.stage, 'showing');
    assert.deepEqual(state.sequence, [0, 1]);
});

test('memory sequence resume replays the same round without awarding or losing a point', () => {
    const state = { ...game.createState(), sequence: [0, 1, 2], stage: 'input', score: 2, inputIndex: 2 };
    const replayed = game.replay(state);
    assert.deepEqual(replayed.sequence, state.sequence);
    assert.equal(replayed.inputIndex, 0);
    assert.equal(replayed.score, 2);
    assert.equal(replayed.stage, 'showing');
});

test('memory sequence wins after ten complete patterns and ignores later input', () => {
    const rng = random(13);
    let state = game.createState(rng);
    for (let round = 1; round <= 10; round += 1) {
        assert.equal(state.sequence.length, round);
        const sequence = [...state.sequence];
        state = game.beginInput(state);
        for (const index of sequence) state = game.press(state, index, rng);
        assert.equal(state.score, round);
    }
    assert.equal(state.status, 'won');
    assert.equal(game.press(state, 0), state);
    assert.equal(game.replay(state), state);
});
