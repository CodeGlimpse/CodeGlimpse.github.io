'use strict';

const LEVELS = [
    ['#######', '#     #', '#  .  #', '#  $  #', '#  @  #', '#     #', '#######'],
    ['#######', '#     #', '# . . #', '# $ $ #', '#  @  #', '#     #', '#######'],
    ['#######', '#     #', '#   . #', '# $$  #', '#   . #', '# @   #', '#######'],
    ['#######', '# . . #', '#     #', '# $#$ #', '#  @  #', '#     #', '#######'],
    ['#######', '# .#  #', '#  #  #', '# $ $ #', '#  #. #', '# @   #', '#######'],
    ['#######', '# .   #', '#   . #', '# $$$ #', '# .   #', '#  @  #', '#######'],
];
const DIRECTIONS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

function createState(level = 0) {
    if (!Number.isInteger(level) || level < 0 || level >= LEVELS.length) throw new RangeError('Unknown level');
    const rows = LEVELS[level];
    const cells = rows.join('').split('');
    return {
        level, width: rows[0].length, height: rows.length,
        walls: cells.map(value => value === '#'),
        goals: cells.flatMap((value, index) => value === '.' ? [index] : []),
        boxes: cells.flatMap((value, index) => value === '$' ? [index] : []),
        player: cells.indexOf('@'), moves: 0, pushes: 0, status: 'playing',
    };
}

function neighbor(state, index, direction) {
    const [dx, dy] = DIRECTIONS[direction];
    const x = index % state.width + dx;
    const y = Math.floor(index / state.width) + dy;
    return x < 0 || y < 0 || x >= state.width || y >= state.height ? -1 : y * state.width + x;
}

function move(state, direction) {
    if (state.status !== 'playing' || !Object.hasOwn(DIRECTIONS, direction)) return state;
    const target = neighbor(state, state.player, direction);
    if (target < 0 || state.walls[target]) return state;
    let boxes = state.boxes;
    const pushing = boxes.includes(target);
    if (pushing) {
        const destination = neighbor(state, target, direction);
        if (destination < 0 || state.walls[destination] || boxes.includes(destination)) return state;
        boxes = boxes.map(box => box === target ? destination : box);
    }
    return { ...state, boxes, player: target, moves: state.moves + 1, pushes: state.pushes + Number(pushing), status: state.goals.every(goal => boxes.includes(goal)) ? 'won' : 'playing' };
}

module.exports = { LEVELS, createState, move };
