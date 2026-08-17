(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseRegex = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const FLAG_ORDER = 'gimsuy';
    const MAX_INPUT_LENGTH = 100000;
    const MAX_MATCHES = 500;
    const MAX_PATTERN_LENGTH = 500;
    const MAX_REPLACEMENT_LENGTH = 10000;

    function normalizeFlags(flags) {
        const value = String(flags ?? '');
        const seen = new Set();
        for (const flag of value) {
            if (!FLAG_ORDER.includes(flag)) throw new SyntaxError(`Unsupported regular expression flag: ${flag}`);
            if (seen.has(flag)) throw new SyntaxError(`Duplicate regular expression flag: ${flag}`);
            seen.add(flag);
        }
        return Array.from(FLAG_ORDER).filter((flag) => seen.has(flag)).join('');
    }

    function validateLength(value, maximum, label) {
        if (value.length > maximum) throw new RangeError(`${label} exceeds ${maximum} characters`);
    }

    function advanceStringIndex(text, index, unicode) {
        if (!unicode || index + 1 >= text.length) return index + 1;
        const first = text.charCodeAt(index);
        if (first < 0xd800 || first > 0xdbff) return index + 1;
        const second = text.charCodeAt(index + 1);
        return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
    }

    function execute(pattern, flags, input, replacement = '') {
        const source = String(pattern);
        const text = String(input);
        const replacementText = String(replacement);
        validateLength(source, MAX_PATTERN_LENGTH, 'Pattern');
        validateLength(text, MAX_INPUT_LENGTH, 'Input');
        validateLength(replacementText, MAX_REPLACEMENT_LENGTH, 'Replacement');

        const normalizedFlags = normalizeFlags(flags);
        const expression = new RegExp(source, normalizedFlags);
        const matches = [];
        let match;
        let truncated = false;

        while ((match = expression.exec(text)) !== null) {
            if (matches.length >= MAX_MATCHES) {
                truncated = true;
                break;
            }
            matches.push({
                captures: match.slice(1).map((capture) => capture ?? null),
                groups: match.groups ?? null,
                index: match.index,
                match: match[0]
            });

            if (!normalizedFlags.includes('g') && !normalizedFlags.includes('y')) break;
            if (match[0] === '') {
                expression.lastIndex = advanceStringIndex(text, expression.lastIndex, normalizedFlags.includes('u'));
            }
        }

        expression.lastIndex = 0;
        return {
            flags: normalizedFlags,
            matches,
            replacement: text.replace(expression, replacementText),
            truncated
        };
    }

    return {
        FLAG_ORDER,
        MAX_INPUT_LENGTH,
        MAX_MATCHES,
        MAX_PATTERN_LENGTH,
        advanceStringIndex,
        execute,
        normalizeFlags
    };
});
