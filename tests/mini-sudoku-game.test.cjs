const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/mini-sudoku-core.js');
const random = require('./helpers/game-random.cjs');

test('mini sudoku generates valid, uniquely solvable puzzles for varied and constant randomness', () => {
    for (const rng of [() => 0, () => .999, ...Array.from({ length: 40 }, (_, index) => random(index + 1))]) {
        const state = game.createState(rng);
        const original = [...state.board];
        assert.equal(game.countSolutions(state.board), 1);
        assert.deepEqual(state.board, original);
        assert.ok(state.givens.filter(Boolean).length >= 7);
        assert.ok(state.board.includes(0));
        const groups = [];
        for (let index = 0; index < 4; index += 1) {
            groups.push(state.solution.slice(index * 4, index * 4 + 4));
            groups.push([0, 1, 2, 3].map(row => state.solution[row * 4 + index]));
        }
        for (const start of [0, 2, 8, 10]) groups.push([start, start + 1, start + 4, start + 5].map(index => state.solution[index]));
        groups.forEach(group => assert.deepEqual([...group].sort(), [1, 2, 3, 4]));
        state.givens.forEach((given, index) => { if (given) assert.equal(state.board[index], state.solution[index]); });
    }
});

test('mini sudoku solution counting distinguishes ambiguous and contradictory boards', () => {
    assert.equal(game.countSolutions(Array(16).fill(0)), 2);
    const invalid = Array(16).fill(0);
    invalid[0] = 1; invalid[1] = 1;
    assert.equal(game.countSolutions(invalid), 0);
    assert.equal(game.countSolutions(game.createState().solution), 1);
    assert.throws(() => game.countSolutions([1, 2]), RangeError);
});

test('mini sudoku protects clues, supports erasing and rejects invalid cell or value input', () => {
    const state = game.createState(random(7));
    const clue = state.givens.indexOf(true);
    const empty = state.givens.indexOf(false);
    assert.equal(game.setValue(state, clue, 0), state);
    for (const index of [-1, 16, .5]) assert.equal(game.setValue(state, index, 1), state);
    for (const value of [-1, 5, .5, NaN]) assert.equal(game.setValue(state, empty, value), state);
    const filled = game.setValue(state, empty, state.solution[empty]);
    assert.equal(filled.moves, 1);
    assert.equal(state.board[empty], 0);
    assert.equal(game.setValue(filled, empty, state.solution[empty]), filled);
    const erased = game.setValue(filled, empty, 0);
    assert.equal(erased.board[empty], 0);
    assert.equal(erased.moves, 2);
});

test('mini sudoku marks row, column and box conflicts without marking unrelated equal digits', () => {
    for (const pair of [[0, 1], [0, 4], [0, 5]]) {
        const board = Array(16).fill(0);
        pair.forEach(index => { board[index] = 1; });
        assert.deepEqual([...game.conflicts(board)].sort(), pair);
    }
    const board = Array(16).fill(0);
    board[0] = 1; board[10] = 1;
    assert.equal(game.conflicts(board).size, 0);
});

test('mini sudoku wins only with a complete correct board and freezes the solution', () => {
    let state = game.createState(random(12));
    const first = state.givens.indexOf(false);
    const wrong = game.setValue(state, first, state.solution[first] % 4 + 1);
    assert.equal(wrong.status, 'playing');
    for (let index = 0; index < 16; index += 1) if (!state.givens[index]) state = game.setValue(state, index, state.solution[index]);
    assert.equal(state.status, 'won');
    assert.equal(game.setValue(state, first, 0), state);
    assert.equal(game.conflicts(state.board).size, 0);
});
