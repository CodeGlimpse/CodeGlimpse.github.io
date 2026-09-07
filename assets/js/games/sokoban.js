import { LEVELS, createState, move } from './sokoban-core.js';
import { createControls, bindDirections } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-sokoban-board]');
    const cells = [...board.querySelectorAll('[data-sokoban-cell]')];
    const moves = root.querySelector('[data-game-moves]');
    const pushes = root.querySelector('[data-sokoban-pushes]');
    const level = root.querySelector('[data-sokoban-level]');
    const undo = root.querySelector('[data-sokoban-undo]');
    const next = root.querySelector('[data-sokoban-next]');
    let state;
    let history = [];
    const ui = createControls(root, { onRestart: () => startLevel(state.level), onPause: render, onResume: render });
    function render() {
        board.style.setProperty('--sokoban-columns', String(state.width));
        cells.forEach((cell, index) => {
            const wall = state.walls[index];
            const goal = state.goals.includes(index);
            const box = state.boxes.includes(index);
            const player = state.player === index;
            cell.dataset.wall = String(wall);
            cell.dataset.goal = String(goal);
            cell.dataset.box = String(box);
            cell.dataset.player = String(player);
            cell.textContent = player ? '●' : box ? (goal ? '✓' : '×') : goal ? '○' : '';
            const label = wall ? (ui.en ? 'wall' : '墙') : player ? (ui.en ? 'you' : '你')
                : box ? (goal ? (ui.en ? 'box on target' : '箱子已就位') : (ui.en ? 'box' : '箱子')) : goal ? (ui.en ? 'target' : '目标') : (ui.en ? 'floor' : '地面');
            cell.setAttribute('aria-label', (ui.en ? 'Row ' : '第 ') + (Math.floor(index / state.width) + 1) + (ui.en ? ', column ' : ' 行，第 ') + (index % state.width + 1) + (ui.en ? ': ' : ' 列：') + label);
        });
        moves.textContent = String(state.moves);
        pushes.textContent = String(state.pushes);
        level.textContent = (state.level + 1) + ' / ' + LEVELS.length;
        undo.disabled = history.length === 0 || root.dataset.phase === 'paused';
        next.disabled = state.status !== 'won' || state.level === LEVELS.length - 1;
    }
    function startLevel(index) {
        state = createState(index);
        history = [];
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Push every box onto a circle. Undo is available.' : '把每个箱子推到圆圈上，推错了可以撤销。');
        render();
        ui.focusBoard();
    }
    function walk(direction) {
        const changed = move(state, direction);
        if (changed === state) return;
        history.push(state);
        state = changed;
        if (state.status === 'won') {
            ui.setPhase('won');
            ui.setStatus(state.level === LEVELS.length - 1 ? (ui.en ? 'All six levels complete!' : '六关全部完成！')
                : (ui.en ? 'Level complete! The next level is ready.' : '这一关完成了！可以进入下一关。'));
        } else {
            const placed = state.goals.filter(goal => state.boxes.includes(goal)).length;
            ui.setStatus(ui.en ? placed + ' of ' + state.boxes.length + ' boxes on target.' : '已有 ' + placed + ' / ' + state.boxes.length + ' 个箱子就位。');
        }
        render();
    }
    undo.addEventListener('click', () => {
        if (!history.length || root.dataset.phase === 'paused') return;
        state = history.pop();
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Move undone.' : '已撤销上一步。');
        render();
        ui.focusBoard();
    }, { signal: ui.signal });
    next.addEventListener('click', () => {
        if (state.status === 'won' && state.level < LEVELS.length - 1) startLevel(state.level + 1);
    }, { signal: ui.signal });
    bindDirections(root, board, ui, walk);
    startLevel(0);
    return { pause: ui.pause, destroy: ui.destroy };
}
