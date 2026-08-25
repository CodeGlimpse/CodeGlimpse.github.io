(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseJsonPath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function parsePath(path) {
        const input = String(path).trim();
        if (!input.startsWith('$')) throw new SyntaxError('JSONPath must start with $');
        const tokens = [];
        let index = 1;
        while (index < input.length) {
            if (input[index] === '.') {
                if (input[index + 1] === '.') throw new SyntaxError('Recursive descent is not supported');
                index += 1;
                const match = input.slice(index).match(/^([A-Za-z_$][\w$-]*|\*)/);
                if (!match) throw new SyntaxError('Invalid property near ' + input.slice(index));
                tokens.push(match[1]);
                index += match[1].length;
            } else if (input[index] === '[') {
                const end = input.indexOf(']', index);
                if (end < 0) throw new SyntaxError('Missing closing bracket');
                const content = input.slice(index + 1, end).trim();
                if (content === '*') tokens.push('*');
                else if (/^\d+$/.test(content)) tokens.push(Number(content));
                else if (/^(['"]).*\1$/.test(content)) tokens.push(content.slice(1, -1));
                else throw new SyntaxError('Invalid bracket expression: ' + content);
                index = end + 1;
            } else {
                throw new SyntaxError('Unexpected character: ' + input[index]);
            }
        }
        return tokens;
    }

    function query(input, path) {
        const value = typeof input === 'string' ? JSON.parse(input) : input;
        const tokens = parsePath(path);
        let nodes = [{ path: '$', value }];
        for (const token of tokens) {
            const next = [];
            for (const node of nodes) {
                if (token === '*') {
                    if (Array.isArray(node.value)) {
                        node.value.forEach((item, index) => next.push({ path: node.path + '[' + index + ']', value: item }));
                    } else if (node.value && typeof node.value === 'object') {
                        Object.entries(node.value).forEach(([key, item]) => next.push({ path: node.path + '.' + key, value: item }));
                    }
                } else if (node.value !== null && node.value !== undefined) {
                    const child = node.value[token];
                    if (child !== undefined) {
                        const pathPart = typeof token === 'number' ? '[' + token + ']' : '.' + token;
                        next.push({ path: node.path + pathPart, value: child });
                    }
                }
            }
            nodes = next;
        }
        return nodes;
    }

    return { parsePath, query };
});
