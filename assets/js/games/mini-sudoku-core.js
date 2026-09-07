'use strict';

function peers(index) {
    const row = Math.floor(index / 4);
    const column = index % 4;
    const result = new Set();
    for (let offset = 0; offset < 4; offset += 1) {
        result.add(row * 4 + offset);
        result.add(offset * 4 + column);
        result.add((Math.floor(row / 2) * 2 + Math.floor(offset / 2)) * 4 + Math.floor(column / 2) * 2 + offset % 2);
    }
    result.delete(index);
    return [...result];
}

function conflicts(board) {
    const result = new Set();
    board.forEach((value, index) => {
        if (value && peers(index).some(other => board[other] === value)) result.add(index);
    });
    return result;
}

function countSolutions(values, limit = 2) {
    if (!Array.isArray(values) || values.length !== 16 || values.some(value => !Number.isInteger(value) || value < 0 || value > 4)) throw new RangeError('Expected sixteen values from zero to four');
    if (conflicts(values).size) return 0;
    const board = [...values];
    let count = 0;
    function visit() {
        if (count >= limit) return;
        let chosen = -1;
        let choices = [];
        for (let index = 0; index < 16; index += 1) {
            if (board[index]) continue;
            const candidates = [1, 2, 3, 4].filter(value => peers(index).every(other => board[other] !== value));
            if (!candidates.length) return;
            if (chosen === -1 || candidates.length < choices.length) { chosen = index; choices = candidates; }
        }
        if (chosen === -1) { count += 1; return; }
        for (const value of choices) {
            board[chosen] = value;
            visit();
            board[chosen] = 0;
            if (count >= limit) return;
        }
    }
    visit();
    return count;
}

function shuffle(values, random) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const other = Math.floor(random() * (index + 1));
        [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
}

function createState(random = Math.random) {
    const digits = shuffle([1, 2, 3, 4], random);
    const order = () => shuffle([0, 1], random).flatMap(band => shuffle([0, 1], random).map(offset => band * 2 + offset));
    const rows = order();
    const columns = order();
    const solution = rows.flatMap(row => columns.map(column => digits[(row * 2 + Math.floor(row / 2) + column) % 4]));
    const board = [...solution];
    let clues = 16;
    for (const index of shuffle(Array.from({ length: 16 }, (_, position) => position), random)) {
        if (clues <= 7) break;
        const value = board[index];
        board[index] = 0;
        if (countSolutions(board) === 1) clues -= 1;
        else board[index] = value;
    }
    return { board, solution, givens: board.map(Boolean), moves: 0, status: 'playing' };
}

function setValue(state, index, value) {
    if (state.status !== 'playing' || !Number.isInteger(index) || index < 0 || index >= 16
        || !Number.isInteger(value) || value < 0 || value > 4 || state.givens[index] || state.board[index] === value) return state;
    const board = [...state.board];
    board[index] = value;
    return { ...state, board, moves: state.moves + 1, status: board.every((cell, position) => cell === state.solution[position]) ? 'won' : 'playing' };
}

module.exports = { createState, setValue, countSolutions, conflicts, peers };
