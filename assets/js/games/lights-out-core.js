'use strict';

const SIZE = 5;

function affectedCells(index, size = SIZE) {
    const row = Math.floor(index / size);
    const column = index % size;
    const result = [index];
    if (row > 0) result.push(index - size);
    if (row < size - 1) result.push(index + size);
    if (column > 0) result.push(index - 1);
    if (column < size - 1) result.push(index + 1);
    return result;
}

function createState(random = Math.random) {
    const board = Array(SIZE * SIZE).fill(false);
    for (let index = 0; index < board.length; index += 1) {
        if (random() < .45) affectedCells(index).forEach(cell => { board[cell] = !board[cell]; });
    }
    if (!board.some(Boolean)) affectedCells(0).forEach(cell => { board[cell] = true; });
    return { size: SIZE, board, moves: 0, status: 'playing' };
}

function toggle(state, index) {
    if (state.status !== 'playing' || !Number.isInteger(index) || index < 0 || index >= state.board.length) return state;
    const board = [...state.board];
    affectedCells(index, state.size).forEach(cell => { board[cell] = !board[cell]; });
    return { ...state, board, moves: state.moves + 1, status: board.some(Boolean) ? 'playing' : 'won' };
}

module.exports = { SIZE, createState, toggle, affectedCells };
