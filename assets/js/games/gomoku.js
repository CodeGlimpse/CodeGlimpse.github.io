import { SIZE, createState, place } from './gomoku-core.js';
import { createControls, bindGridNavigation } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-gomoku-board]');
    const cells = [...board.querySelectorAll('[data-cell-index]')];
    const placeButton = root.querySelector('[data-gomoku-place]');
    let state, selected = Math.floor(SIZE * SIZE / 2);
    const ui = createControls(root, { onRestart: startRound, onPause: render, onResume: render });
    const player = value => value === 1 ? (ui.en ? 'Black' : '黑方') : (ui.en ? 'White' : '白方');
    function render() {
        cells.forEach((cell, index) => {
            cell.disabled = false; cell.dataset.player = state.board[index];
            cell.dataset.preview = !state.board[index] && selected === index && ui.isPlaying() ? state.turn : 0;
            cell.classList.toggle('is-winning', state.winning.includes(index)); cell.classList.toggle('is-last', state.last === index);
            cell.setAttribute('aria-pressed', String(index === selected));
            cell.setAttribute('aria-disabled', String(!ui.isPlaying() || Boolean(state.board[index])));
            cell.setAttribute('aria-label', (ui.en ? 'Row ' : '第 ') + (Math.floor(index / SIZE) + 1) + (ui.en ? ', column ' : ' 行，第 ') + (index % SIZE + 1) + (ui.en ? ': ' : ' 列：') + (state.board[index] ? player(state.board[index]) : (ui.en ? 'empty' : '空位')));
        });
        root.querySelector('[data-game-moves]').textContent = state.moves;
        root.querySelector('[data-gomoku-turn]').textContent = state.status === 'playing' ? player(state.turn) : '—';
        root.querySelector('[data-gomoku-selection]').textContent = ui.en
            ? 'Selected: row ' + (Math.floor(selected / SIZE) + 1) + ', column ' + (selected % SIZE + 1)
            : '已选：第 ' + (Math.floor(selected / SIZE) + 1) + ' 行，第 ' + (selected % SIZE + 1) + ' 列';
        placeButton.disabled = !ui.isPlaying() || Boolean(state.board[selected]);
    }
    function choose() {
        if (!ui.isPlaying()) return;
        const next = place(state, selected);
        if (next === state) return;
        state = next;
        if (state.status !== 'playing') {
            ui.setPhase(state.status);
            ui.setStatus(state.winner ? (ui.en ? player(state.winner) + ' wins!' : player(state.winner) + '连成五子，获胜！') : (ui.en ? 'The board is full. Draw.' : '棋盘已满，本局平局。'));
        } else ui.setStatus(ui.en ? player(state.turn) + ': select an empty intersection, then place a stone.' : '轮到' + player(state.turn) + '，选好空位后点“落子”。');
        render(); ui.focusBoard();
    }
    function startRound() {
        state = createState(); selected = Math.floor(SIZE * SIZE / 2);
        cells.forEach((cell, index) => { cell.tabIndex = index === selected ? 0 : -1; cell.toggleAttribute('data-focus-board', index === selected); });
        ui.setPhase('playing'); ui.setStatus(ui.en ? 'Black goes first. Select a position, then place a stone.' : '黑方先手，点选位置后再点“落子”。'); render(); ui.focusBoard();
    }
    board.addEventListener('focusin', event => {
        const cell = event.target.closest('[data-cell-index]');
        if (cell && state) { selected = Number(cell.dataset.cellIndex); render(); }
    }, { signal: ui.signal });
    board.addEventListener('click', event => {
        const cell = event.target.closest('[data-cell-index]');
        if (!cell || !ui.isPlaying()) return;
        selected = Number(cell.dataset.cellIndex); render();
    }, { signal: ui.signal });
    board.addEventListener('dblclick', event => { if (event.target.closest('[data-cell-index]')) { event.preventDefault(); choose(); } }, { signal: ui.signal });
    board.addEventListener('keydown', event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === 'Enter' || event.code === 'Space') { event.preventDefault(); if (!event.repeat) choose(); }
    }, { signal: ui.signal });
    placeButton.addEventListener('click', choose, { signal: ui.signal });
    root.querySelectorAll('[data-gomoku-step]').forEach(button => button.addEventListener('click', () => {
        if (!ui.isPlaying()) return;
        const step = button.dataset.gomokuStep;
        const row = Math.floor(selected / SIZE), col = selected % SIZE;
        const nextRow = Math.max(0, Math.min(SIZE - 1, row + (step === 'up' ? -1 : step === 'down' ? 1 : 0)));
        const nextCol = Math.max(0, Math.min(SIZE - 1, col + (step === 'left' ? -1 : step === 'right' ? 1 : 0)));
        selected = nextRow * SIZE + nextCol;
        cells[selected].focus({ preventScroll: true }); render();
    }, { signal: ui.signal }));
    bindGridNavigation(board, ui, SIZE);
    startRound();
    return { pause: ui.pause, destroy: ui.destroy };
}
