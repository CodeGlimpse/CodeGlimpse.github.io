(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseToolUi = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    function setStatus(element, type, message) {
        if (!element) return;
        element.className = `tool-status ${type || ''}`.trim();
        element.textContent = message || '';
    }

    function setOutputState(container, state) {
        if (container) container.dataset.outputState = state;
    }

    async function copy({ button, value, status, messages, restoreDelay = 1800 }) {
        if (!String(value ?? '').trim()) {
            setStatus(status, 'error', messages.empty);
            return false;
        }

        const originalText = button?.textContent || '';
        if (button) button.disabled = true;

        try {
            const copied = await root.CodeGlimpseClipboard.copy(value);
            if (!copied) throw new Error('copy failed');

            setStatus(status, 'success', messages.copied);
            if (button) {
                button.textContent = messages.copied;
                root.setTimeout(() => { button.textContent = originalText; }, restoreDelay);
            }
            return true;
        } catch (error) {
            setStatus(status, 'error', messages.copyFailed);
            return false;
        } finally {
            if (button) button.disabled = false;
        }
    }

    function bindShortcut(element, callback) {
        element?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                callback();
            }
        });
    }

    function download(filename, value, type = 'text/plain;charset=utf-8') {
        const blob = new Blob([String(value ?? '')], { type });
        const url = root.URL.createObjectURL(blob);
        const anchor = root.document?.createElement('a');
        if (!anchor) return false;
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        root.setTimeout(() => root.URL.revokeObjectURL(url), 0);
        return true;
    }

    function readPreferences(key, fallback = {}) {
        try {
            const value = JSON.parse(root.localStorage?.getItem(key) || 'null');
            return value && typeof value === 'object' ? value : fallback;
        } catch {
            return fallback;
        }
    }

    function writePreferences(key, value) {
        try {
            root.localStorage?.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    return { bindShortcut, copy, download, readPreferences, setOutputState, setStatus, writePreferences };
});
