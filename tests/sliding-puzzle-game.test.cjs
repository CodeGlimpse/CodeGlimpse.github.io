const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/sliding-puzzle-core.js');
const random = require('./helpers/game-random.cjs');

test('sliding puzzle scrambles are reachable, non-solved permutations even with constant randomness', () => {
    for (const rng of [() => 0, () => .999, ...Array.from({ length: 100 }, (_, index) => random(index + 1))]) {
        const state = game.createState(rng);
        assert.deepEqual([...state.board].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
        assert.equal(state.board[state.blank], 0);
        assert.equal(game.solved(state.board), false);
        let inversions = 0;
        const values = state.board.filter(Boolean);
        for (let left = 0; left < values.length; left += 1) {
            for (let right = left + 1; right < values.length; right += 1) if (values[left] > values[right]) inversions += 1;
        }
        assert.equal(inversions % 2, 0);
        assert.equal(state.moves, 0);
    }
});

test('sliding puzzle accepts only tiles next to the empty space and preserves previous state', () => {
    const state = { size: 3, board: [1, 2, 3, 4, 0, 5, 6, 7, 8], blank: 4, moves: 0, status: 'playing' };
    for (const index of [-1, 0, 2, 4, 8, .5, NaN]) assert.equal(game.move(state, index), state);
    const next = game.move(state, 5);
    assert.deepEqual(next.board, [1, 2, 3, 4, 5, 0, 6, 7, 8]);
    assert.equal(next.blank, 5);
    assert.equal(next.moves, 1);
    assert.equal(state.board[4], 0);
    assert.equal(game.moveBlank(next, 'right'), next);
    assert.equal(game.moveBlank(next, 'unknown'), next);
    assert.equal(game.moveBlank(next, 'left').blank, 4);
});

test('sliding puzzle wins with the empty space at bottom right and then ignores input', () => {
    const state = { size: 3, board: [1, 2, 3, 4, 5, 6, 7, 0, 8], blank: 7, moves: 10, status: 'playing' };
    const won = game.moveBlank(state, 'right');
    assert.equal(won.status, 'won');
    assert.equal(won.moves, 11);
    assert.equal(game.move(won, 7), won);
    assert.equal(game.moveBlank(won, 'left'), won);
});
