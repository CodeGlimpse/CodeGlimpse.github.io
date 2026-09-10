import { ROWS, COLS, createState, findPair, match, reshuffle } from './link-pairs-core.js';
import { createControls, createClock, bindGridNavigation } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-link-board]');
    const cells = [...board.querySelectorAll('[data-cell-index]')];
    const symbols = ['🍎', '🍋', '🍇', '🍓', '🍊', '🥝', '🍒', '🍐', '🍑', '🍍', '🍉', '🥥'];
    const time = root.querySelector('[data-game-time]');
    const clock = createClock(seconds => { time.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); });
    let state, selected = null, hint = [];
    const ui = createControls(root, { onRestart: startRound, onPause() { clock.pause(); render(); }, onResume() { clock.resume(); render(); } });
    function render() {
        cells.forEach((cell, index) => {
            const value = state.board[index];
            cell.disabled = false; cell.textContent = value ? symbols[value - 1] : '';
            cell.dataset.value = value; cell.dataset.empty = String(!value);
            cell.setAttribute('aria-pressed', String(selected === index));
            cell.setAttribute('aria-disabled', String(!ui.isPlaying() || !value));
            cell.classList.toggle('is-hint', hint.includes(index));
            cell.setAttribute('aria-label', (ui.en ? 'Row ' : '第 ') + (Math.floor(index / COLS) + 1) + (ui.en ? ', column ' : ' 行，第 ') + (index % COLS + 1) + (ui.en ? ': ' : ' 列：') + (value ? symbols[value - 1] : (ui.en ? 'empty' : '空位')));
        });
        const active = cells.find(cell => cell.hasAttribute('data-focus-board'));
        if (!active || !state.board[Number(active.dataset.cellIndex)]) {
            const first = state.board.findIndex(Boolean);
            cells.forEach((cell, index) => { cell.tabIndex = index === first ? 0 : -1; cell.toggleAttribute('data-focus-board', index === first); });
        }
        const x = col => col === 0 ? 0 : col === COLS + 1 ? 100 : (col - .5) * 100 / COLS;
        const y = row => row === 0 ? 0 : row === ROWS + 1 ? 100 : (row - .5) * 100 / ROWS;
        root.querySelector('[data-link-path]').setAttribute('points', state.lastPath.map(p => x(p.col) + ',' + y(p.row)).join(' '));
        root.querySelector('[data-game-score]').textContent = state.matches;
        root.querySelector('[data-link-shuffles]').textContent = state.shuffles;
    }
    function startRound() {
        clock.reset(); state = createState(); selected = null; hint = [];
        ui.setPhase('playing'); ui.setStatus(ui.en ? 'Match equal tiles with at most two turns.' : '连接相同图案，连线最多转弯两次。');
        render(); ui.focusBoard(); clock.resume();
    }
    board.addEventListener('click', event => {
        const cell = event.target.closest('[data-cell-index]');
        if (!cell || !ui.isPlaying()) return;
        const index = Number(cell.dataset.cellIndex);
        if (!state.board[index]) return;
        hint = [];
        if (selected === index) { selected = null; render(); return; }
        if (selected === null) { selected = index; render(); return; }
        const next = match(state, selected, index);
        if (next === state) {
            selected = index;
            ui.setStatus(ui.en ? 'These tiles cannot connect. Choose another match.' : '这两个图案暂时连不上，再选一对试试。');
        } else {
            state = next; selected = null;
            if (state.status === 'won') {
                clock.pause(); ui.setPhase('won'); ui.setStatus(ui.en ? 'Board cleared in ' + time.textContent + '!' : '棋盘清空了！用时 ' + time.textContent + '。');
            } else ui.setStatus(state.autoShuffled ? (ui.en ? 'No moves remained, so the tiles were reshuffled.' : '没有可连接的图案，已自动重排。') : (ui.en ? 'Pair matched. Keep going!' : '配对成功，继续找下一对吧。'));
        }
        render(); ui.focusBoard();
    }, { signal: ui.signal });
    root.querySelector('[data-link-hint]').addEventListener('click', () => {
        if (!ui.isPlaying()) return;
        const pair = findPair(state.board);
        if (!pair) return;
        selected = null; hint = [pair.from, pair.to]; state = { ...state, lastPath: pair.path };
        ui.setStatus(ui.en ? 'The outlined tiles can be connected.' : '边框标出的两个图案可以连接。'); render(); ui.focusBoard();
    }, { signal: ui.signal });
    root.querySelector('[data-link-shuffle]').addEventListener('click', () => {
        if (!ui.isPlaying()) return;
        state = reshuffle(state); selected = null; hint = []; render(); ui.focusBoard();
        ui.setStatus(ui.en ? 'Tiles reshuffled.' : '图案已重新排列。');
    }, { signal: ui.signal });
    bindGridNavigation(board, ui, COLS);
    startRound();
    return { pause: ui.pause, destroy() { clock.destroy(); ui.destroy(); } };
}
