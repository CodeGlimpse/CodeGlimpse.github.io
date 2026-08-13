(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseBinary = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function parseBase(value) {
        const base = Number(String(value).trim());
        if (!Number.isInteger(base) || base < 2 || base > 36) {
            throw new RangeError('Base must be an integer between 2 and 36');
        }
        return base;
    }

    function parseInteger(value, base) {
        const normalizedBase = parseBase(base);
        const text = String(value).trim();
        if (!text) throw new SyntaxError('Input is empty');

        const match = text.match(/^([+-]?)([0-9a-z]+)$/i);
        if (!match) throw new SyntaxError('Input must be a signed integer');

        const sign = match[1] === '-' ? -1n : 1n;
        const digits = match[2].toUpperCase();
        const maxDigit = normalizedBase - 1;
        for (const digit of digits) {
            if (DIGITS.indexOf(digit) > maxDigit) {
                throw new SyntaxError('Input contains a digit outside the selected base');
            }
        }

        let result = 0n;
        const radix = BigInt(normalizedBase);
        for (const digit of digits) {
            result = result * radix + BigInt(DIGITS.indexOf(digit));
        }
        return sign * result;
    }

    function formatInteger(value, base) {
        const normalizedBase = parseBase(base);
        return BigInt(value).toString(normalizedBase).toUpperCase();
    }

    function convert(value, sourceBase, targetBases) {
        const decimalValue = parseInteger(value, sourceBase);
        return Object.fromEntries(Object.entries(targetBases).map(([name, base]) => [
            name,
            formatInteger(decimalValue, base)
        ]));
    }

    return { convert, formatInteger, parseBase, parseInteger };
});
