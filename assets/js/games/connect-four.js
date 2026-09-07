import { createState, drop } from './connect-four-core.js';
import { createControls, bindPauseKeys } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-connect-board]');
    const cells = [...board.querySelectorAll('[data-connect-cell]')];
    const columns = [...board.querySelectorAll('[data-connect-column]')];
    const moves = root.querySelector('[data-game-moves]');
    const turn = root.querySelector('[data-connect-turn]');
    let state;
    let selected = 3;
    const ui = createControls(root, { onRestart: startRound, onPause: render, onResume: render });
    const playerName = player => (ui.en ? 'Player ' : '玩家 ') + player;
    function render() {
        cells.forEach((cell, index) => {
            const player = state.board[index];
            cell.dataset.player = String(player);
            cell.dataset.winning = String(state.winning.includes(index));
            cell.textContent = player ? String(player) : '';
            cell.setAttribute('aria-label', ui.en
                ? 'Row ' + (Math.floor(index / 7) + 1) + ', column ' + (index % 7 + 1) + ': ' + (player ? playerName(player) : 'empty')
                : '第 ' + (Math.floor(index / 7) + 1) + ' 行，第 ' + (index % 7 + 1) + ' 列：' + (player ? playerName(player) : '空'));
        });
        columns.forEach((button, index) => {
            button.disabled = !ui.isPlaying() || Boolean(state.board[index]);
            button.dataset.selected = String(selected === index);
        });
        board.dataset.selectedColumn = String(selected);
        board.setAttribute('aria-label', ui.en ? 'Column ' + (selected + 1) + ' selected. Left and right select, Enter drops, P pauses.'
            : '已选择第 ' + (selected + 1) + ' 列。左右键选列，回车落子，P 暂停。');
        moves.textContent = String(state.moves);
        turn.dataset.player = String(state.turn);
        turn.textContent = state.status === 'playing' ? playerName(state.turn) : '—';
    }
    function choose(column) {
        if (!ui.isPlaying()) return;
        selected = column;
        const next = drop(state, column);
        if (next === state) {
            ui.setStatus(ui.en ? 'This column is full. Choose another one.' : '这一列已满，请选择其他列。');
        } else {
            state = next;
            if (state.status !== 'playing') {
                ui.setPhase(state.status);
                ui.setStatus(state.winner ? (ui.en ? playerName(state.winner) + ' wins with four in a row!' : playerName(state.winner) + ' 四子相连，获胜！')
                    : (ui.en ? 'The board is full. This round is a draw.' : '棋盘已满，这一局平局。'));
            } else {
                ui.setStatus(ui.en ? playerName(state.turn) + ', choose a column.' : '轮到' + playerName(state.turn) + '，请选择一列。');
            }
        }
        render();
        ui.focusBoard();
    }
    function startRound() {
        state = createState();
        selected = 3;
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Two players, one board. Player 1 goes first.' : '两个人轮流落子，玩家 1 先手。');
        render();
        ui.focusBoard();
    }
    columns.forEach(button => button.addEventListener('click', () => choose(Number(button.dataset.connectColumn)), { signal: ui.signal }));
    board.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || !ui.isPlaying()) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            selected = Math.max(0, Math.min(6, selected + (event.key === 'ArrowLeft' ? -1 : 1)));
            render();
        } else if ((event.key === 'Enter' || event.code === 'Space') && !event.repeat) {
            event.preventDefault();
            choose(selected);
        }
    }, { signal: ui.signal });
    bindPauseKeys(board, ui);
    startRound();
    return { pause: ui.pause, destroy: ui.destroy };
}
