'use strict';

const COLUMNS = 7;
const ROWS = 6;

function createState() {
    return { board: Array(COLUMNS * ROWS).fill(0), turn: 1, moves: 0, winner: 0, winning: [], status: 'playing' };
}

function winningLine(board, index, player) {
    const row = Math.floor(index / COLUMNS);
    const column = index % COLUMNS;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const cells = [index];
        for (const sign of [-1, 1]) {
            let x = column + dx * sign;
            let y = row + dy * sign;
            while (x >= 0 && x < COLUMNS && y >= 0 && y < ROWS && board[y * COLUMNS + x] === player) {
                cells.push(y * COLUMNS + x);
                x += dx * sign;
                y += dy * sign;
            }
        }
        if (cells.length >= 4) return cells;
    }
    return [];
}

function drop(state, column) {
    if (state.status !== 'playing' || !Number.isInteger(column) || column < 0 || column >= COLUMNS || state.board[column]) return state;
    let row = ROWS - 1;
    while (state.board[row * COLUMNS + column]) row -= 1;
    const index = row * COLUMNS + column;
    const board = [...state.board];
    board[index] = state.turn;
    const winning = winningLine(board, index, state.turn);
    const moves = state.moves + 1;
    const status = winning.length ? 'won' : moves === board.length ? 'over' : 'playing';
    return { board, moves, winning, status, winner: winning.length ? state.turn : 0, turn: status === 'playing' ? 3 - state.turn : state.turn };
}

module.exports = { COLUMNS, ROWS, createState, winningLine, drop };
