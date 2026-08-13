(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseClipboard = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    function fallbackCopy(text) {
        if (!root.document || !root.document.body) return false;
        const textarea = root.document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        root.document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        let copied = false;
        try {
            copied = Boolean(root.document.execCommand('copy'));
        } finally {
            textarea.remove();
        }
        return copied;
    }

    async function copy(text) {
        const value = String(text ?? '');
        if (!value) return false;

        if (root.navigator?.clipboard?.writeText && root.isSecureContext) {
            try {
                await root.navigator.clipboard.writeText(value);
                return true;
            } catch (error) {
                // Fall back to the legacy API when permission or browser policy
                // prevents the modern Clipboard API from completing.
            }
        }
        return fallbackCopy(value);
    }

    return { copy, fallbackCopy };
});
