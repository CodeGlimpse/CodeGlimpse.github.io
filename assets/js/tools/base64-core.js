(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseBase64 = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function encode(input) {
        const text = String(input);
        return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (match, hex) => (
            String.fromCharCode(`0x${hex}`)
        )));
    }

    function decode(input) {
        const text = String(input).trim();
        return decodeURIComponent(atob(text).split('').map((character) => (
            `%${(`00${character.charCodeAt(0).toString(16)}`).slice(-2)}`
        )).join(''));
    }

    return { decode, encode };
});
