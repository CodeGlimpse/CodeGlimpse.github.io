(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseUrl = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function encode(input, formMode = false) {
        const encoded = encodeURIComponent(String(input)).replace(/[!'()*]/g, (character) => (
            `%${character.charCodeAt(0).toString(16).toUpperCase()}`
        ));
        return formMode ? encoded.replace(/%20/g, '+') : encoded;
    }

    function decode(input, formMode = false) {
        const value = String(input);
        return decodeURIComponent(formMode ? value.replace(/\+/g, '%20') : value);
    }

    return { decode, encode };
});
