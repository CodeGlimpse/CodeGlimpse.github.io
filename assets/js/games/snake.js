import { createState, turn, step } from './snake-core.js';
import { createControls, bindDirections } from './ui.js';

export function mount(root) {
    const canvas = root.querySelector('[data-snake-board]');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    const score = root.querySelector('[data-game-score]');
    let state;
    let timer = null;
    const ui = createControls(root, { onRestart: startRound, onPause: stopLoop, onResume: schedule });

    function paint() {
        const dark = document.documentElement.dataset.scheme === 'dark';
        const size = canvas.width / state.size;
        context.fillStyle = dark ? '#1c2d24' : '#eaf4df';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = dark ? '#304737' : '#d5e7c9';
        context.lineWidth = 1;
        for (let index = 1; index < state.size; index += 1) {
            context.beginPath(); context.moveTo(index * size, 0); context.lineTo(index * size, canvas.height); context.stroke();
            context.beginPath(); context.moveTo(0, index * size); context.lineTo(canvas.width, index * size); context.stroke();
        }
        if (state.food) {
            context.fillStyle = '#e16b4f';
            context.beginPath(); context.arc((state.food.x + .5) * size, (state.food.y + .5) * size, size * .34, 0, Math.PI * 2); context.fill();
        }
        state.snake.forEach((cell, index) => {
            context.fillStyle = index === 0 ? (dark ? '#b4df8a' : '#256b3e') : (dark ? '#78b86c' : '#559451');
            context.fillRect(cell.x * size + 1, cell.y * size + 1, size - 2, size - 2);
        });
        const head = state.snake[0];
        context.fillStyle = dark ? '#183820' : '#fff';
        const vertical = state.direction === 'up' || state.direction === 'down';
        const lead = state.direction === 'right' || state.direction === 'down' ? .72 : .28;
        for (const side of [.3, .7]) {
            context.fillRect((head.x + (vertical ? side : lead)) * size - 1.5, (head.y + (vertical ? lead : side)) * size - 1.5, 3, 3);
        }
        score.textContent = String(state.score);
    }
    function stopLoop() { clearTimeout(timer); timer = null; }
    function schedule() {
        stopLoop();
        if (ui.isPlaying()) timer = setTimeout(tick, Math.max(85, 180 - state.score / 2));
    }
    function tick() {
        timer = null;
        if (!ui.isPlaying()) return;
        const previous = state.score;
        state = step(state);
        paint();
        if (state.status !== 'playing') {
            ui.setPhase(state.status);
            ui.setStatus(state.status === 'won' ? (ui.en ? 'The whole board is yours!' : '整张棋盘都是你的了！')
                : (ui.en ? `Round over. Score: ${state.score}. Try another round!` : `本局得分 ${state.score}，再来挑战一次吧！`));
        } else {
            if (state.score > previous) ui.setStatus(ui.en ? '+10 points!' : '+10 分！');
            schedule();
        }
    }
    function startRound() {
        stopLoop();
        state = createState();
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Use the arrow keys, WASD, or direction buttons.' : '使用方向键、WASD 或下方按钮转向。');
        paint();
        schedule();
        ui.focusBoard();
    }
    bindDirections(root, canvas, ui, direction => { state = turn(state, direction); });
    const theme = new MutationObserver(() => { if (state) paint(); });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-scheme'] });
    startRound();
    return { pause: ui.pause, destroy() { stopLoop(); theme.disconnect(); ui.destroy(); } };
}
