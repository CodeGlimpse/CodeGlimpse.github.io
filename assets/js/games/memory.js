import { createState, flip, hideMismatch } from './memory-core.js';
import { createClock, createControls } from './ui.js';

const fruits = [
    ['🍒', '樱桃', 'Cherry'], ['🍋', '柠檬', 'Lemon'], ['🍇', '葡萄', 'Grapes'], ['🍓', '草莓', 'Strawberry'],
    ['🍊', '橙子', 'Orange'], ['🥝', '猕猴桃', 'Kiwi'], ['🍉', '西瓜', 'Watermelon'], ['🍎', '苹果', 'Apple'],
];

export function mount(root) {
    const board = root.querySelector('[data-memory-board]');
    const pairs = root.querySelector('[data-memory-pairs]');
    const moves = root.querySelector('[data-memory-moves]');
    const time = root.querySelector('[data-memory-time]');
    let state;
    let mismatch = null;
    let cards = [];
    const clock = createClock((seconds) => { time.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; });
    const ui = createControls(root, {
        onRestart: startRound,
        onPause() { clearTimeout(mismatch); mismatch = null; clock.pause(); render(); },
        onResume() { clock.resume(); render(); scheduleMismatch(); },
    });

    function render() {
        const paused = root.dataset.phase === 'paused';
        cards.forEach((button, index) => {
            const matched = state.matched.includes(index);
            const visible = !paused && (matched || state.revealed.includes(index));
            const fruit = fruits[state.cards[index]];
            button.textContent = visible ? fruit[0] : '?';
            button.disabled = !ui.isPlaying() || matched || state.revealed.includes(index) || state.revealed.length === 2;
            button.classList.toggle('is-revealed', visible);
            button.classList.toggle('is-matched', matched && !paused);
            button.setAttribute('aria-pressed', String(visible));
            button.setAttribute('aria-label', visible
                ? `${ui.en ? 'Card' : '卡片'} ${index + 1}: ${fruit[ui.en ? 2 : 1]}${matched ? (ui.en ? ', matched' : '，已配对') : ''}`
                : `${ui.en ? 'Card' : '卡片'} ${index + 1}`);
        });
        pairs.textContent = `${state.matched.length / 2} / 8`;
        moves.textContent = String(state.moves);
    }
    function scheduleMismatch() {
        if (state.revealed.length !== 2 || !ui.isPlaying()) return;
        clearTimeout(mismatch);
        mismatch = setTimeout(() => {
            mismatch = null;
            state = hideMismatch(state);
            render();
        }, 750);
    }
    function startRound() {
        clearTimeout(mismatch);
        mismatch = null;
        clock.reset();
        state = createState();
        cards = state.cards.map((_, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'memory-card';
            button.dataset.cardIndex = String(index);
            button.dataset.focusBoard = '';
            return button;
        });
        board.replaceChildren(...cards);
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Find the matching pairs.' : '找出相同的水果卡片。');
        render();
        clock.resume();
        ui.focusBoard();
    }
    board.addEventListener('click', (event) => {
        const button = event.target.closest('[data-card-index]');
        if (!button || !ui.isPlaying()) return;
        const previous = state;
        state = flip(state, Number(button.dataset.cardIndex));
        if (state === previous) return;
        if (state.status === 'won') {
            clock.pause();
            ui.setPhase('won');
            ui.setStatus(ui.en ? `All pairs found in ${state.moves} moves!` : `全部配对成功！一共用了 ${state.moves} 步。`);
        } else if (state.matched.length > previous.matched.length) {
            ui.setStatus(ui.en ? 'A match!' : '配对成功！');
        } else if (state.revealed.length === 2) {
            ui.setStatus(ui.en ? 'Remember these two cards.' : '记住这两张卡片的位置。');
        }
        render();
        scheduleMismatch();
    }, { signal: ui.signal });
    startRound();
    return { pause: ui.pause, destroy() { clearTimeout(mismatch); clock.destroy(); ui.destroy(); } };
}
