const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/breakout-core.js');

test('breakout waits for a launch and clamps the paddle with the parked ball attached', () => {
    const state = game.createState();
    assert.equal(game.advance(state, 1), state);
    const left = game.setPaddle(state, -100);
    assert.equal(left.paddle.x, 0);
    assert.equal(left.ball.x, left.paddle.width / 2);
    const right = game.setPaddle(state, 1000);
    assert.equal(right.paddle.x + right.paddle.width, game.WIDTH);
    assert.equal(game.setPaddle(state, NaN), state);
    const launched = game.launch(state);
    assert.equal(launched.launched, true);
    assert.equal(game.launch(launched), launched);
    assert.equal(state.launched, false);
});

test('breakout reflects from all solid walls without mutating its input', () => {
    const state = game.launch(game.createState());
    for (const [ball, axis, sign] of [
        [{ x: 6.2, y: 300, vx: -260, vy: 10 }, 'vx', 1],
        [{ x: 393.8, y: 300, vx: 260, vy: 10 }, 'vx', -1],
        [{ x: 200, y: 6.2, vx: 80, vy: -250 }, 'vy', 1],
    ]) {
        const input = { ...state, ball };
        const snapshot = structuredClone(input);
        const next = game.advance(input, .03);
        assert.equal(Math.sign(next.ball[axis]), sign);
        assert.ok(next.ball.x >= 6 && next.ball.x <= 394 && next.ball.y >= 6);
        assert.deepEqual(input, snapshot);
    }
});

test('breakout bounces upward from the paddle and aims left or right from its edges', () => {
    const state = game.launch(game.createState());
    for (const offset of [4, state.paddle.width / 2, state.paddle.width - 4]) {
        const next = game.advance({ ...state, ball: { x: state.paddle.x + offset, y: 436, vx: 0, vy: 260 } }, .03);
        assert.ok(next.ball.vy < 0);
        assert.ok(next.ball.y < state.paddle.y - game.RADIUS);
        assert.equal(next.lives, 3);
        if (offset < state.paddle.width / 2) assert.ok(next.ball.vx < 0);
        if (offset > state.paddle.width / 2) assert.ok(next.ball.vx > 0);
    }
});

test('breakout hits brick faces once and prevents tunnelling through thin bricks', () => {
    const base = game.launch(game.createState());
    const bricks = [{ x: 180, y: 150, width: 40, height: 18, active: true }, { x: 20, y: 60, width: 40, height: 18, active: true }];
    for (const [ball, axis, sign] of [
        [{ x: 200, y: 182, vx: 0, vy: -380 }, 'vy', 1],
        [{ x: 200, y: 140, vx: 0, vy: 380 }, 'vy', -1],
        [{ x: 170, y: 159, vx: 380, vy: 0 }, 'vx', -1],
    ]) {
        const next = game.advance({ ...base, bricks, ball }, .04);
        assert.equal(next.score, 10);
        assert.equal(next.bricks[0].active, false);
        assert.equal(Math.sign(next.ball[axis]), sign);
        assert.equal(game.advance(next, .05).score, 10);
        assert.equal(bricks[0].active, true);
    }
    const fast = game.advance({ ...base, bricks: [bricks[0]], ball: { x: 200, y: 380, vx: 0, vy: -1000 } }, .25);
    assert.equal(fast.status, 'won');
    assert.equal(fast.score, 10);
});

test('breakout loses one life per miss, parks for relaunch, and ends on the third miss', () => {
    const state = { ...game.launch(game.createState()), score: 30, ball: { x: 20, y: 485, vx: 0, vy: 250 } };
    const missed = game.advance(state, .1);
    assert.equal(missed.lives, 2);
    assert.equal(missed.score, 30);
    assert.equal(missed.launched, false);
    assert.equal(game.advance(missed, 1), missed);
    const lost = game.advance({ ...state, lives: 1 }, .1);
    assert.equal(lost.status, 'over');
    assert.equal(lost.lives, 0);
    assert.equal(game.launch(lost), lost);
    assert.equal(game.advance(lost, .1), lost);
    assert.equal(game.createState().lives, 3);
});

test('breakout wins on the last brick and integrates free flight consistently', () => {
    const base = game.launch(game.createState());
    const won = game.advance({ ...base, score: 270, bricks: [{ x: 180, y: 150, width: 40, height: 18, active: true }], ball: { x: 200, y: 182, vx: 0, vy: -300 } }, .1);
    assert.equal(won.status, 'won');
    assert.equal(won.score, 280);
    assert.equal(game.advance(won, .1), won);
    const once = game.advance(base, .05);
    let many = base;
    for (let index = 0; index < 5; index += 1) many = game.advance(many, .01);
    assert.ok(Math.abs(once.ball.x - many.ball.x) < 1e-8);
    assert.ok(Math.abs(once.ball.y - many.ball.y) < 1e-8);
});
