const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/tic-tac-toe-core.js');
const random = require('./helpers/game-random.cjs');

test('tic tac toe alternates turns and protects occupied or invalid cells', () => {
    const state = game.createState();
    assert.equal(game.chooseComputerMove(state), -1);
    const next = game.place(state, 4);
    assert.equal(next.board[4], 'X');
    assert.equal(next.turn, 'O');
    assert.equal(next.moves, 1);
    assert.equal(state.board[4], '');
    for (const index of [4, -1, 9, .5, NaN]) assert.equal(game.place(next, index), next);
});

test('tic tac toe recognizes all eight winning lines and stops accepting moves', () => {
    for (const line of [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]) {
        const state = game.createState();
        state.board[line[0]] = 'X'; state.board[line[1]] = 'X';
        const others = state.board.map((_, index) => index).filter(index => !line.includes(index));
        state.board[others[0]] = 'O'; state.board[others[1]] = 'O';
        state.moves = 4;
        const won = game.place(state, line[2]);
        assert.equal(won.status, 'won');
        assert.equal(won.winner, 'X');
        assert.deepEqual(won.winning, line);
        assert.equal(game.place(won, others[2]), won);
    }
});

test('tic tac toe computer takes a win before blocking, otherwise defends and considers the centre', () => {
    const state = { ...game.createState(), board: ['O', 'O', '', 'X', 'X', '', '', '', 'X'], turn: 'O', moves: 5 };
    assert.equal(game.chooseComputerMove(state), 2);
    assert.equal(game.chooseComputerMove({ ...state, board: ['X', 'X', '', '', 'O', '', '', '', ''] }), 2);
    assert.equal(game.chooseComputerMove(game.place(game.createState(), 0)), 4);
    assert.equal(state.board[2], '');
});

test('tic tac toe detects a full-board draw without inventing a winner', () => {
    let state = game.createState();
    for (const index of [0, 1, 2, 4, 3, 5, 7, 6, 8]) state = game.place(state, index);
    assert.equal(state.status, 'over');
    assert.equal(state.winner, '');
    assert.equal(state.moves, 9);
    assert.equal(game.chooseComputerMove(state), -1);
});

test('tic tac toe computer always selects a legal cell in complete simulated rounds', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
        const rng = random(seed);
        let state = game.createState();
        while (state.status === 'playing') {
            const free = state.board.flatMap((cell, index) => cell ? [] : [index]);
            const chosen = state.turn === 'O' ? game.chooseComputerMove(state, rng) : free[Math.floor(rng() * free.length)];
            assert.ok(free.includes(chosen));
            state = game.place(state, chosen);
            assert.ok(state.moves <= 9);
        }
    }
});
