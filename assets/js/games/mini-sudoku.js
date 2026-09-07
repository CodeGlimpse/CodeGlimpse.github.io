import { createState, setValue, conflicts } from './mini-sudoku-core.js';
import { createControls, bindGridNavigation } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-sudoku-board]');
    const cells = [...board.querySelectorAll('[data-cell-index]')];
    const digits = [...root.querySelectorAll('[data-sudoku-value]')];
    const moves = root.querySelector('[data-game-moves]');
    const remaining = root.querySelector('[data-sudoku-empty]');
    let state;
    let selected = 0;
    const ui = createControls(root, { onRestart: startRound, onPause: render, onResume: render });
    function render() {
        const invalid = conflicts(state.board);
        cells.forEach((cell, index) => {
            cell.disabled = false;
            cell.textContent = state.board[index] ? String(state.board[index]) : '';
            cell.dataset.given = String(state.givens[index]);
            cell.dataset.value = String(state.board[index]);
            cell.dataset.conflict = String(invalid.has(index));
            cell.dataset.selected = String(selected === index);
            cell.tabIndex = selected === index ? 0 : -1;
            cell.toggleAttribute('data-focus-board', selected === index);
            cell.setAttribute('aria-pressed', String(selected === index));
            cell.setAttribute('aria-disabled', String(!ui.isPlaying()));
            cell.setAttribute('aria-label', ui.en
                ? 'Row ' + (Math.floor(index / 4) + 1) + ', column ' + (index % 4 + 1) + ': ' + (state.board[index] || 'empty') + (state.givens[index] ? ', clue' : '') + (invalid.has(index) ? ', conflict' : '')
                : '第 ' + (Math.floor(index / 4) + 1) + ' 行，第 ' + (index % 4 + 1) + ' 列：' + (state.board[index] || '空') + (state.givens[index] ? '，题目数字' : '') + (invalid.has(index) ? '，重复' : ''));
        });
        digits.forEach(button => { button.disabled = !ui.isPlaying() || state.givens[selected]; });
        moves.textContent = String(state.moves);
        remaining.textContent = String(state.board.filter(value => !value).length);
    }
    function fill(value) {
        if (!ui.isPlaying()) return;
        if (state.givens[selected]) {
            ui.setStatus(ui.en ? 'This is a clue. Choose an empty or editable cell.' : '这是题目给出的数字，请选择其他可填写的格子。');
            return;
        }
        const next = setValue(state, selected, value);
        if (next === state) return;
        state = next;
        if (state.status === 'won') {
            ui.setPhase('won');
            ui.setStatus(ui.en ? 'Every row, column and box is complete!' : '每行、每列和每个小宫都完成了！');
        } else {
            ui.setStatus(conflicts(state.board).size ? (ui.en ? 'Some digits repeat. Check the marked cells.' : '有数字重复，请看看标出的格子。')
                : (ui.en ? 'Keep filling the empty cells with 1–4.' : '继续用 1–4 填满空格。'));
        }
        render();
    }
    function startRound() {
        state = createState();
        selected = state.givens.findIndex(given => !given);
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Use 1–4 once in each row, column and 2×2 box.' : '每行、每列和每个 2×2 小宫都要包含 1–4。');
        render();
        ui.focusBoard();
    }
    function select(event) {
        const cell = event.target.closest('[data-cell-index]');
        if (!cell || !ui.isPlaying()) return;
        selected = Number(cell.dataset.cellIndex);
        render();
    }
    board.addEventListener('focusin', select, { signal: ui.signal });
    board.addEventListener('click', select, { signal: ui.signal });
    board.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || !ui.isPlaying()) return;
        if (/^[1-4]$/.test(event.key)) { event.preventDefault(); fill(Number(event.key)); }
        else if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); fill(0); }
    }, { signal: ui.signal });
    digits.forEach(button => button.addEventListener('click', () => { fill(Number(button.dataset.sudokuValue)); ui.focusBoard(); }, { signal: ui.signal }));
    bindGridNavigation(board, ui, 4);
    startRound();
    return { pause: ui.pause, destroy: ui.destroy };
}
