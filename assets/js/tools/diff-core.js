(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseDiff = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function normalizeLine(line, options) {
        let value = String(line);
        if (options.ignoreWhitespace) value = value.replace(/\s+/g, ' ').trim();
        if (options.ignoreCase) value = value.toLocaleLowerCase();
        return value;
    }

    function splitLines(value) {
        const text = String(value ?? '');
        return text === '' ? [] : text.replace(/\r\n?/g, '\n').split('\n');
    }

    function compare(leftInput, rightInput, options = {}) {
        const left = splitLines(leftInput);
        const right = splitLines(rightInput);
        if (left.length > 2500 || right.length > 2500) {
            throw new RangeError('Diff input is limited to 2500 lines per side');
        }
        const leftKeys = left.map((line) => normalizeLine(line, options));
        const rightKeys = right.map((line) => normalizeLine(line, options));
        const table = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

        for (let i = left.length - 1; i >= 0; i -= 1) {
            for (let j = right.length - 1; j >= 0; j -= 1) {
                table[i][j] = leftKeys[i] === rightKeys[j]
                    ? table[i + 1][j + 1] + 1
                    : Math.max(table[i + 1][j], table[i][j + 1]);
            }
        }

        const lines = [];
        let i = 0;
        let j = 0;
        while (i < left.length || j < right.length) {
            if (i < left.length && j < right.length && leftKeys[i] === rightKeys[j]) {
                lines.push({ type: 'equal', text: left[i], leftLine: i + 1, rightLine: j + 1 });
                i += 1;
                j += 1;
            } else if (j < right.length && (i === left.length || table[i][j + 1] >= table[i + 1][j])) {
                lines.push({ type: 'added', text: right[j], rightLine: j + 1 });
                j += 1;
            } else {
                lines.push({ type: 'removed', text: left[i], leftLine: i + 1 });
                i += 1;
            }
        }

        return {
            lines,
            added: lines.filter((line) => line.type === 'added').length,
            removed: lines.filter((line) => line.type === 'removed').length,
            unchanged: lines.filter((line) => line.type === 'equal').length
        };
    }

    return { compare, normalizeLine, splitLines };
});
