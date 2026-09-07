'use strict';

const DIRECTIONS = Object.freeze({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] });
const same = (left, right) => left.x === right.x && left.y === right.y;

function placeFood(size, snake, random) {
    const occupied = new Set(snake.map(cell => `${cell.x},${cell.y}`));
    const free = [];
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            if (!occupied.has(`${x},${y}`)) free.push({ x, y });
        }
    }
    return free.length ? free[Math.floor(random() * free.length)] : null;
}

function createState(size = 20, random = Math.random) {
    if (!Number.isInteger(size) || size < 4 || size > 40) throw new RangeError('Expected a board size from 4 to 40');
    const center = Math.floor(size / 2);
    const snake = [0, 1, 2].map(offset => ({ x: center - offset, y: center }));
    return { size, snake, direction: 'right', nextDirection: 'right', food: placeFood(size, snake, random), score: 0, status: 'playing' };
}

function turn(state, direction) {
    if (state.status !== 'playing' || !Object.hasOwn(DIRECTIONS, direction) || state.nextDirection !== state.direction) return state;
    const [dx, dy] = DIRECTIONS[direction];
    const [previousX, previousY] = DIRECTIONS[state.direction];
    if (dx + previousX === 0 && dy + previousY === 0) return state;
    return { ...state, nextDirection: direction };
}

function step(state, random = Math.random) {
    if (state.status !== 'playing') return state;
    const direction = state.nextDirection;
    const [dx, dy] = DIRECTIONS[direction];
    const head = { x: state.snake[0].x + dx, y: state.snake[0].y + dy };
    if (head.x < 0 || head.y < 0 || head.x >= state.size || head.y >= state.size) return { ...state, status: 'over', reason: 'wall' };
    const growing = state.food !== null && same(head, state.food);
    const occupied = growing ? state.snake : state.snake.slice(0, -1);
    if (occupied.some(cell => same(head, cell))) return { ...state, status: 'over', reason: 'self' };
    const snake = [head, ...state.snake];
    if (!growing) snake.pop();
    const food = growing ? placeFood(state.size, snake, random) : state.food;
    return { ...state, snake, direction, nextDirection: direction, food, score: state.score + (growing ? 10 : 0), status: food ? 'playing' : 'won' };
}

module.exports = { createState, turn, step, placeFood };
