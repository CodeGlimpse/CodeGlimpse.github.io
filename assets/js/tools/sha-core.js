(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) root.CodeGlimpseSha = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    function getSubtleCrypto() {
        if (root?.crypto?.subtle) return root.crypto.subtle;
        throw new Error('Web Crypto API is unavailable');
    }

    async function digest(value, algorithm) {
        const input = new TextEncoder().encode(String(value));
        const buffer = await getSubtleCrypto().digest(algorithm, input);
        return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
    }

    return { digest };
});
