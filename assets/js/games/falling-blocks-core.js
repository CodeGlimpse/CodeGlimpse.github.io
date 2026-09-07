'use strict';

const COLUMNS = 10;
const ROWS = 20;
const SHAPES = {
    I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]], Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]],
};
const TYPES = Object.keys(SHAPES);

function newBag(random) {
    const bag = [...TYPES];
    for (let index = bag.length - 1; index > 0; index -= 1) {
        const other = Math.floor(random() * (index + 1));
        [bag[index], bag[other]] = [bag[other], bag[index]];
    }
    return bag;
}

function canPlace(board, piece) {
    return piece.matrix.every((row, y) => row.every((filled, x) => {
        if (!filled) return true;
        const column = piece.x + x;
        const line = piece.y + y;
        return column >= 0 && column < COLUMNS && line >= 0 && line < ROWS && board[line * COLUMNS + column] === 0;
    }));
}

function spawn(state, random) {
    let queue = state.queue.length ? [...state.queue] : newBag(random);
    const type = queue.shift();
    if (!queue.length) queue = newBag(random);
    const matrix = SHAPES[type].map(row => [...row]);
    const active = { type, matrix, x: Math.floor((COLUMNS - matrix[0].length) / 2), y: 0 };
    return { ...state, queue, active, status: canPlace(state.board, active) ? 'playing' : 'over' };
}

function createState(random = Math.random) {
    return spawn({ board: Array(COLUMNS * ROWS).fill(0), queue: [], active: null, score: 0, lines: 0, level: 1, pieces: 0, status: 'playing' }, random);
}

function move(state, dx) {
    if (state.status !== 'playing' || ![-1, 1].includes(dx)) return state;
    const active = { ...state.active, x: state.active.x + dx };
    return canPlace(state.board, active) ? { ...state, active } : state;
}

function rotate(state) {
    if (state.status !== 'playing' || state.active.type === 'O') return state;
    const previous = state.active.matrix;
    const matrix = previous[0].map((_, column) => previous.map(row => row[column]).reverse());
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [0, -2], [0, -3]]) {
        const active = { ...state.active, matrix, x: state.active.x + dx, y: state.active.y + dy };
        if (canPlace(state.board, active)) return { ...state, active };
    }
    return state;
}

function settle(state, random) {
    const board = [...state.board];
    state.active.matrix.forEach((row, y) => row.forEach((filled, x) => {
        if (filled) board[(state.active.y + y) * COLUMNS + state.active.x + x] = TYPES.indexOf(state.active.type) + 1;
    }));
    const remaining = [];
    for (let row = 0; row < ROWS; row += 1) {
        const cells = board.slice(row * COLUMNS, (row + 1) * COLUMNS);
        if (cells.some(value => !value)) remaining.push(cells);
    }
    const cleared = ROWS - remaining.length;
    const lines = state.lines + cleared;
    const next = {
        ...state, board: [...Array(cleared * COLUMNS).fill(0), ...remaining.flat()],
        score: state.score + [0, 100, 300, 500, 800][cleared] * state.level,
        lines, level: Math.floor(lines / 10) + 1, pieces: state.pieces + 1,
    };
    return spawn(next, random);
}

function step(state, random = Math.random) {
    if (state.status !== 'playing') return state;
    const active = { ...state.active, y: state.active.y + 1 };
    return canPlace(state.board, active) ? { ...state, active } : settle(state, random);
}

function softDrop(state, random = Math.random) {
    const next = step(state, random);
    return next !== state && next.pieces === state.pieces ? { ...next, score: next.score + 1 } : next;
}

function landing(state) {
    let active = { ...state.active };
    if (state.status !== 'playing') return active;
    while (canPlace(state.board, { ...active, y: active.y + 1 })) active.y += 1;
    return active;
}

function hardDrop(state, random = Math.random) {
    if (state.status !== 'playing') return state;
    const active = landing(state);
    return settle({ ...state, active, score: state.score + (active.y - state.active.y) * 2 }, random);
}

module.exports = { COLUMNS, ROWS, SHAPES, TYPES, createState, canPlace, move, rotate, step, softDrop, hardDrop, landing };
