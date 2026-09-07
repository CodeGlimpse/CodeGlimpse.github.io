import { createState, move } from './2048-core.js';
import { createControls, bindDirections } from './ui.js';

export function mount(root) {
    const board = root.querySelector('[data-puzzle-board]');
    const score = root.querySelector('[data-game-score]');
    const cells = [...board.children];
    let state;
    const ui = createControls(root, { onRestart: startRound });

    function render() {
        cells.forEach((cell, index) => {
            const value = state.board[index];
            cell.textContent = value ? String(value) : '';
            cell.dataset.value = String(value);
        });
        score.textContent = String(state.score);
    }
    function startRound() {
        state = createState();
        ui.setPhase('playing');
        ui.setStatus(ui.en ? 'Combine equal tiles to reach 2048.' : '合并相同数字，向 2048 挑战。');
        render();
        ui.focusBoard();
    }
    function takeTurn(direction) {
        if (!ui.isPlaying()) return;
        const previous = state;
        state = move(state, direction);
        if (state === previous) return;
        render();
        if (state.status === 'won') {
            ui.setPhase('won');
            ui.setStatus(ui.en ? 'You reached 2048! Start a new round anytime.' : '你合成了 2048！随时可以再开一局。');
        } else if (state.status === 'over') {
            ui.setPhase('over');
            ui.setStatus(ui.en ? 'No moves left. Try another round!' : '没有可以移动的方块了，再试一局吧！');
        } else if (state.score > previous.score) {
            ui.setStatus(ui.en ? `+${state.score - previous.score} points` : `+${state.score - previous.score} 分`);
        }
    }
    bindDirections(root, board, ui, takeTurn);
    startRound();
    return { pause: ui.pause, destroy: ui.destroy };
}
