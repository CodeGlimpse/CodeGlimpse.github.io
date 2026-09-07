const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/connect-four-core.js');

test('connect four applies gravity, alternates players, and rejects full or invalid columns', () => {
    const original = game.createState();
    let state = game.drop(original, 3);
    assert.equal(state.board[38], 1);
    assert.equal(state.turn, 2);
    state = game.drop(state, 3);
    assert.equal(state.board[31], 2);
    assert.equal(state.turn, 1);
    assert.equal(original.board.some(Boolean), false);
    for (let count = 2; count < 6; count += 1) state = game.drop(state, 3);
    assert.equal(game.drop(state, 3), state);
    for (const column of [-1, 7, .5, NaN]) assert.equal(game.drop(state, column), state);
    assert.equal(state.moves, 6);
});

test('connect four detects horizontal, vertical, and both diagonal wins from legal rounds', () => {
    const diagonal = [0, 1, 1, 2, 3, 2, 2, 3, 4, 3, 3];
    for (const sequence of [[0, 0, 1, 1, 2, 2, 3], [0, 1, 0, 1, 0, 1, 0], diagonal, diagonal.map(column => 6 - column)]) {
        let state = game.createState();
        sequence.forEach((column, index) => {
            assert.equal(state.status, 'playing', 'round must not finish before the winning move');
            state = game.drop(state, column);
            if (index < sequence.length - 1) assert.equal(state.winner, 0);
        });
        assert.equal(state.status, 'won');
        assert.equal(state.winner, 1);
        assert.equal(state.winning.length, 4);
        assert.ok(state.winning.every(index => state.board[index] === 1));
        assert.equal(game.drop(state, 6), state);
    }
});

test('connect four reports a draw only after the final non-winning move', () => {
    const board = Array.from({ length: 42 }, (_, index) => {
        const row = Math.floor(index / 7);
        const base = Math.floor(index % 7 / 2) % 2 ? 2 : 1;
        return row % 2 ? 3 - base : base;
    });
    board.forEach((player, index) => assert.deepEqual(game.winningLine(board, index, player), []));
    board[2] = 0;
    const state = { board, turn: 2, moves: 41, winner: 0, winning: [], status: 'playing' };
    const draw = game.drop(state, 2);
    assert.equal(draw.moves, 42);
    assert.equal(draw.status, 'over');
    assert.equal(draw.winner, 0);
    assert.equal(game.drop(draw, 1), draw);
});

test('connect four does not join pieces across row boundaries', () => {
    const board = Array(42).fill(0);
    [33, 34, 35, 36].forEach(index => { board[index] = 1; });
    assert.deepEqual(game.winningLine(board, 34, 1), []);
});
