'use strict';

function createState(pairCount = 8, random = Math.random) {
    if (!Number.isInteger(pairCount) || pairCount < 1 || pairCount > 8) throw new RangeError('Expected one to eight pairs');
    const cards = Array.from({ length: pairCount * 2 }, (_, index) => index % pairCount);
    for (let index = cards.length - 1; index > 0; index -= 1) {
        const other = Math.floor(random() * (index + 1));
        [cards[index], cards[other]] = [cards[other], cards[index]];
    }
    return { cards, revealed: [], matched: [], moves: 0, status: 'playing' };
}

function flip(state, index) {
    if (state.status !== 'playing' || !Number.isInteger(index) || index < 0 || index >= state.cards.length
        || state.matched.includes(index) || state.revealed.includes(index) || state.revealed.length === 2) return state;
    const revealed = [...state.revealed, index];
    if (revealed.length === 1) return { ...state, revealed };
    const moves = state.moves + 1;
    if (state.cards[revealed[0]] !== state.cards[revealed[1]]) return { ...state, revealed, moves };
    const matched = [...state.matched, ...revealed];
    return { ...state, revealed: [], matched, moves, status: matched.length === state.cards.length ? 'won' : 'playing' };
}

function hideMismatch(state) {
    return state.revealed.length === 2 ? { ...state, revealed: [] } : state;
}

module.exports = { createState, flip, hideMismatch };
