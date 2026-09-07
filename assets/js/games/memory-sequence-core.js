'use strict';

const ROUNDS = 10;

function createState(random = Math.random) {
    return { sequence: [Math.floor(random() * 4)], inputIndex: 0, score: 0, stage: 'showing', wrong: -1, status: 'playing' };
}

function beginInput(state) {
    return state.status === 'playing' && state.stage === 'showing' ? { ...state, stage: 'input', inputIndex: 0 } : state;
}

function replay(state) {
    return state.status === 'playing' ? { ...state, stage: 'showing', inputIndex: 0 } : state;
}

function press(state, index, random = Math.random) {
    if (state.status !== 'playing' || state.stage !== 'input' || !Number.isInteger(index) || index < 0 || index > 3) return state;
    if (state.sequence[state.inputIndex] !== index) return { ...state, wrong: index, status: 'over' };
    const inputIndex = state.inputIndex + 1;
    if (inputIndex < state.sequence.length) return { ...state, inputIndex };
    const score = state.sequence.length;
    if (score === ROUNDS) return { ...state, inputIndex, score, status: 'won' };
    return { ...state, sequence: [...state.sequence, Math.floor(random() * 4)], inputIndex: 0, score, stage: 'showing' };
}

module.exports = { ROUNDS, createState, beginInput, replay, press };
