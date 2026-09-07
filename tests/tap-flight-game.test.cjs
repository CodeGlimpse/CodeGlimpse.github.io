const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/tap-flight-core.js');

test('tap flight waits for input and applies a fresh impulse without mutating previous state', () => {
    const state = game.createState(() => .5);
    assert.equal(game.advance(state, 1), state);
    const flying = game.flap(state);
    assert.equal(flying.started, true);
    assert.equal(flying.bird.vy, -300);
    assert.equal(state.bird.vy, 0);
    const next = game.advance(flying, .2, () => .5);
    assert.ok(Math.abs(next.bird.y - 190) < 1e-8);
    assert.ok(Math.abs(next.bird.vy + 100) < 1e-8);
    assert.equal(game.flap(next).bird.vy, -300);
});

test('tap flight movement and obstacle spacing are independent of normal frame size', () => {
    const state = game.flap(game.createState(() => .5));
    const once = game.advance(state, .2, () => .5);
    let many = state;
    for (let index = 0; index < 4; index += 1) many = game.advance(many, .05, () => .5);
    assert.ok(Math.abs(many.bird.y - once.bird.y) < 1e-8);
    assert.ok(Math.abs(many.pipes[0].x - once.pipes[0].x) < 1e-8);
    let spaced = state;
    for (let index = 0; index < 32; index += 1) {
        if (index % 12 === 0) spaced = game.flap(spaced);
        spaced = game.advance(spaced, .05, () => .5);
    }
    assert.equal(spaced.status, 'playing');
    assert.equal(spaced.pipes.length, 2);
    assert.ok(Math.abs(spaced.pipes[1].x - spaced.pipes[0].x - 210) < 1e-8);
});

test('tap flight detects the ceiling, ground and pipe edges while allowing passage through gaps', () => {
    const state = game.flap(game.createState(() => .5));
    for (const bird of [{ x: 96, y: 13, vy: -100 }, { x: 96, y: game.FLOOR - 13, vy: 100 }]) {
        assert.equal(game.advance({ ...state, bird }, .03).status, 'over');
    }
    const pipe = { x: 85, top: 200, scored: false };
    assert.equal(game.advance({ ...state, bird: { x: 96, y: 210, vy: 0 }, pipes: [pipe] }, .001).status, 'over');
    const safe = game.advance({ ...state, bird: { x: 96, y: 270, vy: 0 }, pipes: [pipe] }, .001);
    assert.equal(safe.status, 'playing');
});

test('tap flight scores each passed obstacle once and freezes a finished flight', () => {
    const base = game.flap(game.createState(() => .5));
    const state = { ...base, bird: { x: 96, y: 230, vy: 0 }, pipes: [{ x: 26.5, top: 160, scored: false }] };
    const passed = game.advance(state, .01, () => .5);
    assert.equal(passed.score, 1);
    assert.equal(game.advance(passed, .05, () => .5).score, 1);
    assert.equal(state.pipes[0].scored, false);
    const lost = game.advance({ ...base, bird: { x: 96, y: 450, vy: 300 } }, .1);
    assert.equal(lost.status, 'over');
    assert.equal(game.advance(lost, 1), lost);
    assert.equal(game.flap(lost), lost);
    assert.equal(game.createState().score, 0);
    for (const delta of [0, -1, NaN, Infinity]) assert.equal(game.advance(base, delta), base);
});
