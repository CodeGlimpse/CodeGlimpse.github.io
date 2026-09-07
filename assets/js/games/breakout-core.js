'use strict';

const WIDTH = 400;
const HEIGHT = 480;
const RADIUS = 6;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function parkedBall(paddle) {
    return { x: paddle.x + paddle.width / 2, y: paddle.y - RADIUS - 1, vx: 130, vy: -230 };
}

function createState() {
    const paddle = { x: 158, y: 444, width: 84, height: 12 };
    const bricks = Array.from({ length: 28 }, (_, index) => ({
        x: 15 + index % 7 * 54, y: 48 + Math.floor(index / 7) * 26,
        width: 46, height: 18, active: true,
    }));
    return { paddle, ball: parkedBall(paddle), bricks, score: 0, lives: 3, launched: false, status: 'playing' };
}

function setPaddle(state, center) {
    if (state.status !== 'playing' || !Number.isFinite(center)) return state;
    const paddle = { ...state.paddle, x: clamp(center - state.paddle.width / 2, 0, WIDTH - state.paddle.width) };
    return { ...state, paddle, ball: state.launched ? state.ball : parkedBall(paddle) };
}

function launch(state) {
    return state.status === 'playing' && !state.launched ? { ...state, launched: true } : state;
}

function overlap(ball, rectangle) {
    const x = clamp(ball.x, rectangle.x, rectangle.x + rectangle.width);
    const y = clamp(ball.y, rectangle.y, rectangle.y + rectangle.height);
    return (ball.x - x) ** 2 + (ball.y - y) ** 2 <= RADIUS ** 2;
}

function bounceBrick(ball, brick, previous) {
    if (previous.y <= brick.y - RADIUS) {
        ball.y = brick.y - RADIUS - .01;
        ball.vy = -Math.abs(ball.vy);
    } else if (previous.y >= brick.y + brick.height + RADIUS) {
        ball.y = brick.y + brick.height + RADIUS + .01;
        ball.vy = Math.abs(ball.vy);
    } else if (previous.x < brick.x) {
        ball.x = brick.x - RADIUS - .01;
        ball.vx = -Math.abs(ball.vx);
    } else {
        ball.x = brick.x + brick.width + RADIUS + .01;
        ball.vx = Math.abs(ball.vx);
    }
    const speed = Math.hypot(ball.vx, ball.vy);
    const factor = Math.min(380, speed + 3) / speed;
    ball.vx *= factor;
    ball.vy *= factor;
}

function advance(state, seconds) {
    if (state.status !== 'playing' || !state.launched || !Number.isFinite(seconds) || seconds <= 0) return state;
    const next = { ...state, ball: { ...state.ball }, bricks: state.bricks.map(brick => ({ ...brick })) };
    const count = Math.ceil(Math.min(seconds, 1) * 240);
    const delta = Math.min(seconds, 1) / count;
    // Small bounded steps keep the ball from crossing a thin brick between collision checks.
    for (let step = 0; step < count; step += 1) {
        const ball = next.ball;
        const previous = { x: ball.x, y: ball.y };
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;
        if (ball.x < RADIUS) { ball.x = RADIUS; ball.vx = Math.abs(ball.vx); }
        if (ball.x > WIDTH - RADIUS) { ball.x = WIDTH - RADIUS; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < RADIUS) { ball.y = RADIUS; ball.vy = Math.abs(ball.vy); }
        if (ball.vy > 0 && previous.y <= next.paddle.y - RADIUS && overlap(ball, next.paddle)) {
            const offset = clamp((ball.x - next.paddle.x - next.paddle.width / 2) / (next.paddle.width / 2), -1, 1);
            const speed = Math.max(265, Math.hypot(ball.vx, ball.vy));
            const angle = offset * 1.05;
            ball.vx = Math.sin(angle) * speed;
            if (Math.abs(ball.vx) < 30) ball.vx = offset < 0 ? -30 : 30;
            ball.vy = -Math.sqrt(Math.max(1, speed ** 2 - ball.vx ** 2));
            ball.y = next.paddle.y - RADIUS - .01;
        }
        const brick = next.bricks.find(item => item.active && overlap(ball, item));
        if (brick) {
            brick.active = false;
            next.score += 10;
            bounceBrick(ball, brick, previous);
            if (!next.bricks.some(item => item.active)) {
                next.status = 'won';
                return next;
            }
        }
        if (ball.y - RADIUS > HEIGHT) {
            next.lives -= 1;
            next.launched = false;
            if (!next.lives) next.status = 'over';
            else next.ball = parkedBall(next.paddle);
            return next;
        }
    }
    return next;
}

module.exports = { WIDTH, HEIGHT, RADIUS, createState, setPaddle, launch, advance };
