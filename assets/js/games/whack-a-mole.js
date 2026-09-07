import { DURATION, createState, advance, hit } from './whack-a-mole-core.js';
import { createControls, createFrameLoop, bindGridNavigation } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-mole-board]');
    const holes = [...board.querySelectorAll('[data-cell-index]')];
    const score = root.querySelector('[data-game-score]');
    const time = root.querySelector('[data-game-time]');
    let state;
    let lastRender = '';
    const loop = createFrameLoop(tick);
    const ui = createControls(root, {
        onRestart: startRound,
        onPause() { loop.pause(); render(); },
        onResume() { render(); loop.resume(); },
    });
    function render() {
        const seconds = Math.ceil((DURATION - state.elapsed) / 1000);
        const key = [root.dataset.phase, state.active, state.score, seconds].join('|');
        if (key === lastRender) return;
        lastRender = key;
        holes.forEach((button, index) => {
            button.disabled = false;
            button.dataset.up = String(index === state.active);
            button.setAttribute('aria-disabled', String(!ui.isPlaying()));
            button.setAttribute('aria-label', ui.en ? 'Hole ' + (index + 1) + (index === state.active ? ', mole visible' : ', empty')
                : '洞口 ' + (index + 1) + (index === state.active ? '，地鼠出现' : '，空'));
        });
        score.textContent = String(state.score);
        time.textContent = String(seconds);
    }
    function tick(seconds) {
        if (!ui.isPlaying()) return;
        state = advance(state, seconds * 1000);
        if (state.status === 'over') {
            loop.pause();
            ui.setPhase('over');
            ui.setStatus(ui.en ? 'Time up! ' + state.hits + ' hits, ' + state.score + ' points.' : '时间到！打中 ' + state.hits + ' 次，得到 ' + state.score + ' 分。');
        }
        render();
    }
    function strike(index) {
        if (!ui.isPlaying()) return;
        const next = hit(state, index);
        if (next === state) return;
        state = next;
        ui.setStatus(ui.en ? '+10! ' + state.hits + ' hits so far.' : '+10 分！已打中 ' + state.hits + ' 次。');
        render();
    }
    function startRound() {
        loop.pause();
        state = createState();
        lastRender = '';
        ui.setPhase('playing');
        ui.setStatus(ui.en ? '45 seconds. Tap a mole or press its number for 10 points.' : '45 秒挑战！点按地鼠或按对应数字键，每次 10 分。');
        render();
        loop.resume();
        ui.focusBoard();
    }
    board.addEventListener('click', (event) => {
        const hole = event.target.closest('[data-cell-index]');
        if (hole) strike(Number(hole.dataset.cellIndex));
    }, { signal: ui.signal });
    board.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || !/^[1-9]$/.test(event.key) || !ui.isPlaying()) return;
        event.preventDefault();
        strike(Number(event.key) - 1);
    }, { signal: ui.signal });
    bindGridNavigation(board, ui, 3);
    startRound();
    return { pause: ui.pause, destroy() { loop.pause(); ui.destroy(); } };
}
