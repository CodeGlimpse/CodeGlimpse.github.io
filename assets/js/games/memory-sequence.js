import { ROUNDS, createState, beginInput, replay, press } from './memory-sequence-core.js';
import { createControls, bindGridNavigation } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-sequence-board]');
    const pads = [...board.querySelectorAll('[data-cell-index]')];
    const score = root.querySelector('[data-game-score]');
    const round = root.querySelector('[data-sequence-round]');
    const timers = new Set();
    let state;
    let lit = -1;
    const ui = createControls(root, {
        onRestart: startRound,
        onPause() { stop(); render(); },
        onResume() { state = replay(state); showSequence(); },
    });
    function stop() {
        timers.forEach(timer => clearTimeout(timer));
        timers.clear();
        lit = -1;
    }
    function schedule(callback, delay) {
        const timer = setTimeout(() => { timers.delete(timer); if (ui.isPlaying()) callback(); }, delay);
        timers.add(timer);
    }
    function render() {
        board.dataset.stage = state.stage;
        pads.forEach((pad, index) => {
            pad.disabled = false;
            pad.dataset.lit = String(lit === index);
            pad.dataset.wrong = String(state.wrong === index);
            pad.setAttribute('aria-pressed', String(lit === index));
            pad.setAttribute('aria-disabled', String(!ui.isPlaying() || state.stage !== 'input'));
        });
        score.textContent = String(state.score);
        round.textContent = state.sequence.length + ' / ' + ROUNDS;
    }
    function showSequence() {
        stop();
        if (!ui.isPlaying()) return;
        ui.setStatus(ui.en ? 'Watch the ' + state.sequence.length + ' flashes, then repeat them.' : '记住这 ' + state.sequence.length + ' 次闪烁，再按顺序重复。');
        render();
        state.sequence.forEach((index, position) => {
            schedule(() => {
                lit = index;
                ui.setStatus(ui.en ? 'Watch: ' + (position + 1) + '/' + state.sequence.length + ', pad ' + (index + 1) + '.'
                    : '演示 ' + (position + 1) + '/' + state.sequence.length + '，色块 ' + (index + 1) + '。');
                render();
            }, 400 + position * 620);
            schedule(() => { lit = -1; render(); }, 800 + position * 620);
        });
        schedule(() => {
            state = beginInput(state);
            lit = -1;
            ui.setStatus(ui.en ? 'Your turn. Repeat the sequence with pads 1–4.' : '轮到你，按刚才的顺序点按 1–4 色块。');
            render();
        }, 400 + state.sequence.length * 620);
    }
    function choose(index) {
        if (!ui.isPlaying()) return;
        const changed = press(state, index);
        if (changed === state) return;
        stop();
        state = changed;
        if (state.status !== 'playing') {
            ui.setPhase(state.status);
            ui.setStatus(state.status === 'won' ? (ui.en ? 'All ten sequences complete. Great memory!' : '十轮全部完成，记忆挑战成功！')
                : (ui.en ? 'That was not the next pad. You completed ' + state.score + ' rounds.' : '顺序不对，本局完成了 ' + state.score + ' 轮。'));
        } else {
            lit = index;
            schedule(() => { lit = -1; render(); }, 140);
            if (state.stage === 'showing') {
                ui.setStatus(ui.en ? 'Correct! The next sequence adds one more flash.' : '答对了！下一轮会多一次闪烁。');
                schedule(showSequence, 650);
            } else ui.setStatus(ui.en ? state.inputIndex + ' of ' + state.sequence.length + ' entered.' : '已输入 ' + state.inputIndex + ' / ' + state.sequence.length + ' 个。');
        }
        render();
    }
    function startRound() {
        stop();
        state = createState();
        ui.setPhase('playing');
        showSequence();
        ui.focusBoard();
    }
    board.addEventListener('click', (event) => {
        const pad = event.target.closest('[data-cell-index]');
        if (pad) choose(Number(pad.dataset.cellIndex));
    }, { signal: ui.signal });
    board.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || !/^[1-4]$/.test(event.key)) return;
        event.preventDefault();
        choose(Number(event.key) - 1);
    }, { signal: ui.signal });
    bindGridNavigation(board, ui, 2);
    startRound();
    return { pause: ui.pause, destroy() { stop(); ui.destroy(); } };
}
