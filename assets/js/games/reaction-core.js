'use strict';

const ROUNDS = 5;

function createState() {
    return { samples: [], falseStarts: 0, stage: 'waiting', readyAt: null, status: 'playing' };
}

function beginTrial(state) {
    return state.status === 'playing' ? { ...state, stage: 'waiting', readyAt: null } : state;
}

function arm(state, now) {
    if (state.status !== 'playing' || state.stage !== 'waiting' || !Number.isFinite(now)) return state;
    return { ...state, stage: 'ready', readyAt: now };
}

function respond(state, now) {
    if (state.status !== 'playing') return state;
    if (state.stage === 'waiting') return { ...state, stage: 'early', readyAt: null, falseStarts: state.falseStarts + 1 };
    if (state.stage !== 'ready' || !Number.isFinite(now) || now < state.readyAt) return state;
    const samples = [...state.samples, Math.round(now - state.readyAt)];
    return { ...state, samples, readyAt: null, stage: samples.length === ROUNDS ? 'finished' : 'result', status: samples.length === ROUNDS ? 'won' : 'playing' };
}

function average(samples) {
    return samples.length ? Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length) : 0;
}

module.exports = { ROUNDS, createState, beginTrial, arm, respond, average };
