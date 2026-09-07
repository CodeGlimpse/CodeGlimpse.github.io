const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/whack-a-mole-core.js');
const random = require('./helpers/game-random.cjs');

test('whack a mole awards one hit per appearance and ignores empty holes', () => {
    const state = game.createState(() => 0);
    assert.equal(state.active, 0);
    assert.equal(game.hit(state, 1), state);
    const hit = game.hit(state, 0);
    assert.equal(hit.score, 10);
    assert.equal(hit.hits, 1);
    assert.equal(hit.active, -1);
    assert.equal(game.hit(hit, 0), hit);
    assert.equal(state.score, 0);
});

test('whack a mole expires at the deadline and leaves a gap before the next distinct hole', () => {
    const state = game.createState(() => 0);
    const before = game.advance(state, state.expiresAt - 1, () => 0);
    assert.equal(game.hit(before, 0).score, 10);
    const expired = game.advance(state, state.expiresAt, () => 0);
    assert.equal(expired.active, -1);
    assert.equal(game.hit(expired, 0), expired);
    const spawned = game.advance(state, state.spawnAt, () => 0);
    assert.notEqual(spawned.active, state.active);
    const later = game.advance(spawned, 35000, () => 0);
    const laterSpawn = game.advance(later, later.spawnAt - later.elapsed, () => 0);
    assert.ok(laterSpawn.expiresAt - laterSpawn.elapsed < spawned.expiresAt - spawned.elapsed);
});

test('whack a mole counts 45 active seconds consistently across frame sizes and stops completely', () => {
    const rngA = random(21);
    const rngB = random(21);
    const original = game.createState(rngA);
    const once = game.advance(original, 60000, rngA);
    let many = game.createState(rngB);
    for (let index = 0; index < 90; index += 1) many = game.advance(many, 500, rngB);
    assert.deepEqual(many, once);
    assert.equal(once.elapsed, 45000);
    assert.equal(once.status, 'over');
    assert.equal(once.active, -1);
    assert.equal(game.advance(once, 1000), once);
    assert.equal(game.hit(once, 0), once);
    for (const delta of [0, -1, NaN, Infinity]) assert.equal(game.advance(original, delta), original);
    assert.equal(original.elapsed, 0);
});
