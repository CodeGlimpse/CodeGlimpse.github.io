const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/falling-blocks-core.js');
const random = require('./helpers/game-random.cjs');

test('falling blocks deals each of seven shapes once per bag and keeps a next piece', () => {
    const rng = random(11);
    let state = game.createState(rng);
    const types = [];
    for (let index = 0; index < 7; index += 1) {
        types.push(state.active.type);
        assert.equal(state.active.matrix.flat().filter(Boolean).length, 4);
        assert.ok(state.queue.length);
        state = game.hardDrop(state, rng);
    }
    assert.deepEqual(types.sort(), [...game.TYPES].sort());
});

test('falling blocks preserves prior state and respects walls and blocked rotations', () => {
    const original = game.createState(() => .999);
    const snapshot = structuredClone(original);
    let state = original;
    for (let index = 0; index < 10; index += 1) state = game.move(state, -1);
    assert.equal(state.active.x, 0);
    assert.equal(game.move(state, -1), state);
    assert.equal(game.move(state, 9), state);
    assert.deepEqual(original, snapshot);
    const vertical = { ...original, active: { type: 'I', x: 8, y: 0, matrix: [[1], [1], [1], [1]] } };
    const rotated = game.rotate(vertical);
    assert.equal(rotated.active.x, 6);
    assert.ok(game.canPlace(rotated.board, rotated.active));
    const blocked = { ...vertical, board: Array(200).fill(1), active: { ...vertical.active, x: 4 } };
    for (let row = 0; row < 4; row += 1) blocked.board[row * 10 + 4] = 0;
    assert.equal(game.rotate(blocked), blocked);
});

test('falling blocks gravity and soft drop score differently and hard drop uses the landing outline', () => {
    const state = game.createState(() => .999);
    assert.equal(game.step(state).active.y, 1);
    assert.equal(game.step(state).score, 0);
    assert.equal(game.softDrop(state).score, 1);
    const landed = game.landing(state);
    assert.equal(landed.y, 19);
    const next = game.hardDrop(state, () => .999);
    assert.equal(next.pieces, 1);
    assert.equal(next.score, 38);
    assert.equal(next.board.filter(Boolean).length, 4);
    assert.equal(state.board.some(Boolean), false);
});

test('falling blocks clears two or four rows at once and scores before a level increase', () => {
    const base = game.createState(() => .999);
    const double = { ...base, board: Array(200).fill(0), lines: 9, active: { type: 'O', x: 4, y: 0, matrix: [[1, 1], [1, 1]] } };
    for (let row = 18; row < 20; row += 1) for (let column = 0; column < 10; column += 1) if (column !== 4 && column !== 5) double.board[row * 10 + column] = 1;
    const cleared = game.hardDrop(double, () => .999);
    assert.equal(cleared.lines, 11);
    assert.equal(cleared.level, 2);
    assert.equal(cleared.score, 336);
    assert.equal(cleared.board.some(Boolean), false);
    const four = { ...base, board: Array(200).fill(0), active: { type: 'I', x: 4, y: 0, matrix: [[1], [1], [1], [1]] } };
    for (let row = 16; row < 20; row += 1) for (let column = 0; column < 10; column += 1) if (column !== 4) four.board[row * 10 + column] = 2;
    const next = game.hardDrop(four, () => .999);
    assert.equal(next.lines, 4);
    assert.equal(next.score, 832);
    assert.equal(next.board.some(Boolean), false);
});

test('falling blocks ends when a new piece cannot spawn and ignores further input', () => {
    const state = { ...game.createState(), queue: ['I', 'O'], board: Array(200).fill(0), active: { type: 'O', x: 0, y: 0, matrix: [[1, 1], [1, 1]] } };
    for (const column of [3, 4, 5, 6]) state.board[column] = 1;
    const lost = game.hardDrop(state, () => .5);
    assert.equal(lost.status, 'over');
    for (const action of [game.step, game.softDrop, game.hardDrop, game.rotate]) assert.equal(action(lost), lost);
    assert.equal(game.move(lost, 1), lost);
    assert.equal(game.createState().score, 0);
});

test('falling blocks rotation cycles back to the same shape and can turn near the floor', () => {
    const state = { ...game.createState(), active: { type: 'T', x: 3, y: 5, matrix: [[0, 1, 0], [1, 1, 1]] } };
    let turned = state;
    for (let index = 0; index < 4; index += 1) turned = game.rotate(turned);
    assert.deepEqual(turned.active, state.active);
    const low = { ...state, active: { type: 'I', x: 3, y: 19, matrix: [[1, 1, 1, 1]] } };
    const upright = game.rotate(low);
    assert.equal(upright.active.y, 16);
    assert.ok(game.canPlace(upright.board, upright.active));
});
