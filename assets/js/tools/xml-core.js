(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseXml = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function tokens(input) {
        return String(input).replace(/>\s+</g, '><').match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]+>|[^<]+/g) ?? [];
    }

    function validateXml(input) {
        const stack = [];
        let roots = 0;
        for (const token of tokens(input)) {
            if (!token.trim() || token.startsWith('<!--') || token.startsWith('<![CDATA[')) continue;
            if (/^<\?[\s\S]*\?>$/.test(token) || /^<!DOCTYPE[\s\S]*>$/i.test(token)) continue;
            if (/^<\//.test(token)) {
                const name = token.match(/^<\s*\/\s*([A-Za-z_][\w:.-]*)\s*>$/)?.[1];
                if (!name || stack.pop() !== name) throw new SyntaxError('Mismatched closing tag: ' + (name || token));
            } else if (/^<[^!][\s\S]*>$/.test(token) && !/\/\s*>$/.test(token)) {
                const name = token.match(/^<\s*([A-Za-z_][\w:.-]*)\b/)?.[1];
                if (!name) throw new SyntaxError('Invalid tag: ' + token);
                if (stack.length === 0) roots += 1;
                stack.push(name);
            } else if (/^<[^!][\s\S]*\/\s*>$/.test(token)) {
                if (stack.length === 0) roots += 1;
            } else if (token.startsWith('<')) {
                throw new SyntaxError('Invalid XML token: ' + token);
            } else if (stack.length === 0 && token.trim()) {
                throw new SyntaxError('Text is not allowed outside the root element');
            }
        }
        if (stack.length) throw new SyntaxError('Unclosed tag: ' + stack[stack.length - 1]);
        if (roots !== 1) throw new SyntaxError('XML must contain exactly one root element');
        return true;
    }

    function formatXml(input, indent = 2) {
        const text = String(input).trim();
        validateXml(text);
        const padding = ' '.repeat(Number(indent) || 2);
        let depth = 0;
        return tokens(text).reduce((output, token) => {
            if (!token.trim()) return output;
            if (/^<\//.test(token)) depth = Math.max(0, depth - 1);
            const line = padding.repeat(depth) + token.trim();
            if (/^<[^!?/][\s\S]*>$/.test(token) && !/\/\s*>$/.test(token) && !/^<[^>]+>.*<\//.test(token)) depth += 1;
            return output ? output + '\n' + line : line;
        }, '');
    }

    function minifyXml(input) {
        const text = String(input).trim();
        validateXml(text);
        return text.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ');
    }

    return { formatXml, minifyXml, validateXml };
});
