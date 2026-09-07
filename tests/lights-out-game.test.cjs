const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/lights-out-core.js');
const random = require('./helpers/game-random.cjs');

test('lights out toggles only orthogonal neighbours without wrapping board edges', () => {
    assert.deepEqual(game.affectedCells(0).sort((a, b) => a - b), [0, 1, 5]);
    assert.deepEqual(game.affectedCells(4).sort((a, b) => a - b), [3, 4, 9]);
    assert.deepEqual(game.affectedCells(12).sort((a, b) => a - b), [7, 11, 12, 13, 17]);
    const state = { size: 5, board: Array(25).fill(false), moves: 0, status: 'playing' };
    const next = game.toggle(state, 12);
    assert.equal(next.board.filter(Boolean).length, 5);
    assert.equal(state.board.some(Boolean), false);
    const won = game.toggle(next, 12);
    assert.equal(won.status, 'won');
    assert.equal(won.moves, 2);
    assert.equal(game.toggle(won, 0), won);
});

test('lights out generates nonempty boards that are solved by reversing their legal scramble', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
        const nextRandom = random(seed);
        const presses = [];
        const state = game.createState(() => {
            const value = nextRandom();
            presses.push(value < .45);
            return value;
        });
        assert.ok(state.board.some(Boolean));
        assert.equal(state.moves, 0);
        let solved = state;
        presses.forEach((pressed, index) => { if (pressed) solved = game.toggle(solved, index); });
        assert.equal(solved.board.some(Boolean), false);
        assert.equal(solved.status, 'won');
    }
    const fallback = game.createState(() => 1);
    assert.equal(game.toggle(fallback, 0).status, 'won');
});

test('lights out ignores invalid cells without consuming moves', () => {
    const state = game.createState(() => .3);
    for (const index of [-1, 25, .5, NaN]) assert.equal(game.toggle(state, index), state);
});
