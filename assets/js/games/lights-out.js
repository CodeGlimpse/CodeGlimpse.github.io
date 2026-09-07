import { createState, toggle } from './lights-out-core.js';
import { createControls, bindGridNavigation } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-lights-board]');
    const cells = [...board.querySelectorAll('[data-cell-index]')];
    const moves = root.querySelector('[data-game-moves]');
    const lights = root.querySelector('[data-lights-on]');
    let state;
    const ui = createControls(root, { onRestart: startRound, onPause: render, onResume: render });
    function render() {
        cells.forEach((button, index) => {
            button.disabled = false;
            button.dataset.on = String(state.board[index]);
            button.firstElementChild.textContent = state.board[index] ? '●' : '○';
            button.setAttribute('aria-pressed', String(state.board[index]));
            button.setAttribute('aria-disabled', String(!ui.isPlaying()));
            button.setAttribute('aria-label', ui.en
                ? 'Row ' + (Math.floor(index / 5) + 1) + ', column ' + (index % 5 + 1) + ', ' + (state.board[index] ? 'on' : 'off')
                : '第 ' + (Math.floor(index / 5) + 1) + ' 行，第 ' + (index % 5 + 1) + ' 列，' + (state.board[index] ? '亮' : '灭'));
        });
        moves.textContent = String(state.moves);
        lights.textContent = String(state.board.filter(Boolean).length);
    }
    function startRound() {
        state = createState();
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Turn every light off. Each press also changes its four neighbours.' : '让所有灯熄灭。每次点按也会切换上下左右的灯。');
        render();
        ui.focusBoard();
    }
    board.addEventListener('click', (event) => {
        const cell = event.target.closest('[data-cell-index]');
        if (!cell || !ui.isPlaying()) return;
        state = toggle(state, Number(cell.dataset.cellIndex));
        if (state.status === 'won') {
            ui.setPhase('won');
            ui.setStatus(ui.en ? 'All lights out in ' + state.moves + ' moves!' : '全部熄灭！一共用了 ' + state.moves + ' 步。');
        } else {
            const remaining = state.board.filter(Boolean).length;
            ui.setStatus(ui.en ? remaining + ' lights are still on.' : '还有 ' + remaining + ' 盏灯亮着。');
        }
        render();
    }, { signal: ui.signal });
    bindGridNavigation(board, ui, 5);
    startRound();
    return { pause: ui.pause, destroy: ui.destroy };
}
