const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/reaction-core.js');

test('reaction false starts do not consume a scored attempt', () => {
    const state = game.createState();
    const early = game.respond(state, 100);
    assert.equal(early.stage, 'early');
    assert.equal(early.falseStarts, 1);
    assert.equal(early.samples.length, 0);
    assert.equal(game.beginTrial(early).stage, 'waiting');
    assert.equal(state.falseStarts, 0);
});

test('reaction measures from the green signal and rejects duplicate or invalid timestamps', () => {
    const ready = game.arm(game.createState(), 1000);
    assert.equal(game.arm(ready, 1100), ready);
    for (const now of [999, NaN, Infinity]) assert.equal(game.respond(ready, now), ready);
    const result = game.respond(ready, 1173.4);
    assert.deepEqual(result.samples, [173]);
    assert.equal(game.respond(result, 1200), result);
    assert.equal(ready.samples.length, 0);
});

test('reaction computes a five-attempt average and freezes the finished round', () => {
    let state = game.createState();
    for (let round = 0; round < 5; round += 1) {
        state = game.arm(game.beginTrial(state), 10000 * round);
        state = game.respond(state, 10000 * round + 200 + round * 50);
    }
    assert.equal(state.status, 'won');
    assert.equal(state.stage, 'finished');
    assert.equal(game.average(state.samples), 300);
    assert.equal(game.average([]), 0);
    assert.equal(game.beginTrial(state), state);
    assert.equal(game.respond(state, 99999), state);
});

test('reaction restarting an unfinished wait cannot retain an old green timestamp', () => {
    const ready = game.arm(game.createState(), 100);
    const restarted = game.beginTrial(ready);
    assert.equal(restarted.readyAt, null);
    assert.equal(game.respond(restarted, 900).samples.length, 0);
    const fresh = game.respond(game.arm(restarted, 1000), 1100);
    assert.deepEqual(fresh.samples, [100]);
});
