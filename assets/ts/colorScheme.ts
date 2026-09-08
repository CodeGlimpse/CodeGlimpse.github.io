type ColorScheme = 'light' | 'dark' | 'auto';

class StackColorScheme {
    private currentScheme: ColorScheme;
    private media = window.matchMedia('(prefers-color-scheme: dark)');
    private toggle: HTMLElement;

    constructor(toggle: HTMLElement) {
        this.toggle = toggle;
        const initial = document.documentElement.dataset.colorSchemePreference;
        this.currentScheme = initial === 'light' || initial === 'dark' ? initial : 'auto';
        this.media.addEventListener('change', () => this.apply());
        toggle?.addEventListener('click', () => {
            const next = document.documentElement.dataset.scheme === 'dark' ? 'light' : 'dark';
            this.currentScheme = next === (this.media.matches ? 'dark' : 'light') ? 'auto' : next;
            this.apply();
            try { localStorage.setItem('StackColorScheme', this.currentScheme); }
            catch { /* The choice still applies to this page without storage. */ }
        });
        this.apply();
        if (!document.body.style.transition) document.body.style.setProperty('transition', 'background-color .3s ease');
    }

    private apply(): void {
        const scheme = this.currentScheme === 'auto' ? (this.media.matches ? 'dark' : 'light') : this.currentScheme;
        document.documentElement.dataset.scheme = scheme;
        document.documentElement.dataset.colorSchemePreference = this.currentScheme;
        this.toggle?.setAttribute('aria-pressed', String(scheme === 'dark'));
        window.dispatchEvent(new CustomEvent('onColorSchemeChange', { detail: scheme }));
    }
}

export default StackColorScheme;
