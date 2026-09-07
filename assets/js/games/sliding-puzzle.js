import { createState, adjacentCells, move, moveBlank } from './sliding-puzzle-core.js';
import { createControls, bindDirections } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-sliding-board]');
    const cells = [...board.querySelectorAll('[data-slide-index]')];
    const moves = root.querySelector('[data-game-moves]');
    let state;
    const ui = createControls(root, { onRestart: startRound, onPause: render, onResume: render });
    function render() {
        const adjacent = adjacentCells(state.blank);
        cells.forEach((button, index) => {
            const value = state.board[index];
            button.textContent = value ? String(value) : '';
            button.dataset.value = String(value);
            button.disabled = !value;
            button.classList.toggle('is-movable', ui.isPlaying() && adjacent.includes(index));
            button.setAttribute('aria-disabled', String(!ui.isPlaying() || !adjacent.includes(index)));
            button.setAttribute('aria-label', value ? (ui.en ? 'Tile ' : '数字 ') + value : (ui.en ? 'Empty space' : '空位'));
        });
        moves.textContent = String(state.moves);
    }
    function accept(next) {
        if (next === state) return;
        state = next;
        if (state.status === 'won') {
            ui.setPhase('won');
            ui.setStatus(ui.en ? 'In order! Solved in ' + state.moves + ' moves.' : '排列完成！一共用了 ' + state.moves + ' 步。');
        } else {
            ui.setStatus(ui.en ? 'Moves: ' + state.moves + '. Empty space at row ' + (Math.floor(state.blank / 3) + 1) + ', column ' + (state.blank % 3 + 1) + '.'
                : '已移动 ' + state.moves + ' 步。空位在第 ' + (Math.floor(state.blank / 3) + 1) + ' 行，第 ' + (state.blank % 3 + 1) + ' 列。');
        }
        render();
    }
    function select(target) {
        const cell = target.closest('[data-slide-index]');
        if (cell && ui.isPlaying()) {
            accept(move(state, Number(cell.dataset.slideIndex)));
            board.focus({ preventScroll: true });
        }
    }
    function startRound() {
        state = createState();
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Put 1–8 in order, with the empty space at the bottom right.' : '把 1–8 按顺序排好，右下角留空。');
        render();
        ui.focusBoard();
    }
    bindDirections(root, board, ui, direction => accept(moveBlank(state, direction)), select);
    board.addEventListener('click', event => { if (event.detail === 0) select(event.target); }, { signal: ui.signal });
    startRound();
    return { pause: ui.pause, destroy: ui.destroy };
}
