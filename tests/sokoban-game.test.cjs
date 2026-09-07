const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../assets/js/games/sokoban-core.js');

test('sokoban levels have a player, matching targets and boxes, and enclosing walls', () => {
    game.LEVELS.forEach((rows, index) => {
        const state = game.createState(index);
        assert.ok(rows.every(row => row.length === 7));
        assert.equal(rows.join('').split('@').length - 1, 1);
        assert.equal(state.boxes.length, state.goals.length);
        assert.ok(state.boxes.length > 0);
        assert.ok(rows[0].split('').every(cell => cell === '#'));
        assert.ok(rows[6].split('').every(cell => cell === '#'));
        assert.ok(rows.every(row => row[0] === '#' && row[6] === '#'));
    });
    assert.throws(() => game.createState(-1), RangeError);
    assert.throws(() => game.createState(6), RangeError);
});

test('sokoban walks and pushes immutably, then stops after completing a level', () => {
    const state = game.createState();
    const walk = game.move(state, 'left');
    assert.equal(walk.player, state.player - 1);
    assert.equal(walk.moves, 1);
    assert.equal(walk.pushes, 0);
    const won = game.move(state, 'up');
    assert.equal(won.status, 'won');
    assert.equal(won.moves, 1);
    assert.equal(won.pushes, 1);
    assert.deepEqual(won.boxes, [17]);
    assert.deepEqual(state.boxes, [24]);
    assert.equal(game.move(won, 'down'), won);
});

test('sokoban rejects walls, row wrapping, invalid directions and chained boxes', () => {
    const wall = { ...game.createState(), player: 8 };
    assert.equal(game.move(wall, 'up'), wall);
    assert.equal(game.move(wall, 'left'), wall);
    assert.equal(game.move(wall, 'unknown'), wall);
    const chain = { ...game.createState(2), player: 22 };
    assert.equal(game.move(chain, 'right'), chain);
    assert.equal(chain.moves, 0);
});

test('all six sokoban levels can be solved under the actual movement rules', () => {
    const key = state => state.player + ':' + [...state.boxes].sort((a, b) => a - b).join(',');
    for (let level = 0; level < game.LEVELS.length; level += 1) {
        const initial = game.createState(level);
        const queue = [initial];
        const seen = new Set([key(initial)]);
        let solution = null;
        for (let head = 0; head < queue.length && head < 100000; head += 1) {
            const state = queue[head];
            if (state.status === 'won') { solution = state; break; }
            for (const direction of ['up', 'right', 'down', 'left']) {
                const next = game.move(state, direction);
                const signature = key(next);
                if (seen.has(signature)) continue;
                seen.add(signature);
                queue.push(next);
            }
        }
        assert.ok(solution, 'Level ' + (level + 1) + ' needs a reachable solution');
        assert.ok(solution.moves <= 150);
        assert.ok(solution.goals.every(goal => solution.boxes.includes(goal)));
    }
});
