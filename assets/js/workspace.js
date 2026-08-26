(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseWorkspace = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    const STORAGE_KEY = 'codeglimpse:presets:v1';
    const MAX_PRESETS = 20;

    function read() {
        try {
            const value = JSON.parse(root.localStorage?.getItem(STORAGE_KEY) || '{}');
            return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        } catch {
            return {};
        }
    }

    function write(value) {
        try {
            root.localStorage?.setItem(STORAGE_KEY, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    function listPresets() {
        return Object.keys(read()).sort();
    }

    function savePreset(name, state) {
        const key = String(name ?? '').trim();
        if (!key || !state || typeof state !== 'object' || Array.isArray(state)) return false;
        const presets = read();
        if (!Object.prototype.hasOwnProperty.call(presets, key) && Object.keys(presets).length >= MAX_PRESETS) return false;
        presets[key] = JSON.parse(JSON.stringify(state));
        return write(presets);
    }

    function loadPreset(name) {
        const value = read()[String(name ?? '').trim()];
        return value && typeof value === 'object' ? value : null;
    }

    function removePreset(name) {
        const key = String(name ?? '').trim();
        const presets = read();
        if (!Object.prototype.hasOwnProperty.call(presets, key)) return false;
        delete presets[key];
        return write(presets);
    }

    return { MAX_PRESETS, STORAGE_KEY, listPresets, loadPreset, removePreset, savePreset };
});
