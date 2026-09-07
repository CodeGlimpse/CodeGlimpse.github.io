'use strict';

function spawnTile(board, random = Math.random) {
    const free = board.map((value, index) => value === 0 ? index : -1).filter(index => index !== -1);
    if (!free.length) return board;
    const result = [...board];
    result[free[Math.floor(random() * free.length)]] = random() < .9 ? 2 : 4;
    return result;
}

function createState(random = Math.random) {
    return { board: spawnTile(spawnTile(Array(16).fill(0), random), random), score: 0, status: 'playing' };
}

function collapse(line) {
    const numbers = line.filter(Boolean);
    const values = [];
    let score = 0;
    for (let index = 0; index < numbers.length; index += 1) {
        if (numbers[index] === numbers[index + 1]) {
            const value = numbers[index] * 2;
            values.push(value);
            score += value;
            index += 1;
        } else values.push(numbers[index]);
    }
    while (values.length < 4) values.push(0);
    return { values, score };
}

function slide(board, direction) {
    if (!['up', 'down', 'left', 'right'].includes(direction)) return { board, score: 0, changed: false };
    const result = [...board];
    let score = 0;
    for (let line = 0; line < 4; line += 1) {
        const indexes = Array.from({ length: 4 }, (_, offset) => {
            const position = direction === 'right' || direction === 'down' ? 3 - offset : offset;
            return direction === 'left' || direction === 'right' ? line * 4 + position : position * 4 + line;
        });
        const collapsed = collapse(indexes.map(index => board[index]));
        indexes.forEach((index, offset) => { result[index] = collapsed.values[offset]; });
        score += collapsed.score;
    }
    return { board: result, score, changed: result.some((value, index) => value !== board[index]) };
}

function hasMoves(board) {
    if (board.includes(0)) return true;
    return board.some((value, index) => (index % 4 < 3 && board[index + 1] === value) || (index < 12 && board[index + 4] === value));
}

function move(state, direction, random = Math.random) {
    if (state.status !== 'playing') return state;
    const shifted = slide(state.board, direction);
    if (!shifted.changed) return state;
    const board = spawnTile(shifted.board, random);
    const status = board.some(value => value >= 2048) ? 'won' : hasMoves(board) ? 'playing' : 'over';
    return { board, score: state.score + shifted.score, status };
}

module.exports = { createState, collapse, slide, hasMoves, move, spawnTile };
