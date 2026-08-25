(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseSql = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const CLAUSE_KEYWORDS = new Set(['SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'VALUES', 'SET', 'UNION', 'RETURNING']);
    const LOGICAL_KEYWORDS = new Set(['AND', 'OR']);
    const JOIN_KEYWORDS = new Set(['JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS']);
    const SQL_KEYWORDS = new Set([...CLAUSE_KEYWORDS, ...LOGICAL_KEYWORDS, ...JOIN_KEYWORDS, 'BY', 'AS', 'ON', 'IN', 'IS', 'NOT', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ASC', 'DESC']);

    function tokenize(input) {
        return String(input).match(/'(?:''|[^'])*'|"(?:[^"]|"")*"|--[^\n]*|\/\*[\s\S]*?\*\/|[A-Za-z_][\w$]*|\d+(?:\.\d+)?|<=|>=|<>|!=|:=|[(),.;=*+/%<>-]/g) ?? [];
    }

    function formatSql(input, options = {}) {
        const tokens = tokenize(input);
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
                current = current.trimEnd() + ' (';
                depth += 1;
            } else if (token === ')') {
                current = current.trimEnd();
                flush();
                depth = Math.max(0, depth - 1);
                current = ')';
            } else if (token === ',') {
                current = current.trimEnd() + ',';
            } else if (token === ';') {
                current = current.trimEnd() + ';';
                flush();
            } else if (CLAUSE_KEYWORDS.has(upper) && index > 0) {
                flush();
                current = token;
            } else if (LOGICAL_KEYWORDS.has(upper) || JOIN_KEYWORDS.has(upper)) {
                flush();
                current = token;
            } else {
                current += (current && !current.endsWith('(') ? ' ' : '') + token;
            }
        });
        flush();
        return lines.join('\n').replace(/\n{3,}/g, '\n\n');
    }

    function minifySql(input) {
        return tokenize(input).join(' ').replace(/\s+([(),.;])/g, '$1').trim();
    }

    return { formatSql, minifySql, tokenize };
});
