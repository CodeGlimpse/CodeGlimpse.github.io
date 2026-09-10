'use strict';
const SIZE = 5;
function createState(random = Math.random) {
    const board = Array.from({ length: SIZE * SIZE }, (_, index) => index + 1);
    for (let i = board.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [board[i], board[j]] = [board[j], board[i]];
    }
    return { board, next: 1, mistakes: 0, lastWrong: -1, status: 'playing' };
}
function press(state, index) {
    if (state.status !== 'playing' || !Number.isInteger(index) || index < 0 || index >= state.board.length) return state;
    if (state.board[index] !== state.next) return { ...state, mistakes: state.mistakes + 1, lastWrong: index };
    const next = state.next + 1;
    return { ...state, next, lastWrong: -1, status: next > SIZE * SIZE ? 'won' : 'playing' };
}
module.exports = { SIZE, createState, press };
