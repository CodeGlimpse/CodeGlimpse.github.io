'use strict';
const ROWS = 6;
const COLS = 4;
const PAIRS = ROWS * COLS / 2;
const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
function point(index) { return { row: Math.floor(index / COLS) + 1, col: index % COLS + 1 }; }
function corners(path) {
    return path.filter((p, index) => index === 0 || index === path.length - 1
        || (p.row - path[index - 1].row !== path[index + 1].row - p.row)
        || (p.col - path[index - 1].col !== path[index + 1].col - p.col));
}
function findPath(board, from, to) {
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= ROWS * COLS || to >= ROWS * COLS
        || from === to || !board[from] || board[from] !== board[to]) return null;
    const start = point(from), end = point(to);
    const queue = [{ ...start, direction: -1, turns: 0, path: [start] }];
    const visited = Array.from({ length: (ROWS + 2) * (COLS + 2) }, () => [Infinity, Infinity, Infinity, Infinity]);
    for (let cursor = 0; cursor < queue.length; cursor++) {
        const current = queue[cursor];
        for (let direction = 0; direction < directions.length; direction++) {
            const row = current.row + directions[direction][0], col = current.col + directions[direction][1];
            const turns = current.turns + Number(current.direction !== -1 && current.direction !== direction);
            if (row < 0 || row > ROWS + 1 || col < 0 || col > COLS + 1 || turns > 2) continue;
            const target = row === end.row && col === end.col;
            if (!target && row > 0 && row <= ROWS && col > 0 && col <= COLS && board[(row - 1) * COLS + col - 1]) continue;
            const path = [...current.path, { row, col }];
            if (target) return corners(path);
            const seen = visited[row * (COLS + 2) + col];
            if (seen[direction] <= turns) continue;
            seen[direction] = turns;
            queue.push({ row, col, direction, turns, path });
        }
    }
    return null;
}
function findPair(board) {
    for (let from = 0; from < board.length; from++) {
        if (!board[from]) continue;
        for (let to = from + 1; to < board.length; to++) {
            if (board[from] !== board[to]) continue;
            const path = findPath(board, from, to);
            if (path) return { from, to, path };
        }
    }
    return null;
}
function arrange(board, random = Math.random) {
    const values = board.filter(Boolean);
    for (let attempt = 0; attempt < 12; attempt++) {
        for (let index = values.length - 1; index > 0; index--) {
            const other = Math.floor(random() * (index + 1));
            [values[index], values[other]] = [values[other], values[index]];
        }
        let cursor = 0;
        const next = board.map(value => value ? values[cursor++] : 0);
        if (!values.length || findPair(next)) return next;
    }
    // Valid rounds contain pairs. Packing equal pairs side by side guarantees a move.
    return [...values.sort((a, b) => a - b), ...Array(ROWS * COLS - values.length).fill(0)];
}
function createState(random = Math.random) {
    return { board: arrange(Array.from({ length: ROWS * COLS }, (_, index) => index % PAIRS + 1), random), remaining: ROWS * COLS, matches: 0, shuffles: 0, lastPath: [], autoShuffled: false, status: 'playing' };
}
function match(state, from, to, random = Math.random) {
    if (state.status !== 'playing') return state;
    const path = findPath(state.board, from, to);
    if (!path) return state;
    let board = state.board.slice(); board[from] = board[to] = 0;
    const remaining = board.filter(Boolean).length;
    const autoShuffled = remaining > 0 && !findPair(board);
    if (autoShuffled) board = arrange(board, random);
    return { ...state, board, remaining, matches: state.matches + 1, shuffles: state.shuffles + Number(autoShuffled), lastPath: autoShuffled ? [] : path, autoShuffled, status: remaining ? 'playing' : 'won' };
}
function reshuffle(state, random = Math.random) {
    return state.status !== 'playing' ? state : { ...state, board: arrange(state.board, random), shuffles: state.shuffles + 1, lastPath: [], autoShuffled: false };
}
module.exports = { ROWS, COLS, PAIRS, createState, findPath, findPair, match, reshuffle };
