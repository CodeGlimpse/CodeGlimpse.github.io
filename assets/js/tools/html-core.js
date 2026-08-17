(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseHtml = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const ENCODED = Object.freeze({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    });

    const NAMED = Object.freeze({
        amp: '&', apos: "'", bull: '\u2022', cent: '\u00A2', copy: '\u00A9', euro: '\u20AC',
        gt: '>', hellip: '\u2026', laquo: '\u00AB', ldquo: '\u201C', lsquo: '\u2018', lt: '<',
        mdash: '\u2014', middot: '\u00B7', nbsp: '\u00A0', ndash: '\u2013', para: '\u00B6',
        pound: '\u00A3', quot: '"', raquo: '\u00BB', rdquo: '\u201D', reg: '\u00AE',
        rsquo: '\u2019', sect: '\u00A7', trade: '\u2122', yen: '\u00A5'
    });

    function encode(input, encodeNonAscii = false) {
        return Array.from(String(input), (character) => {
            if (ENCODED[character]) return ENCODED[character];
            const codePoint = character.codePointAt(0);
            return encodeNonAscii && codePoint > 0x7f
                ? `&#x${codePoint.toString(16).toUpperCase()};`
                : character;
        }).join('');
    }

    function decodeNumeric(entity) {
        const hexadecimal = entity[1].toLowerCase() === 'x';
        const value = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
        if (!Number.isInteger(value) || value === 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
            return '\uFFFD';
        }
        return String.fromCodePoint(value);
    }

    function decode(input) {
        return String(input).replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (match, entity) => {
            if (entity.startsWith('#')) return decodeNumeric(entity);
            return NAMED[entity.toLowerCase()] ?? match;
        });
    }

    return { NAMED, decode, encode };
});
