import { WIDTH, HEIGHT, FLOOR, RADIUS, GAP, PIPE_WIDTH, createState, flap, advance } from './tap-flight-core.js';
import { createControls, createFrameLoop, bindPauseKeys, watchTheme } from './ui.js';

export function mount(root) {
    const canvas = root.querySelector('[data-flight-board]');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    const score = root.querySelector('[data-game-score]');
    let state;
    const loop = createFrameLoop(tick);
    const ui = createControls(root, { onRestart: startRound, onPause: () => loop.pause(), onResume: () => loop.resume() });
    function paint() {
        const dark = document.documentElement.dataset.scheme === 'dark';
        context.fillStyle = dark ? '#21283f' : '#e7efff';
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.fillStyle = dark ? '#353e59' : '#ffffffbb';
        for (const [x, y, radius] of [[55, 65, 22], [81, 68, 29], [280, 183, 22], [307, 185, 29]]) {
            context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
        }
        for (const pipe of state.pipes) {
            context.fillStyle = dark ? '#83c3b4' : '#367b71';
            context.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
            context.fillRect(pipe.x, pipe.top + GAP, PIPE_WIDTH, FLOOR - pipe.top - GAP);
            context.fillStyle = dark ? '#acdcd0' : '#5d9e92';
            context.fillRect(pipe.x + 5, 0, 7, pipe.top);
            context.fillRect(pipe.x + 5, pipe.top + GAP, 7, FLOOR - pipe.top - GAP);
            context.fillStyle = dark ? '#507e75' : '#245b54';
            context.fillRect(pipe.x, pipe.top - 7, PIPE_WIDTH, 7);
            context.fillRect(pipe.x, pipe.top + GAP, PIPE_WIDTH, 7);
        }
        context.fillStyle = dark ? '#697789' : '#b5cba1';
        context.fillRect(0, FLOOR, WIDTH, HEIGHT - FLOOR);
        context.save();
        context.translate(state.bird.x, state.bird.y);
        context.rotate(Math.max(-.4, Math.min(.6, state.bird.vy / 700)));
        context.fillStyle = '#f2be63';
        context.beginPath(); context.arc(0, 0, RADIUS, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#c87835';
        context.beginPath(); context.ellipse(-5, 4, 7, 4, -.3, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#303747';
        context.beginPath(); context.arc(4, -4, 2.5, 0, Math.PI * 2); context.fill();
        context.restore();
        if (!state.started) {
            context.fillStyle = dark ? '#d6def5' : '#3f5176';
            context.font = '600 17px system-ui';
            context.textAlign = 'center';
            context.fillText(ui.en ? 'Tap or press Space to fly' : '点按或按空格起飞', WIDTH / 2, 330);
        }
        if (score.textContent !== String(state.score)) score.textContent = String(state.score);
    }
    function tick(seconds) {
        if (!ui.isPlaying()) return;
        const previous = state.score;
        state = advance(state, Math.min(seconds, .05));
        if (state.status === 'over') {
            loop.pause();
            ui.setPhase('over');
            ui.setStatus(ui.en ? 'Flight over. You passed ' + state.score + ' obstacles. Try again!' : '飞行结束，通过 ' + state.score + ' 道障碍，再试一次吧！');
        } else if (state.score > previous) {
            ui.setStatus(ui.en ? state.score + ' obstacles passed. Keep going!' : '已通过 ' + state.score + ' 道障碍，继续加油！');
        }
        paint();
    }
    function fly() {
        if (!ui.isPlaying()) return;
        const first = !state.started;
        state = flap(state);
        if (first) ui.setStatus(ui.en ? 'Tap to rise and fly through the gaps. P or Escape pauses.' : '点按向上飞，从空隙穿过，P 或 Esc 暂停。');
        paint();
    }
    function startRound() {
        loop.pause();
        state = createState();
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Ready to fly? Tap the board or press Space.' : '准备起飞！点按棋盘或按空格。');
        paint();
        loop.resume();
        ui.focusBoard();
    }
    canvas.addEventListener('pointerdown', (event) => {
        if (!event.isPrimary || event.button !== 0 || !ui.isPlaying()) return;
        event.preventDefault();
        canvas.focus({ preventScroll: true });
        fly();
    }, { signal: ui.signal });
    canvas.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || !ui.isPlaying()) return;
        if (event.code !== 'Space' && event.key !== 'ArrowUp' && event.key !== 'Enter') return;
        event.preventDefault();
        if (!event.repeat) fly();
    }, { signal: ui.signal });
    root.querySelector('[data-flight-flap]').addEventListener('click', () => { fly(); ui.focusBoard(); }, { signal: ui.signal });
    bindPauseKeys(canvas, ui);
    watchTheme(paint, ui.signal);
    startRound();
    return { pause: ui.pause, destroy() { loop.pause(); ui.destroy(); } };
}
