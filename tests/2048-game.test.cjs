const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/2048-core.js');

test('2048 merges each tile at most once per move and counts merged values', () => {
    assert.deepEqual(game.collapse([2,2,2,2]), { values:[4,4,0,0], score:8 });
    assert.deepEqual(game.collapse([2,2,4,0]), { values:[4,4,0,0], score:4 });
    assert.deepEqual(game.collapse([0,2,0,2]), { values:[4,0,0,0], score:4 });
});

test('2048 aligns rows and columns in all four directions without mutating input', () => {
    const board = [2,0,2,0, 2,0,0,0, 0,0,0,0, 0,0,0,0];
    const copy = [...board];
    assert.deepEqual(game.slide(board, 'left').board.slice(0,4), [4,0,0,0]);
    assert.deepEqual(game.slide(board, 'right').board.slice(0,4), [0,0,0,4]);
    assert.equal(game.slide(board, 'up').board[0], 4);
    assert.equal(game.slide(board, 'down').board[12], 4);
    assert.deepEqual(board, copy);
});

test('2048 never spawns a tile or changes score after an ineffective move', () => {
    const state = {board:[2,0,0,0, ...Array(12).fill(0)],score:8,status:'playing'};
    const random = () => { throw new Error('No tile should be created'); };
    assert.equal(game.move(state,'left',random),state);
    assert.equal(game.move(state,'invalid',random),state);
});

test('2048 starts a fresh round and adds exactly one tile after a valid move', () => {
    const initial = game.createState(() => .1);
    assert.equal(initial.board.filter(Boolean).length,2);
    assert.equal(initial.score,0);
    const next = game.move(initial,'left',()=>.1);
    assert.equal(next.score,4);
    assert.equal(next.board[0],4);
    assert.equal(next.board.filter(Boolean).length,2);
    assert.equal(initial.score,0);
});

test('2048 detects wins and full boards with no legal moves', () => {
    const winning = {board:[1024,1024,0,0,...Array(12).fill(0)],score:0,status:'playing'};
    const won = game.move(winning,'left',()=>0);
    assert.equal(won.status,'won');
    assert.equal(won.score,2048);
    assert.equal(game.move(won,'right'),won);
    const blocked = [2,4,2,4, 4,2,4,2, 2,4,2,4, 4,2,4,2];
    assert.equal(game.hasMoves(blocked),false);
    assert.equal(game.hasMoves([...blocked.slice(0,15),0]),true);
    const almost = {board:[...blocked.slice(0,12),0,4,2,4],score:0,status:'playing'};
    assert.equal(game.move(almost,'left',()=>0).status,'over');
});
