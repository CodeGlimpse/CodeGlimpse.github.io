const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/gomoku-core.js');
test('Gomoku alternates turns and rejects occupied or invalid intersections without mutation', () => {
    const start = game.createState();
    const next = game.place(start, 112);
    assert.equal(start.board[112], 0); assert.equal(next.board[112], 1); assert.equal(next.turn, 2); assert.equal(next.moves, 1);
    for (const index of [112, -1, 225, .5, null]) assert.equal(game.place(next, index), next);
});
test('Gomoku detects all four winning directions and locks a finished round', () => {
    for (const line of [[105,106,107,108,109], [7,22,37,52,67], [0,16,32,48,64], [14,28,42,56,70]]) {
        let state = game.createState();
        line.forEach((index, turn) => {
            state = game.place(state, index);
            if (turn < 4) state = game.place(state, 210 + turn * 2);
        });
        assert.equal(state.status, 'won'); assert.equal(state.winner, 1); assert.deepEqual(state.winning, line);
        assert.equal(game.place(state, 224), state);
    }
});
test('Gomoku does not wrap rows and allows freestyle overlines', () => {
    let state = game.createState();
    for (const index of [13,14,15,16]) state.board[index] = 1;
    state.moves = 4;
    assert.equal(game.place(state, 17).status, 'playing');
    state = game.createState();
    for (const index of [105,106,107,109,110]) state.board[index] = 1;
    state.moves = 5;
    const overline = game.place(state, 108);
    assert.equal(overline.status, 'won'); assert.equal(overline.winning.length, 6);
});
test('Gomoku reports a full board without a winner as a draw', () => {
    const state = game.createState();
    state.board = state.board.map((_, index) => ((Math.floor(index / 15) + 2 * (index % 15)) % 4 < 2 ? 1 : 2));
    state.turn = 1; state.board[223] = 0; state.moves = 224;
    const draw = game.place(state, 223);
    assert.equal(draw.status, 'over'); assert.equal(draw.winner, 0); assert.equal(draw.moves, 225);
});
