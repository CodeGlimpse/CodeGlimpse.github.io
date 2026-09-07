'use strict';

const SIZE = 9;
const MINE_COUNT = 10;

function neighbors(index, size = SIZE) {
    const cells = [];
    const row = Math.floor(index / size);
    const column = index % size;
    for (let y = Math.max(0, row - 1); y <= Math.min(size - 1, row + 1); y += 1) {
        for (let x = Math.max(0, column - 1); x <= Math.min(size - 1, column + 1); x += 1) {
            if (y * size + x !== index) cells.push(y * size + x);
        }
    }
    return cells;
}

function createState() {
    return {
        size: SIZE, mineCount: MINE_COUNT, placed: false, flags: 0, revealed: 0, exploded: -1, status: 'playing',
        cells: Array.from({ length: SIZE * SIZE }, () => ({ mine: false, adjacent: 0, revealed: false, flagged: false })),
    };
}

function validCell(state, index) {
    return Number.isInteger(index) && index >= 0 && index < state.cells.length;
}

function plantMines(state, first, random) {
    const safe = new Set([first, ...neighbors(first, state.size)]);
    const candidates = state.cells.map((_, index) => index).filter(index => !safe.has(index));
    for (let remaining = candidates.length - 1; remaining > 0; remaining -= 1) {
        const pick = Math.floor(random() * (remaining + 1));
        [candidates[remaining], candidates[pick]] = [candidates[pick], candidates[remaining]];
    }
    candidates.slice(0, state.mineCount).forEach(index => { state.cells[index].mine = true; });
    state.cells.forEach((cell, index) => {
        cell.adjacent = neighbors(index, state.size).filter(other => state.cells[other].mine).length;
    });
    state.placed = true;
}

function reveal(state, index, random = Math.random) {
    if (state.status !== 'playing' || !validCell(state, index) || state.cells[index].revealed || state.cells[index].flagged) return state;
    const next = { ...state, cells: state.cells.map(cell => ({ ...cell })) };
    if (!next.placed) plantMines(next, index, random);
    if (next.cells[index].mine) {
        next.cells[index].revealed = true;
        next.exploded = index;
        next.status = 'over';
        return next;
    }
    const pending = [index];
    while (pending.length) {
        const current = pending.pop();
        const cell = next.cells[current];
        if (cell.revealed || cell.flagged || cell.mine) continue;
        cell.revealed = true;
        next.revealed += 1;
        if (!cell.adjacent) pending.push(...neighbors(current, next.size));
    }
    if (next.revealed === next.cells.length - next.mineCount) next.status = 'won';
    return next;
}

function flag(state, index) {
    if (state.status !== 'playing' || !validCell(state, index) || state.cells[index].revealed) return state;
    const cell = state.cells[index];
    if (!cell.flagged && state.flags >= state.mineCount) return state;
    const cells = state.cells.map((item, position) => position === index ? { ...item, flagged: !item.flagged } : item);
    return { ...state, cells, flags: state.flags + (cell.flagged ? -1 : 1) };
}

module.exports = { SIZE, MINE_COUNT, createState, neighbors, reveal, flag };
