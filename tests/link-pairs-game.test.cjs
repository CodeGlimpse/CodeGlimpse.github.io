const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/link-pairs-core.js');
function validate(board, pair) {
    const { from, to, path } = pair;
    assert.ok(path.length >= 2 && path.length <= 4);
    assert.deepEqual(path[0], { row: Math.floor(from / game.COLS) + 1, col: from % game.COLS + 1 });
    assert.deepEqual(path.at(-1), { row: Math.floor(to / game.COLS) + 1, col: to % game.COLS + 1 });
    for (let i = 1; i < path.length; i++) {
        let { row, col } = path[i - 1];
        const target = path[i];
        assert.ok((row === target.row) !== (col === target.col));
        const dr = Math.sign(target.row - row), dc = Math.sign(target.col - col);
        while (row !== target.row || col !== target.col) {
            row += dr; col += dc;
            assert.ok(row >= 0 && row <= game.ROWS + 1 && col >= 0 && col <= game.COLS + 1);
            const index = (row - 1) * game.COLS + col - 1;
            if (row > 0 && row <= game.ROWS && col > 0 && col <= game.COLS && index !== to) assert.equal(board[index], 0);
        }
    }
}
test('link pairs accepts straight, corner and outside-edge paths', () => {
    const straight = Array(24).fill(0); straight[0] = straight[3] = 1;
    const a = { from: 0, to: 3, path: game.findPath(straight, 0, 3) }; validate(straight, a); assert.equal(a.path.length, 2);
    const corner = Array(24).fill(0); corner[0] = corner[10] = 1;
    validate(corner, { from: 0, to: 10, path: game.findPath(corner, 0, 10) });
    const outside = Array(24).fill(2); outside[0] = outside[3] = 1;
    const c = { from: 0, to: 3, path: game.findPath(outside, 0, 3) }; validate(outside, c);
    assert.ok(c.path.some(point => point.row === 0)); assert.equal(c.path.length, 4);
});
test('link pairs rejects mismatches, identical cells and routes needing more than two turns', () => {
    const board = Array(24).fill(2); board[5] = board[17] = 1;
    for (const index of [6, 7, 11, 15, 14, 13]) board[index] = 0;
    assert.equal(game.findPath(board, 5, 17), null);
    assert.equal(game.findPath(board, 5, 5), null);
    assert.equal(game.findPath(board, 5, 0), null);
    assert.equal(game.findPath(board, -1, 17), null);
});
test('link pairs rounds always retain a valid next move and clear exactly twelve pairs', () => {
    let seed = 321;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let round = 0; round < 80; round++) {
        let state = game.createState(random);
        const beforeShuffle = [...state.board].sort((a, b) => a - b);
        state = game.reshuffle(state, random);
        assert.deepEqual([...state.board].sort((a, b) => a - b), beforeShuffle);
        for (let pairs = 0; pairs < 12; pairs++) {
            const pair = game.findPair(state.board); assert.ok(pair); validate(state.board, pair);
            const original = state, previous = state.board.slice();
            state = game.match(state, pair.from, pair.to, random);
            assert.deepEqual(original.board, previous);
            assert.equal(state.remaining, 24 - (pairs + 1) * 2);
        }
        assert.equal(state.status, 'won'); assert.equal(state.matches, 12);
        assert.equal(game.reshuffle(state), state); assert.equal(game.match(state, 0, 1), state);
    }
});
