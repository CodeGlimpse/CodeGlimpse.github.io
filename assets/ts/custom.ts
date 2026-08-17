function syncThemeToggle() {
    const toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(document.documentElement.dataset.scheme === 'dark'));
}

function syncMenuToggle() {
    const toggle = document.getElementById('toggle-menu');
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(toggle.classList.contains('is-active')));
}

function setupSkipLink() {
    const skipLink = document.querySelector<HTMLAnchorElement>('.skip-link');
    const mainContent = document.getElementById('main-content');
    if (!skipLink || !mainContent) return;

    skipLink.addEventListener('click', () => {
        window.setTimeout(() => mainContent.focus(), 0);
    });
}

syncThemeToggle();
syncMenuToggle();
setupSkipLink();

const themeObserver = new MutationObserver(syncThemeToggle);
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-scheme'] });

const menuToggle = document.getElementById('toggle-menu');
if (menuToggle) {
    const menuObserver = new MutationObserver(syncMenuToggle);
    menuObserver.observe(menuToggle, { attributes: true, attributeFilter: ['class'] });
}
