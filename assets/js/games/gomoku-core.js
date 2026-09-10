'use strict';
const SIZE = 15;
function createState() { return { board: Array(SIZE * SIZE).fill(0), turn: 1, moves: 0, winner: 0, winning: [], last: -1, status: 'playing' }; }
function place(state, index) {
    if (state.status !== 'playing' || !Number.isInteger(index) || index < 0 || index >= SIZE * SIZE || state.board[index]) return state;
    const board = state.board.slice(); board[index] = state.turn;
    const row = Math.floor(index / SIZE), col = index % SIZE;
    let winning = [];
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        const line = [index];
        for (const sign of [-1, 1]) {
            let r = row + dr * sign, c = col + dc * sign;
            while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r * SIZE + c] === state.turn) {
                if (sign < 0) line.unshift(r * SIZE + c); else line.push(r * SIZE + c);
                r += dr * sign; c += dc * sign;
            }
        }
        if (line.length >= 5) { winning = line; break; }
    }
    const moves = state.moves + 1;
    const status = winning.length ? 'won' : moves === SIZE * SIZE ? 'over' : 'playing';
    return { board, moves, winning, winner: winning.length ? state.turn : 0, turn: status === 'playing' ? 3 - state.turn : state.turn, last: index, status };
}
module.exports = { SIZE, createState, place };
