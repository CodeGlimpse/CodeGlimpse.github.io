import { WIDTH, HEIGHT, RADIUS, createState, setPaddle, launch, advance } from './breakout-core.js';
import { createControls, createFrameLoop, bindPauseKeys, watchTheme } from './ui.js';

export function mount(root) {
    const canvas = root.querySelector('[data-breakout-board]');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    const score = root.querySelector('[data-game-score]');
    const lives = root.querySelector('[data-game-lives]');
    const launchButton = root.querySelector('[data-breakout-launch]');
    const held = new Set();
    let state;
    let dragging = null;
    const loop = createFrameLoop(tick);
    const ui = createControls(root, {
        onRestart: startRound,
        onPause() { loop.pause(); held.clear(); dragging = null; paint(); },
        onResume() { paint(); loop.resume(); },
    });
    function paint() {
        const dark = document.documentElement.dataset.scheme === 'dark';
        context.fillStyle = dark ? '#172638' : '#edf3fc';
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.fillStyle = dark ? '#ffffff0a' : '#3c56890c';
        for (let x = 10; x < WIDTH; x += 20) for (let y = 10; y < HEIGHT; y += 20) context.fillRect(x, y, 2, 2);
        const colors = dark ? ['#87aef1', '#83cec5', '#edb570', '#ed8e97'] : ['#477ccb', '#4a9e91', '#d7984b', '#c65f76'];
        state.bricks.forEach((brick, index) => {
            if (!brick.active) return;
            context.fillStyle = colors[Math.floor(index / 7)];
            context.beginPath();
            context.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
            context.fill();
            context.fillStyle = '#ffffff40';
            context.fillRect(brick.x + 5, brick.y + 3, brick.width - 10, 2);
        });
        context.fillStyle = dark ? '#cadcff' : '#294e8b';
        context.beginPath();
        context.roundRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height, 6);
        context.fill();
        context.fillStyle = dark ? '#ffe1a8' : '#b95828';
        context.beginPath();
        context.arc(state.ball.x, state.ball.y, RADIUS, 0, Math.PI * 2);
        context.fill();
        if (!state.launched && state.status === 'playing') {
            context.fillStyle = dark ? '#c7d7f1' : '#365783';
            context.font = '600 17px system-ui';
            context.textAlign = 'center';
            context.fillText(ui.en ? 'Tap or press Space to launch' : '点按棋盘或按空格发球', WIDTH / 2, HEIGHT * .6);
        }
        if (score.textContent !== String(state.score)) score.textContent = String(state.score);
        if (lives.textContent !== String(state.lives)) lives.textContent = String(state.lives);
        launchButton.disabled = !ui.isPlaying() || state.launched;
    }
    function tick(seconds) {
        if (!ui.isPlaying()) return;
        const delta = Math.min(seconds, .05);
        const direction = (held.has(1) ? 1 : 0) - (held.has(-1) ? 1 : 0);
        if (direction) state = setPaddle(state, state.paddle.x + state.paddle.width / 2 + direction * 360 * delta);
        const previous = state;
        state = advance(state, delta);
        if (state.status !== 'playing') {
            loop.pause();
            held.clear();
            ui.setPhase(state.status);
            ui.setStatus(state.status === 'won' ? (ui.en ? 'Every brick cleared! Score: ' + state.score + '.' : '砖块全部清空！得分 ' + state.score + '。')
                : (ui.en ? 'Round over. Score: ' + state.score + '. Try again!' : '本局结束，得分 ' + state.score + '，再来一次吧！'));
        } else if (state.lives < previous.lives) {
            ui.setStatus(ui.en ? state.lives + ' lives left. Launch when ready.' : '还剩 ' + state.lives + ' 次机会，准备好后再次发球。');
        } else if (state.score > previous.score) {
            ui.setStatus(ui.en ? 'Nice shot! ' + state.score + ' points.' : '击中砖块！当前 ' + state.score + ' 分。');
        }
        paint();
    }
    function launchBall() {
        if (!ui.isPlaying() || state.launched) return;
        state = launch(state);
        ui.setStatus(ui.en ? 'Keep the ball in play. P or Escape pauses.' : '用挡板接住小球，P 或 Esc 暂停。');
        paint();
    }
    function placeFromPointer(event) {
        const box = canvas.getBoundingClientRect();
        state = setPaddle(state, (event.clientX - box.left) * WIDTH / box.width);
        paint();
    }
    function startRound() {
        loop.pause();
        held.clear();
        dragging = null;
        state = createState();
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Move the paddle, then tap the board or press Space to launch.' : '移动挡板，点按棋盘或按空格发球。');
        paint();
        loop.resume();
        ui.focusBoard();
    }
    const directionFor = key => ({ ArrowLeft: -1, ArrowRight: 1, a: -1, d: 1 }[key] || { a: -1, d: 1 }[key.toLowerCase()]);
    canvas.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || !ui.isPlaying()) return;
        const direction = directionFor(event.key);
        if (direction) { event.preventDefault(); held.add(direction); }
        else if (event.code === 'Space' || event.key === 'Enter') {
            event.preventDefault();
            if (!event.repeat) launchBall();
        }
    }, { signal: ui.signal });
    canvas.addEventListener('keyup', event => held.delete(directionFor(event.key)), { signal: ui.signal });
    canvas.addEventListener('pointerdown', (event) => {
        if (!ui.isPlaying() || !event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        dragging = event.pointerId;
        canvas.setPointerCapture(event.pointerId);
        canvas.focus({ preventScroll: true });
        placeFromPointer(event);
        launchBall();
    }, { signal: ui.signal });
    canvas.addEventListener('pointermove', (event) => {
        if (ui.isPlaying() && event.isPrimary && (event.pointerType === 'mouse' || dragging === event.pointerId)) placeFromPointer(event);
    }, { signal: ui.signal });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        canvas.addEventListener(name, () => { dragging = null; }, { signal: ui.signal });
    }
    root.querySelectorAll('[data-paddle-direction]').forEach((button) => {
        const direction = Number(button.dataset.paddleDirection);
        button.addEventListener('pointerdown', (event) => {
            if (!ui.isPlaying() || !event.isPrimary || event.button !== 0) return;
            event.preventDefault();
            held.add(direction);
            button.setPointerCapture(event.pointerId);
            ui.focusBoard();
        }, { signal: ui.signal });
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, () => held.delete(direction), { signal: ui.signal });
        button.addEventListener('click', (event) => {
            if (event.detail !== 0 || !ui.isPlaying()) return;
            state = setPaddle(state, state.paddle.x + state.paddle.width / 2 + direction * 24);
            paint();
            ui.focusBoard();
        }, { signal: ui.signal });
    });
    launchButton.addEventListener('click', () => { launchBall(); ui.focusBoard(); }, { signal: ui.signal });
    bindPauseKeys(canvas, ui);
    watchTheme(paint, ui.signal);
    startRound();
    return { pause: ui.pause, destroy() { loop.pause(); held.clear(); ui.destroy(); } };
}
