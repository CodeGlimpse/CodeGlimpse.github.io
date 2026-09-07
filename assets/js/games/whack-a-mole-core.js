'use strict';

const DURATION = 45000;
const lifetime = elapsed => 950 - 450 * Math.min(1, elapsed / DURATION);
const gap = elapsed => 260 - 120 * Math.min(1, elapsed / DURATION);

function nextHole(previous, random) {
    const choices = Array.from({ length: 9 }, (_, index) => index).filter(index => index !== previous);
    return choices[Math.floor(random() * choices.length)];
}

function createState(random = Math.random) {
    const active = nextHole(-1, random);
    return { elapsed: 0, score: 0, hits: 0, active, previous: active, expiresAt: lifetime(0), spawnAt: lifetime(0) + gap(0), status: 'playing' };
}

function advance(state, milliseconds, random = Math.random) {
    if (state.status !== 'playing' || !Number.isFinite(milliseconds) || milliseconds <= 0) return state;
    const next = { ...state, elapsed: Math.min(DURATION, state.elapsed + milliseconds) };
    while (next.spawnAt <= next.elapsed && next.spawnAt < DURATION) {
        next.active = nextHole(next.previous, random);
        next.previous = next.active;
        next.expiresAt = next.spawnAt + lifetime(next.spawnAt);
        next.spawnAt = next.expiresAt + gap(next.spawnAt);
    }
    if (next.elapsed >= next.expiresAt) next.active = -1;
    if (next.elapsed === DURATION) {
        next.status = 'over';
        next.active = -1;
    }
    return next;
}

function hit(state, index) {
    if (state.status !== 'playing' || index !== state.active || index < 0 || state.elapsed >= state.expiresAt) return state;
    return { ...state, active: -1, hits: state.hits + 1, score: state.score + 10 };
}

module.exports = { DURATION, createState, advance, hit };
