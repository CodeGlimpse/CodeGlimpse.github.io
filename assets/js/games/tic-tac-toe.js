import { createState, place, chooseComputerMove } from './tic-tac-toe-core.js';
import { createControls, bindGridNavigation } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-tic-board]');
    const cells = [...board.querySelectorAll('[data-cell-index]')];
    const moves = root.querySelector('[data-game-moves]');
    const turn = root.querySelector('[data-tic-turn]');
    let state;
    let timer = null;
    const stop = () => { clearTimeout(timer); timer = null; };
    const ui = createControls(root, {
        onRestart: startRound,
        onPause() { stop(); render(); },
        onResume() { render(); scheduleComputer(); },
    });
    function render() {
        cells.forEach((cell, index) => {
            cell.disabled = false;
            cell.textContent = state.board[index];
            cell.dataset.player = state.board[index];
            cell.dataset.winning = String(state.winning.includes(index));
            cell.setAttribute('aria-disabled', String(!ui.isPlaying() || state.turn !== 'X' || Boolean(state.board[index])));
            cell.setAttribute('aria-label', (ui.en ? 'Cell ' : '格子 ') + (index + 1) + ': ' + (state.board[index] || (ui.en ? 'empty' : '空')));
        });
        moves.textContent = String(state.moves);
        turn.textContent = state.status !== 'playing' ? '—' : state.turn === 'X' ? (ui.en ? 'You · X' : '你 · X') : (ui.en ? 'CPU · O' : '电脑 · O');
    }
    function report() {
        if (state.status !== 'playing') {
            stop();
            ui.setPhase(state.winner === 'X' ? 'won' : 'over');
            ui.setStatus(state.winner === 'X' ? (ui.en ? 'Three in a row. You win!' : '三子相连，你赢了！')
                : state.winner === 'O' ? (ui.en ? 'The computer wins this round. Try again!' : '电脑赢了这一局，再挑战一次吧！')
                    : (ui.en ? 'A draw. Good game!' : '这一局平局！'));
        } else {
            ui.setStatus(state.turn === 'X' ? (ui.en ? 'Your turn. Place an X.' : '轮到你，选择一个空格放 X。')
                : (ui.en ? 'The computer is choosing a square…' : '电脑正在选择落点…'));
        }
        render();
    }
    function scheduleComputer() {
        stop();
        if (!ui.isPlaying() || state.turn !== 'O') return;
        timer = setTimeout(() => {
            timer = null;
            if (!ui.isPlaying() || state.turn !== 'O') return;
            state = place(state, chooseComputerMove(state));
            report();
        }, 300);
    }
    function startRound() {
        stop();
        state = createState();
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'You are X and go first. Connect three to win.' : '你执 X 先手，连成三个即可获胜。');
        render();
        ui.focusBoard();
    }
    board.addEventListener('click', (event) => {
        const cell = event.target.closest('[data-cell-index]');
        if (!cell || !ui.isPlaying() || state.turn !== 'X') return;
        const next = place(state, Number(cell.dataset.cellIndex));
        if (next === state) return;
        state = next;
        report();
        scheduleComputer();
    }, { signal: ui.signal });
    bindGridNavigation(board, ui, 3);
    startRound();
    return { pause: ui.pause, destroy() { stop(); ui.destroy(); } };
}
