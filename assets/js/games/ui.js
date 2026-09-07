export function createControls(root, hooks) {
    const events = new AbortController();
    const signal = events.signal;
    const en = root.dataset.lang === 'en';
    const start = root.querySelector('[data-game-start]');
    const pauseButton = root.querySelector('[data-game-pause]');
    const restartButton = root.querySelector('[data-game-restart]');
    const overlay = root.querySelector('[data-game-overlay]');
    const status = root.querySelector('[data-game-status]');

    function setPhase(phase) {
        root.dataset.phase = phase;
        start.hidden = true;
        pauseButton.hidden = false;
        restartButton.hidden = false;
        pauseButton.disabled = phase !== 'playing' && phase !== 'paused';
        pauseButton.textContent = phase === 'paused' ? (en ? 'Resume' : '继续') : (en ? 'Pause' : '暂停');
        overlay.hidden = phase === 'playing' || phase === 'won' || phase === 'over';
        overlay.textContent = phase === 'won' ? (en ? 'You did it!' : '挑战成功！')
            : phase === 'over' ? (en ? 'Round over' : '本局结束') : (en ? 'Paused' : '已暂停');
        root.querySelectorAll('[data-direction], [data-game-action]').forEach((button) => { button.disabled = phase !== 'playing'; });
    }
    function focusBoard() {
        root.querySelector('[data-focus-board]:not([disabled])')?.focus({ preventScroll: true });
        const bounds = root.getBoundingClientRect();
        if (window.innerWidth <= 600 && (bounds.top < 8 || bounds.bottom > window.innerHeight - 8)) {
            root.scrollIntoView({ block: 'start', behavior: 'instant' });
        }
    }
    function pause() {
        if (root.dataset.phase !== 'playing') return;
        setPhase('paused');
        hooks.onPause?.();
    }
    function resume() {
        if (root.dataset.phase !== 'paused') return;
        setPhase('playing');
        hooks.onResume?.();
        focusBoard();
    }
    pauseButton.addEventListener('click', () => root.dataset.phase === 'paused' ? resume() : pause(), { signal });
    restartButton.addEventListener('click', () => { hooks.onRestart(); focusBoard(); }, { signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, { signal });
    document.addEventListener('pointerdown', (event) => {
        if (root.contains(event.target)) return;
        pause();
        const active = document.activeElement;
        if (root.contains(active)) active.blur?.();
    }, { signal });
    root.addEventListener('focusout', (event) => { if (event.relatedTarget && !root.contains(event.relatedTarget)) pause(); }, { signal });
    window.addEventListener('blur', pause, { signal });
    window.addEventListener('pagehide', pause, { signal });
    return {
        en, signal, setPhase, pause, resume, focusBoard,
        isPlaying: () => root.dataset.phase === 'playing',
        setStatus: (message) => { status.textContent = message; },
        destroy: () => events.abort(),
    };
}

export function bindDirections(root, board, ui, move, tap) {
    const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
    board.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.code === 'Space' && ['playing', 'paused'].includes(root.dataset.phase)) {
            event.preventDefault();
            if (ui.isPlaying()) ui.pause(); else ui.resume();
            return;
        }
        const direction = keys[event.key] || keys[event.key.toLowerCase()];
        if (!direction || !ui.isPlaying()) return;
        event.preventDefault();
        move(direction);
    }, { signal: ui.signal });
    root.querySelectorAll('[data-direction]').forEach((button) => {
        button.addEventListener('click', () => {
            if (!ui.isPlaying()) return;
            move(button.dataset.direction);
            board.focus({ preventScroll: true });
        }, { signal: ui.signal });
    });
    let pointer = null;
    board.addEventListener('pointerdown', (event) => {
        if (!ui.isPlaying() || !event.isPrimary || event.button !== 0) return;
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, target: event.target };
        board.setPointerCapture(event.pointerId);
        board.focus({ preventScroll: true });
    }, { signal: ui.signal });
    board.addEventListener('pointerup', (event) => {
        if (!pointer || pointer.id !== event.pointerId) return;
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        const target = pointer.target;
        pointer = null;
        if (!ui.isPlaying()) return;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) tap?.(target);
        else move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        // A moved tile may become disabled; keep subsequent keyboard input on the board.
        board.focus({ preventScroll: true });
    }, { signal: ui.signal });
    board.addEventListener('pointercancel', () => { pointer = null; }, { signal: ui.signal });
    board.addEventListener('lostpointercapture', () => { pointer = null; }, { signal: ui.signal });
}

export function createClock(update) {
    let elapsed = 0;
    let started = 0;
    let timer = null;
    const emit = () => update(Math.floor((elapsed + (timer === null ? 0 : performance.now() - started)) / 1000));
    function pause() {
        if (timer !== null) {
            elapsed += performance.now() - started;
            clearInterval(timer);
            timer = null;
        }
        emit();
    }
    return {
        resume() { if (timer === null) { started = performance.now(); timer = setInterval(emit, 250); } },
        pause,
        reset() { pause(); elapsed = 0; emit(); },
        destroy() { clearInterval(timer); timer = null; },
    };
}

export function bindPauseKeys(board, ui) {
    board.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
        if (event.key.toLowerCase() !== 'p' && event.key !== 'Escape') return;
        event.preventDefault();
        if (ui.isPlaying()) ui.pause(); else ui.resume();
    }, { signal: ui.signal });
}

export function bindGridNavigation(board, ui, columns) {
    const cells = [...board.querySelectorAll('[data-cell-index]')];
    bindPauseKeys(board, ui);
    board.addEventListener('focusin', (event) => {
        const target = event.target.closest('[data-cell-index]');
        if (!target) return;
        cells.forEach((cell) => {
            cell.tabIndex = cell === target ? 0 : -1;
            cell.toggleAttribute('data-focus-board', cell === target);
        });
    }, { signal: ui.signal });
    board.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const cell = event.target.closest('[data-cell-index]');
        if (!cell) return;
        const index = Number(cell.dataset.cellIndex);
        const rowStart = Math.floor(index / columns) * columns;
        const targets = {
            ArrowLeft: index % columns ? index - 1 : index,
            ArrowRight: index % columns < columns - 1 ? index + 1 : index,
            ArrowUp: index >= columns ? index - columns : index,
            ArrowDown: index + columns < cells.length ? index + columns : index,
            Home: rowStart, End: Math.min(cells.length - 1, rowStart + columns - 1),
        };
        if (!Object.hasOwn(targets, event.key)) return;
        event.preventDefault();
        cells[targets[event.key]].focus({ preventScroll: true });
    }, { signal: ui.signal });
}

export function createFrameLoop(update) {
    let frame = null;
    let running = false;
    let previous = 0;
    function tick(now) {
        frame = null;
        if (!running) return;
        const seconds = Math.max(0, (now - previous) / 1000);
        previous = now;
        update(seconds);
        if (running) frame = requestAnimationFrame(tick);
    }
    return {
        resume() {
            if (running) return;
            running = true;
            previous = performance.now();
            frame = requestAnimationFrame(tick);
        },
        pause() { running = false; cancelAnimationFrame(frame); frame = null; },
    };
}

export function watchTheme(paint, signal) {
    const observer = new MutationObserver(paint);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-scheme'] });
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
}
