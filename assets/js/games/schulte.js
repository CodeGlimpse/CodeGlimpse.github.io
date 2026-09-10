import { SIZE, createState, press } from './schulte-core.js';
import { createControls, createClock, bindGridNavigation } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-schulte-board]');
    const cells = [...board.querySelectorAll('[data-cell-index]')];
    const time = root.querySelector('[data-game-time]');
    const clock = createClock(seconds => { time.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); });
    let state;
    const ui = createControls(root, {
        onRestart: startRound,
        onPause() { clock.pause(); render(); },
        onResume() { clock.resume(); render(); prompt(); },
    });
    function prompt() { ui.setStatus(ui.en ? 'Find ' + state.next + ' next.' : '接下来找到 ' + state.next + '。'); }
    function render() {
        cells.forEach((cell, index) => {
            const number = state.board[index];
            cell.disabled = false; cell.textContent = number;
            cell.dataset.number = number;
            cell.dataset.found = String(number < state.next);
            cell.classList.toggle('is-wrong', index === state.lastWrong);
            cell.setAttribute('aria-disabled', String(!ui.isPlaying()));
            cell.setAttribute('aria-label', String(number) + (number < state.next ? (ui.en ? ', found' : '，已找到') : ''));
        });
        root.querySelector('[data-game-score]').textContent = state.next - 1;
        root.querySelector('[data-schulte-next]').textContent = state.status === 'won' ? '—' : state.next;
        root.querySelector('[data-schulte-mistakes]').textContent = state.mistakes;
    }
    function startRound() {
        clock.reset(); state = createState(); ui.setPhase('playing'); render(); prompt(); ui.focusBoard(); clock.resume();
    }
    board.addEventListener('click', event => {
        const cell = event.target.closest('[data-cell-index]');
        if (!cell || !ui.isPlaying()) return;
        const previous = state.next;
        state = press(state, Number(cell.dataset.cellIndex));
        if (state.status === 'won') {
            clock.pause(); ui.setPhase('won');
            ui.setStatus(ui.en ? 'All 25 found. Time: ' + time.textContent + ', mistakes: ' + state.mistakes + '.' : '25 个数字全部找到！用时 ' + time.textContent + '，误点 ' + state.mistakes + ' 次。');
        } else if (state.next === previous) ui.setStatus(ui.en ? 'Not yet. Look for ' + state.next + '.' : '顺序不对，先找到 ' + state.next + '。');
        else prompt();
        render();
    }, { signal: ui.signal });
    board.addEventListener('keydown', event => { if (event.repeat && (event.key === 'Enter' || event.code === 'Space')) event.preventDefault(); }, { signal: ui.signal });
    bindGridNavigation(board, ui, SIZE);
    startRound();
    return { pause: ui.pause, destroy() { clock.destroy(); ui.destroy(); } };
}
