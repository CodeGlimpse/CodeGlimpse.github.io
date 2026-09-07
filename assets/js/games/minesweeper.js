import { createState, reveal, flag } from './minesweeper-core.js';
import { createControls, createClock, bindGridNavigation } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-mine-board]');
    const cells = [...board.querySelectorAll('[data-cell-index]')];
    const flags = root.querySelector('[data-mine-flags]');
    const cleared = root.querySelector('[data-mine-cleared]');
    const time = root.querySelector('[data-game-time]');
    const modes = [...root.querySelectorAll('[data-mine-mode]')];
    let state;
    let mode = 'reveal';
    const clock = createClock(seconds => { time.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); });
    const ui = createControls(root, {
        onRestart: startRound,
        onPause() { clock.pause(); render(); },
        onResume() { if (state.placed) clock.resume(); render(); },
    });

    function render() {
        const finished = state.status !== 'playing';
        cells.forEach((button, index) => {
            const cell = state.cells[index];
            const mine = finished && cell.mine;
            const wrong = finished && cell.flagged && !cell.mine;
            const visible = cell.revealed || mine;
            button.disabled = false;
            button.textContent = wrong ? '×' : cell.flagged ? '⚑' : mine ? '✹' : cell.revealed && cell.adjacent ? String(cell.adjacent) : '';
            button.dataset.adjacent = String(cell.adjacent);
            button.classList.toggle('is-revealed', visible);
            button.classList.toggle('is-exploded', state.exploded === index);
            button.classList.toggle('is-wrong', wrong);
            button.setAttribute('aria-disabled', String(!ui.isPlaying() || cell.revealed));
            const label = wrong ? (ui.en ? 'incorrect flag' : '错误旗标') : cell.flagged ? (ui.en ? 'flagged' : '已插旗')
                : mine ? (ui.en ? 'mine' : '地雷') : visible ? (ui.en ? cell.adjacent + ' nearby mines' : '周围 ' + cell.adjacent + ' 个雷')
                    : (ui.en ? 'hidden' : '未翻开');
            button.setAttribute('aria-label', ui.en
                ? 'Row ' + (Math.floor(index / 9) + 1) + ', column ' + (index % 9 + 1) + ', ' + label
                : '第 ' + (Math.floor(index / 9) + 1) + ' 行，第 ' + (index % 9 + 1) + ' 列，' + label);
        });
        flags.textContent = state.flags + ' / 10';
        cleared.textContent = state.revealed + ' / 71';
        modes.forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.mineMode === mode)); });
    }
    function act(index, action = mode) {
        if (!ui.isPlaying()) return;
        const previous = state;
        state = action === 'flag' ? flag(state, index) : reveal(state, index);
        if (state === previous) return;
        if (!previous.placed && state.placed) clock.resume();
        if (state.status !== 'playing') {
            clock.pause();
            ui.setPhase(state.status);
            ui.setStatus(state.status === 'won'
                ? (ui.en ? 'All 71 safe cells cleared. Well played!' : '71 个安全格全部翻开，排雷成功！')
                : (ui.en ? 'A mine! The minefield is revealed. Try a new round.' : '碰到地雷了！雷区已揭晓，再来一局吧。'));
        } else if (action === 'flag') {
            ui.setStatus(ui.en ? state.flags + ' of 10 flags placed.' : '已放置 ' + state.flags + ' 面旗标，共 10 面。');
        } else {
            ui.setStatus(ui.en ? state.revealed + ' of 71 safe cells cleared.' : '已翻开 ' + state.revealed + ' 个安全格，共 71 个。');
        }
        render();
    }
    function startRound() {
        clock.reset();
        state = createState();
        mode = 'reveal';
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'The first reveal is safe. Use the numbers to find the mines.' : '首次翻开安全。观察数字，找出地雷的位置。');
        render();
        ui.focusBoard();
    }
    board.addEventListener('click', (event) => {
        const cell = event.target.closest('[data-cell-index]');
        if (cell) act(Number(cell.dataset.cellIndex));
    }, { signal: ui.signal });
    board.addEventListener('contextmenu', (event) => {
        const cell = event.target.closest('[data-cell-index]');
        if (!cell) return;
        event.preventDefault();
        act(Number(cell.dataset.cellIndex), 'flag');
    }, { signal: ui.signal });
    board.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.key.toLowerCase() !== 'f') return;
        const cell = event.target.closest('[data-cell-index]');
        if (!cell) return;
        event.preventDefault();
        act(Number(cell.dataset.cellIndex), 'flag');
    }, { signal: ui.signal });
    modes.forEach(button => button.addEventListener('click', () => {
        if (!ui.isPlaying()) return;
        mode = button.dataset.mineMode;
        render();
        ui.focusBoard();
    }, { signal: ui.signal }));
    bindGridNavigation(board, ui, 9);
    startRound();
    return { pause: ui.pause, destroy() { clock.destroy(); ui.destroy(); } };
}
