import { COLUMNS, ROWS, SHAPES, TYPES, createState, move, rotate, step, softDrop, hardDrop, landing } from './falling-blocks-core.js';
import { createControls, bindPauseKeys, watchTheme } from './ui.js';

const colors = ['#62b9ca', '#e8c86b', '#b092d7', '#7cb878', '#d97780', '#7199d7', '#dcab75'];

export function mount(root) {
    const canvas = root.querySelector('[data-blocks-board]');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    const score = root.querySelector('[data-game-score]');
    const lines = root.querySelector('[data-blocks-lines]');
    const level = root.querySelector('[data-blocks-level]');
    const preview = root.querySelector('[data-blocks-next]');
    let state;
    let timer = null;
    const stop = () => { clearTimeout(timer); timer = null; };
    const ui = createControls(root, { onRestart: startRound, onPause: stop, onResume: schedule });
    function paintPiece(piece, ghost = false) {
        piece.matrix.forEach((row, y) => row.forEach((filled, x) => {
            if (!filled) return;
            context.fillStyle = colors[TYPES.indexOf(piece.type)];
            if (ghost) {
                context.strokeStyle = '#899cb4';
                context.lineWidth = 1.5;
                context.strokeRect((piece.x + x) * 20 + 3, (piece.y + y) * 20 + 3, 14, 14);
            } else context.fillRect((piece.x + x) * 20 + 1, (piece.y + y) * 20 + 1, 18, 18);
        }));
    }
    function paint() {
        const dark = document.documentElement.dataset.scheme === 'dark';
        context.fillStyle = dark ? '#172638' : '#edf3f8';
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (let row = 0; row < ROWS; row += 1) for (let column = 0; column < COLUMNS; column += 1) {
            const value = state.board[row * COLUMNS + column];
            context.fillStyle = value ? colors[value - 1] : (dark ? '#203246' : '#dce6f0');
            context.fillRect(column * 20 + 1, row * 20 + 1, 18, 18);
        }
        if (state.status === 'playing') { paintPiece(landing(state), true); paintPiece(state.active); }
        score.textContent = String(state.score);
        lines.textContent = String(state.lines);
        level.textContent = String(state.level);
        const next = SHAPES[state.queue[0]];
        [...preview.children].forEach((cell, index) => {
            const row = Math.floor(index / 4);
            const column = index % 4;
            cell.style.backgroundColor = next[row]?.[column] ? colors[TYPES.indexOf(state.queue[0])] : 'transparent';
        });
        preview.setAttribute('aria-label', (ui.en ? 'Next piece: ' : '下一块：') + state.queue[0]);
    }
    function report(previous) {
        if (state.status === 'over') {
            stop();
            ui.setPhase('over');
            ui.setStatus(ui.en ? 'The stack reached the top. Score: ' + state.score + '.' : '方块堆到顶了，本局得分 ' + state.score + '。');
        } else if (state.lines > previous.lines) {
            ui.setStatus(ui.en ? 'Cleared ' + (state.lines - previous.lines) + ' lines! Total: ' + state.lines + '.' : '消除了 ' + (state.lines - previous.lines) + ' 行！累计 ' + state.lines + ' 行。');
        }
        paint();
    }
    function schedule() {
        stop();
        if (ui.isPlaying()) timer = setTimeout(() => {
            timer = null;
            const previous = state;
            state = step(state);
            report(previous);
            schedule();
        }, Math.max(100, 650 - (state.level - 1) * 55));
    }
    function act(action) {
        if (!ui.isPlaying()) return;
        const previous = state;
        if (action === 'left') state = move(state, -1);
        else if (action === 'right') state = move(state, 1);
        else if (action === 'rotate') state = rotate(state);
        else if (action === 'down') state = softDrop(state);
        else if (action === 'drop') state = hardDrop(state);
        if (state === previous) return;
        report(previous);
        if (state.pieces !== previous.pieces) schedule();
    }
    function startRound() {
        stop();
        state = createState();
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Fill a row to clear it. Up rotates; Space drops.' : '拼满一整行即可消除，上键旋转，空格落到底。');
        paint();
        schedule();
        ui.focusBoard();
    }
    canvas.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || !ui.isPlaying()) return;
        const action = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rotate', ArrowDown: 'down', a: 'left', d: 'right', w: 'rotate', s: 'down', ' ': 'drop' }[event.key]
            || { a: 'left', d: 'right', w: 'rotate', s: 'down' }[event.key.toLowerCase()];
        if (!action) return;
        event.preventDefault();
        if (!event.repeat || (action !== 'rotate' && action !== 'drop')) act(action);
    }, { signal: ui.signal });
    canvas.addEventListener('pointerdown', (event) => {
        if (!ui.isPlaying() || !event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        canvas.focus({ preventScroll: true });
        act('rotate');
    }, { signal: ui.signal });
    root.querySelectorAll('[data-blocks-action]').forEach(button => button.addEventListener('click', () => { act(button.dataset.blocksAction); ui.focusBoard(); }, { signal: ui.signal }));
    bindPauseKeys(canvas, ui);
    watchTheme(paint, ui.signal);
    startRound();
    return { pause: ui.pause, destroy() { stop(); ui.destroy(); } };
}
