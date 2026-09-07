import { ROUNDS, createState, beginTrial, arm, respond, average } from './reaction-core.js';
import { createControls, bindPauseKeys } from './ui.js';

export function mount(root) {
    const pad = root.querySelector('[data-reaction-target]');
    const message = root.querySelector('[data-reaction-message]');
    const hint = root.querySelector('[data-reaction-hint]');
    const rounds = root.querySelector('[data-reaction-round]');
    const last = root.querySelector('[data-reaction-last]');
    const mean = root.querySelector('[data-reaction-average]');
    let state;
    let timer = null;
    const stop = () => { clearTimeout(timer); timer = null; };
    const ui = createControls(root, {
        onRestart: startRound,
        onPause() { stop(); state = beginTrial(state); render(); },
        onResume: startTrial,
    });
    function render() {
        pad.disabled = false;
        const recent = state.samples[state.samples.length - 1];
        const labels = ui.en
            ? { waiting: ['Wait for green', 'Not yet…'], ready: ['NOW!', 'Tap or press Space'], early: ['Too soon!', 'Tap to try again'], result: [recent + ' ms', 'Tap for the next round'], finished: ['Five rounds complete', 'Average: ' + average(state.samples) + ' ms'] }
            : { waiting: ['等待变绿', '先别点…'], ready: ['现在点！', '点按或按空格'], early: ['抢跑了！', '点按后再试一次'], result: [recent + ' 毫秒', '点按开始下一次'], finished: ['五轮完成', '平均 ' + average(state.samples) + ' 毫秒'] };
        pad.dataset.stage = state.stage;
        pad.setAttribute('aria-disabled', String(!ui.isPlaying()));
        message.textContent = labels[state.stage][0];
        hint.textContent = labels[state.stage][1];
        rounds.textContent = state.samples.length + ' / ' + ROUNDS;
        last.textContent = recent === undefined ? '—' : recent + ' ms';
        mean.textContent = state.samples.length ? average(state.samples) + ' ms' : '—';
    }
    function startTrial() {
        stop();
        state = beginTrial(state);
        ui.setStatus(ui.en ? 'Wait until the panel turns green, then react.' : '等面板变绿后再点，抢跑不计入五次成绩。');
        render();
        timer = setTimeout(() => {
            timer = null;
            if (!ui.isPlaying()) return;
            state = arm(state, performance.now());
            ui.setStatus(ui.en ? 'Green! React now.' : '变绿了，现在点！');
            render();
        }, 1200 + Math.floor(Math.random() * 2300));
    }
    function startRound() {
        state = createState();
        ui.setPhase('playing');
        startTrial();
        ui.focusBoard();
    }
    pad.addEventListener('click', () => {
        if (!ui.isPlaying()) return;
        if (state.stage === 'result' || state.stage === 'early') { startTrial(); return; }
        stop();
        state = respond(state, performance.now());
        if (state.status === 'won') {
            ui.setPhase('won');
            ui.setStatus(ui.en ? 'Five reactions recorded. Average: ' + average(state.samples) + ' ms.' : '五次反应已完成，平均用时 ' + average(state.samples) + ' 毫秒。');
        } else {
            ui.setStatus(state.stage === 'early' ? (ui.en ? 'Too soon. Tap the panel to wait for a new signal.' : '抢跑了，这次不计成绩。点按面板等待新的信号。')
                : (ui.en ? 'Recorded. Tap the panel for your next attempt.' : '成绩已记录，点按面板进入下一次。'));
        }
        render();
    }, { signal: ui.signal });
    pad.addEventListener('keydown', (event) => {
        if (event.repeat && (event.key === 'Enter' || event.code === 'Space')) event.preventDefault();
    }, { signal: ui.signal });
    bindPauseKeys(pad, ui);
    startRound();
    return { pause: ui.pause, destroy() { stop(); ui.destroy(); } };
}
