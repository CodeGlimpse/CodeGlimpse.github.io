(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseSql = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const CLAUSE_KEYWORDS = new Set(['SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'VALUES', 'SET', 'UNION', 'RETURNING']);
    const LOGICAL_KEYWORDS = new Set(['AND', 'OR']);
    const JOIN_KEYWORDS = new Set(['JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS']);
    const SQL_KEYWORDS = new Set([...CLAUSE_KEYWORDS, ...LOGICAL_KEYWORDS, ...JOIN_KEYWORDS, 'BY', 'AS', 'ON', 'IN', 'IS', 'NOT', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ASC', 'DESC']);

    function scanSql(input) {
        const source = String(input ?? '');
        const tokens = [];
        let index = 0;
        function push(end, type) {
            tokens.push({ value: source.slice(index, end), type, start: index, end });
            index = end;
        }
        function quotedEnd(quoteIndex) {
            const opening = source[quoteIndex];
            const closing = opening === '[' ? ']' : opening;
            let cursor = quoteIndex + 1;
            while (cursor < source.length) {
                if (source[cursor] === closing) {
                    if (source[cursor + 1] === closing) cursor += 2;
                    else return cursor + 1;
                } else if (source[cursor] === '\\' && opening !== '[') {
                    cursor += 2;
                } else cursor += 1;
            }
            throw new SyntaxError('Unclosed SQL quote at position ' + (index + 1));
        }
        while (index < source.length) {
            const remaining = source.slice(index);
            const character = source[index];
            if (/\s/u.test(character)) {
                index += 1;
                continue;
            }
            if (remaining.startsWith('--')) {
                const newline = remaining.search(/[\r\n]/);
                push(newline < 0 ? source.length : index + newline, 'line-comment');
                continue;
            }
            if (remaining.startsWith('/*')) {
                let cursor = index + 2;
                let depth = 1;
                while (cursor < source.length && depth > 0) {
                    if (source.startsWith('/*', cursor)) { depth += 1; cursor += 2; }
                    else if (source.startsWith('*/', cursor)) { depth -= 1; cursor += 2; }
                    else cursor += 1;
                }
                if (depth) throw new SyntaxError('Unclosed SQL comment at position ' + (index + 1));
                push(cursor, 'block-comment');
                continue;
            }
            const dollarQuote = remaining.match(/^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/)?.[0];
            if (dollarQuote) {
                const end = source.indexOf(dollarQuote, index + dollarQuote.length);
                if (end < 0) throw new SyntaxError('Unclosed SQL dollar quote at position ' + (index + 1));
                push(end + dollarQuote.length, 'quoted');
                continue;
            }
            const literalPrefix = remaining.match(/^(?:[nNeEbBxX]'|[uU]&['"])/)?.[0];
            if (literalPrefix) {
                push(quotedEnd(index + literalPrefix.length - 1), 'quoted');
                continue;
            }
            if (character === "'" || character === '"' || character === '[' || character.charCodeAt(0) === 96) {
                push(quotedEnd(index), 'quoted');
                continue;
            }
            const parameter = remaining.match(/^(?:[:@$][\p{L}_][\p{L}\p{N}_$]*|\$\d+|\?\d+)/u)?.[0];
            if (parameter) {
                push(index + parameter.length, 'parameter');
                continue;
            }
            const number = remaining.match(/^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/)?.[0];
            if (number) {
                push(index + number.length, 'number');
                continue;
            }
            const word = remaining.match(/^[\p{L}_][\p{L}\p{N}_$]*/u)?.[0];
            if (word) {
                push(index + word.length, 'word');
                continue;
            }
            if ('(),.;'.includes(character)) {
                push(index + 1, 'punctuation');
                continue;
            }
            let operator = remaining.match(/^[~!@#%^&|?:*/<>=+-]+/)?.[0];
            if (operator) {
                const commentStart = operator.search(/\/\*|--/);
                if (commentStart > 0) operator = operator.slice(0, commentStart);
                push(index + operator.length, 'operator');
                continue;
            }
            throw new SyntaxError('Unsupported SQL character at position ' + (index + 1));
        }
        return tokens;
    }

    function tokenize(input) {
        return scanSql(input).map((token) => token.value);
    }

    function formatSql(input, options = {}) {
        const scanned = scanSql(input);
        const tokens = scanned.map((token) => token.value);
        if (!tokens.length) return '';
        const keywordCase = options.keywordCase === 'lower' ? 'lower' : 'upper';
        const formatKeyword = (token) => /^[A-Za-z_]/.test(token) && SQL_KEYWORDS.has(token.toUpperCase())
            ? (keywordCase === 'upper' ? token.toUpperCase() : token.toLowerCase())
            : token;
        const lines = [];
        let current = '';
        let depth = 0;
        const indent = () => ' '.repeat((options.indent ?? 2) * depth);
        const flush = () => {
            if (current.trim()) lines.push(indent() + current.trim());
            current = '';
        };

        tokens.forEach((raw, index) => {
            const token = formatKeyword(raw);
            const upper = raw.toUpperCase();
            if (raw.startsWith('--') || raw.startsWith('/*')) {
                flush();
                lines.push(indent() + raw);
                return;
            }
            if (token === '(') {
                const adjacent = index > 0 && scanned[index - 1].end === scanned[index].start;
                current = current.trimEnd() + (current && !adjacent ? ' ' : '') + '(';
                depth += 1;
            } else if (token === ')') {
                current = current.trimEnd();
                flush();
                depth = Math.max(0, depth - 1);
                current = ')';
            } else if (token === ',') {
                current = current.trimEnd() + ',';
            } else if (token === '.') {
                current = current.trimEnd() + '.';
            } else if (token === ';') {
                current = current.trimEnd() + ';';
                flush();
            } else if (CLAUSE_KEYWORDS.has(upper) && index > 0 && tokens[index - 1] !== '.') {
                flush();
                current = token;
            } else if ((LOGICAL_KEYWORDS.has(upper) || JOIN_KEYWORDS.has(upper)) && tokens[index - 1] !== '.') {
                flush();
                current = token;
            } else {
                current += (current && !current.endsWith('(') && !current.endsWith('.') ? ' ' : '') + token;
            }
        });
        flush();
        return lines.join('\n');
    }

    function minifySql(input) {
        const tokens = scanSql(input);
        let output = '';
        tokens.forEach((token, index) => {
            const previous = tokens[index - 1];
            let separator = previous ? ' ' : '';
            if (previous?.type === 'line-comment') separator = '\n';
            else if (['(', ')', ',', '.', ';'].includes(token.value) || ['(', '.'].includes(previous?.value)) separator = '';
            output += separator + token.value;
        });
        return output;
    }

    return { formatSql, minifySql, tokenize };
});
