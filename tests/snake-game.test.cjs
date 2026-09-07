const test = require('node:test');
const assert = require('node:assert/strict');
const snake = require('../assets/js/games/snake-core.js');

test('snake places food off the body and advances without mutating the previous state', () => {
    const state = snake.createState(20, () => 0);
    assert.ok(!state.snake.some(cell => cell.x === state.food.x && cell.y === state.food.y));
    const next = snake.step(state);
    assert.deepEqual(next.snake[0], { x: 11, y: 10 });
    assert.deepEqual(state.snake[0], { x: 10, y: 10 });
    assert.equal(next.snake.length, 3);
    assert.equal(next.score, 0);
});

test('snake rejects reversal and more than one direction change in a tick', () => {
    const state = snake.createState();
    assert.equal(snake.turn(state, 'left'), state);
    assert.equal(snake.turn(state, 'unknown'), state);
    const turned = snake.turn(state, 'up');
    assert.equal(snake.turn(turned, 'left'), turned);
    const next = snake.step(turned);
    assert.equal(next.direction, 'up');
    assert.equal(snake.turn(next, 'left').nextDirection, 'left');
});

test('snake grows, scores, and relocates food to a free cell', () => {
    const initial = snake.createState(20, () => 0);
    const next = snake.step({ ...initial, food: { x: 11, y: 10 } }, () => .5);
    assert.equal(next.score, 10);
    assert.equal(next.snake.length, 4);
    assert.ok(!next.snake.some(cell => cell.x === next.food.x && cell.y === next.food.y));
});

test('snake detects walls and self-collisions but allows movement into a vacated tail', () => {
    const state = snake.createState(4, () => 0);
    assert.equal(snake.step({ ...state, snake: [{ x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }] }).reason, 'wall');
    const loop = { ...state, snake: [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 1 }], direction: 'left', nextDirection: 'left', food: { x: 3, y: 3 } };
    assert.equal(snake.step(loop).status, 'playing');
    const collision = { ...loop, snake: [...loop.snake, { x: 0, y: 0 }] };
    assert.equal(snake.step(collision).reason, 'self');
});

test('snake wins a full board and stops advancing after a finished round', () => {
    const cells = [[2,3],[1,3],[0,3],[0,2],[1,2],[2,2],[3,2],[3,1],[2,1],[1,1],[0,1],[0,0],[1,0],[2,0],[3,0]];
    const state = { size: 4, snake: cells.map(([x,y]) => ({x,y})), food:{x:3,y:3}, direction:'right', nextDirection:'right', score:120, status:'playing' };
    const won = snake.step(state, () => { throw new Error('No random food is needed on a full board'); });
    assert.equal(won.status, 'won');
    assert.equal(won.food, null);
    assert.equal(won.snake.length, 16);
    assert.equal(snake.step(won), won);
});
