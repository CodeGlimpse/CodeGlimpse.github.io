document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('[data-tool-focus-toggle]');
    if (!button) return;
    const en = document.documentElement.lang === 'en';
    function setFocus(enabled) {
        document.body.classList.toggle('tool-focus-mode', enabled);
        button.setAttribute('aria-pressed', String(enabled));
        button.textContent = enabled ? (en ? 'Exit focus mode' : '退出专注') : (en ? 'Focus mode' : '专注模式');
    }
    button.addEventListener('click', () => setFocus(button.getAttribute('aria-pressed') !== 'true'));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !event.isComposing && !event.defaultPrevented && button.getAttribute('aria-pressed') === 'true') {
            event.preventDefault();
            setFocus(false);
            button.focus();
        }
    });
    button.hidden = false;
});
