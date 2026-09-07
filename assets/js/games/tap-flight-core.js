'use strict';

const WIDTH = 400;
const HEIGHT = 480;
const FLOOR = 464;
const RADIUS = 12;
const GAP = 150;
const PIPE_WIDTH = 58;
const SPEED = 140;
const SPACING = 210;
const GRAVITY = 1000;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function pipeAt(x, random) {
    return { x, top: 75 + random() * (FLOOR - GAP - 150), scored: false };
}

function createState(random = Math.random) {
    return {
        bird: { x: 96, y: 230, vy: 0 }, pipes: [pipeAt(WIDTH, random)],
        score: 0, started: false, elapsed: 0, status: 'playing',
    };
}

function flap(state) {
    if (state.status !== 'playing') return state;
    return { ...state, started: true, bird: { ...state.bird, vy: -300 } };
}

function intersects(bird, x, y, width, height) {
    const nearestX = clamp(bird.x, x, x + width);
    const nearestY = clamp(bird.y, y, y + height);
    return (bird.x - nearestX) ** 2 + (bird.y - nearestY) ** 2 <= RADIUS ** 2;
}

function advance(state, seconds, random = Math.random) {
    if (state.status !== 'playing' || !state.started || !Number.isFinite(seconds) || seconds <= 0) return state;
    const next = { ...state, bird: { ...state.bird }, pipes: state.pipes.map(pipe => ({ ...pipe })) };
    const count = Math.ceil(Math.min(seconds, 1) * 240);
    const delta = Math.min(seconds, 1) / count;
    for (let step = 0; step < count; step += 1) {
        next.elapsed += delta;
        next.bird.y += next.bird.vy * delta + .5 * GRAVITY * delta ** 2;
        next.bird.vy += GRAVITY * delta;
        next.pipes.forEach(pipe => { pipe.x -= SPEED * delta; });
        const last = next.pipes[next.pipes.length - 1];
        if (last.x <= WIDTH - SPACING) next.pipes.push(pipeAt(last.x + SPACING, random));
        if (next.bird.y - RADIUS <= 0 || next.bird.y + RADIUS >= FLOOR
            || next.pipes.some(pipe => intersects(next.bird, pipe.x, 0, PIPE_WIDTH, pipe.top)
                || intersects(next.bird, pipe.x, pipe.top + GAP, PIPE_WIDTH, FLOOR - pipe.top - GAP))) {
            next.status = 'over';
            return next;
        }
        next.pipes.forEach((pipe) => {
            if (!pipe.scored && pipe.x + PIPE_WIDTH < next.bird.x - RADIUS) {
                pipe.scored = true;
                next.score += 1;
            }
        });
        next.pipes = next.pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);
    }
    return next;
}

module.exports = { WIDTH, HEIGHT, FLOOR, RADIUS, GAP, PIPE_WIDTH, createState, flap, advance };
