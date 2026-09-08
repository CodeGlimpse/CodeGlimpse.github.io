import { ROUNDS, createState, beginTrial, arm, respond, average, inputTime } from './reaction-core.js';
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
    let signalFrame = null;
    const stop = () => {
        clearTimeout(timer);
        timer = null;
        if (signalFrame !== null) cancelAnimationFrame(signalFrame);
        signalFrame = null;
    };
    const ui = createControls(root, {
        onRestart: startRound,
        onPause() { stop(); state = beginTrial(state); render(); },
        onResume: startTrial,
    });
    function render(stage = state.stage) {
        pad.disabled = false;
        const recent = state.samples[state.samples.length - 1];
        const labels = ui.en
            ? { waiting: ['Wait for green', 'Not yet…'], ready: ['NOW!', 'Press to react'], early: ['Too soon!', 'Press to try again'], result: [recent + ' ms', 'Press for the next round'], finished: ['Five rounds complete', 'Average: ' + average(state.samples) + ' ms'] }
            : { waiting: ['等待变绿', '先别按…'], ready: ['现在按！', '按下立即记录'], early: ['抢跑了！', '按下面板再试一次'], result: [recent + ' 毫秒', '按下面板开始下一次'], finished: ['五轮完成', '平均 ' + average(state.samples) + ' 毫秒'] };
        pad.dataset.stage = stage;
        pad.setAttribute('aria-disabled', String(!ui.isPlaying()));
        message.textContent = labels[stage][0];
        hint.textContent = labels[stage][1];
        rounds.textContent = state.samples.length + ' / ' + ROUNDS;
        last.textContent = recent === undefined ? '—' : recent + ' ms';
        mean.textContent = state.samples.length ? average(state.samples) + ' ms' : '—';
    }
    function startTrial() {
        stop();
        state = beginTrial(state);
        ui.setStatus(ui.en ? 'Wait for green, then press.' : '等面板变绿后按下，按下时即记录成绩。');
        render();
        timer = setTimeout(() => {
            timer = null;
            if (!ui.isPlaying() || state.stage !== 'waiting') return;
            signalFrame = requestAnimationFrame(() => {
                signalFrame = null;
                if (!ui.isPlaying() || state.stage !== 'waiting') return;
                render('ready');
                ui.setStatus(ui.en ? 'Green! Press now.' : '变绿了，现在按！');
                // Start after the DOM updates in the frame that will paint the signal.
                state = arm(state, performance.now());
            });
        }, 1200 + Math.floor(Math.random() * 2300));
    }
    function startRound() {
        state = createState();
        ui.setPhase('playing');
        startTrial();
        ui.focusBoard();
    }
    function activate(timestamp) {
        if (!ui.isPlaying()) return;
        if (state.stage === 'result' || state.stage === 'early') { startTrial(); return; }
        const next = respond(state, timestamp);
        if (next === state) return;
        stop();
        state = next;
        if (state.status === 'won') {
            ui.setPhase('won');
            ui.setStatus(ui.en ? 'Five reactions recorded. Average: ' + average(state.samples) + ' ms.' : '五次反应已完成，平均用时 ' + average(state.samples) + ' 毫秒。');
        } else {
            ui.setStatus(state.stage === 'early' ? (ui.en ? 'Too soon. Press the panel to wait for a new signal.' : '抢跑了，这次不计成绩。按下面板等待新的信号。')
                : (ui.en ? 'Recorded. Press the panel for your next attempt.' : '成绩已记录，按下面板进入下一次。'));
        }
        render();
    }
    const eventTime = event => inputTime(event.timeStamp, performance.now(), performance.timeOrigin);
    const modified = event => event.altKey || event.ctrlKey || event.metaKey;
    const reactionKey = event => event.key === 'Enter' || event.code === 'Space';
    pad.addEventListener('pointerdown', (event) => {
        if (!ui.isPlaying() || !event.isPrimary || event.button !== 0 || modified(event)) return;
        const timestamp = eventTime(event);
        event.preventDefault();
        pad.focus({ preventScroll: true });
        activate(timestamp);
    }, { signal: ui.signal });
    pad.addEventListener('click', (event) => {
        // Pointer and keyboard presses have already been handled; preserve virtual activation.
        if (event.detail !== 0 || event.pointerType || modified(event)) return;
        activate(eventTime(event));
    }, { signal: ui.signal });
    pad.addEventListener('keydown', (event) => {
        if (!reactionKey(event) || modified(event)) return;
        event.preventDefault();
        if (!event.repeat) activate(eventTime(event));
    }, { signal: ui.signal });
    pad.addEventListener('keyup', (event) => {
        if (reactionKey(event) && !modified(event)) event.preventDefault();
    }, { signal: ui.signal });
    bindPauseKeys(pad, ui);
    startRound();
    return { pause: ui.pause, destroy() { stop(); ui.destroy(); } };
}
