'use strict';

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const lineFor = (board, player) => LINES.find(line => line.every(index => board[index] === player)) || [];

function createState() {
    return { board: Array(9).fill(''), turn: 'X', moves: 0, winner: '', winning: [], status: 'playing' };
}

function place(state, index) {
    if (state.status !== 'playing' || !Number.isInteger(index) || index < 0 || index > 8 || state.board[index]) return state;
    const board = [...state.board];
    board[index] = state.turn;
    const winning = lineFor(board, state.turn);
    const moves = state.moves + 1;
    const status = winning.length ? 'won' : moves === 9 ? 'over' : 'playing';
    return { board, moves, winning, status, winner: winning.length ? state.turn : '', turn: status === 'playing' ? (state.turn === 'X' ? 'O' : 'X') : state.turn };
}

function chooseComputerMove(state, random = Math.random) {
    if (state.status !== 'playing' || state.turn !== 'O') return -1;
    const free = state.board.flatMap((cell, index) => cell ? [] : [index]);
    for (const player of ['O', 'X']) {
        const choice = free.find((index) => {
            const board = [...state.board];
            board[index] = player;
            return lineFor(board, player).length > 0;
        });
        if (choice !== undefined) return choice;
    }
    if (free.includes(4)) return 4;
    return free.length ? free[Math.floor(random() * free.length)] : -1;
}

module.exports = { createState, place, chooseComputerMove };
