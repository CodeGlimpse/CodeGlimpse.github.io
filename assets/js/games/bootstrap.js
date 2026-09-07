const root = document.querySelector('[data-game-module]');
if (root) {
    const button = root.querySelector('[data-game-start]');
    const status = root.querySelector('[data-game-status]');
    const en = root.dataset.lang === 'en';
    let instance = null;
    let loading = false;
    let failed = false;
    button.disabled = false;

    button.addEventListener('click', async () => {
        if (failed) { window.location.reload(); return; }
        if (loading || instance) return;
        loading = true;
        button.disabled = true;
        root.dataset.phase = 'loading';
        root.setAttribute('aria-busy', 'true');
        status.textContent = en ? 'Getting your game ready…' : '正在准备游戏…';
        try {
            const url = new URL(root.dataset.gameModule, window.location.href);
            if (url.origin !== window.location.origin || !url.pathname.startsWith('/js/games/')) {
                throw new Error('Unexpected game module');
            }
            const game = await import(url.href);
            if (!root.isConnected) return;
            instance = game.mount(root);
            if (document.hidden) instance.pause();
        } catch {
            instance?.destroy();
            instance = null;
            failed = true;
            root.dataset.phase = 'error';
            const overlay = root.querySelector('[data-game-overlay]');
            overlay.hidden = false;
            overlay.textContent = en ? 'Game unavailable' : '暂时无法开始';
            root.querySelector('[data-game-pause]').hidden = true;
            root.querySelector('[data-game-restart]').hidden = true;
            button.hidden = false;
            button.disabled = false;
            button.textContent = en ? 'Reload page' : '重新加载页面';
            status.textContent = en ? 'The game could not load. Reload the page to try again.' : '游戏加载失败，请重新加载页面后再试。';
        } finally {
            loading = false;
            root.removeAttribute('aria-busy');
        }
    });
    window.addEventListener('pagehide', (event) => {
        instance?.pause();
        if (!event.persisted) instance?.destroy();
    });
}
