'use strict';

const SIZE = 3;
const solved = board => board.every((value, index) => value === (index + 1) % board.length);

function adjacentCells(blank, size = SIZE) {
    const cells = [];
    if (blank >= size) cells.push(blank - size);
    if (blank % size < size - 1) cells.push(blank + 1);
    if (blank < size * (size - 1)) cells.push(blank + size);
    if (blank % size > 0) cells.push(blank - 1);
    return cells;
}

function createState(random = Math.random) {
    const board = Array.from({ length: SIZE * SIZE }, (_, index) => (index + 1) % (SIZE * SIZE));
    let blank = board.length - 1;
    let previous = -1;
    // Legal moves from the solved board preserve reachability.
    for (let count = 0; count < 120; count += 1) {
        const choices = adjacentCells(blank).filter(index => index !== previous);
        const target = choices[Math.floor(random() * choices.length)];
        [board[blank], board[target]] = [board[target], board[blank]];
        previous = blank;
        blank = target;
    }
    if (solved(board)) {
        const target = adjacentCells(blank)[0];
        [board[blank], board[target]] = [board[target], board[blank]];
        blank = target;
    }
    return { size: SIZE, board, blank, moves: 0, status: 'playing' };
}

function move(state, index) {
    if (state.status !== 'playing' || !Number.isInteger(index) || !adjacentCells(state.blank, state.size).includes(index)) return state;
    const board = [...state.board];
    [board[state.blank], board[index]] = [board[index], board[state.blank]];
    return { ...state, board, blank: index, moves: state.moves + 1, status: solved(board) ? 'won' : 'playing' };
}

function moveBlank(state, direction) {
    const offsets = { up: -state.size, right: 1, down: state.size, left: -1 };
    if (!Object.hasOwn(offsets, direction)) return state;
    return move(state, state.blank + offsets[direction]);
}

module.exports = { SIZE, createState, adjacentCells, move, moveBlank, solved };
