(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseYaml = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function stripComment(line) {
        let quote = '';
        for (let index = 0; index < line.length; index += 1) {
            const character = line[index];
            if ((character === '"' || character === "'") && line[index - 1] !== '\\') {
                quote = quote === character ? '' : (quote || character);
            }
            if (character === '#' && !quote && (index === 0 || /\s/.test(line[index - 1]))) return line.slice(0, index).trimEnd();
        }
        return line;
    }

    function scalar(value) {
        const text = value.trim();
        if (text === '') return null;
        if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) return text.slice(1, -1);
        if (/^(true|false)$/i.test(text)) return text.toLowerCase() === 'true';
        if (/^(null|~)$/i.test(text)) return null;
        if (/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return Number(text);
        if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
            try { return JSON.parse(text); } catch { /* fall through to string */ }
        }
        return text;
    }

    function parseYaml(input) {
        const source = String(input ?? '').replace(/\t/g, '  ');
        const lines = source.split(/\r?\n/).map((raw, lineNumber) => {
            const value = stripComment(raw);
            return { text: value, indent: value.search(/\S|$/), lineNumber };
        }).filter((line) => line.text.trim());
        if (!lines.length) return null;

        function parseBlock(start, indent) {
            const isArray = lines[start].indent === indent && lines[start].text.trim().startsWith('-');
            const result = isArray ? [] : {};
            let index = start;
            while (index < lines.length && lines[index].indent === indent) {
                const line = lines[index].text.trim();
                if (isArray) {
                    if (!line.startsWith('-')) throw new SyntaxError('Mixed YAML collection at line ' + (lines[index].lineNumber + 1));
                    const itemText = line.slice(1).trim();
                    if (!itemText) {
                        if (index + 1 >= lines.length || lines[index + 1].indent <= indent) throw new SyntaxError('Empty list item at line ' + (lines[index].lineNumber + 1));
                        const child = parseBlock(index + 1, lines[index + 1].indent);
                        result.push(child.value);
                        index = child.index;
                        continue;
                    }
                    const pair = itemText.match(/^([^:]+):(?:\s*(.*))?$/);
                    if (pair) {
                        const object = {};
                        const key = pair[1].trim();
                        object[key] = pair[2] ? scalar(pair[2]) : null;
                        index += 1;
                        if (index < lines.length && lines[index].indent > indent) {
                            const child = parseBlock(index, lines[index].indent);
                            if (object[key] === null && typeof child.value === 'object' && !Array.isArray(child.value)) Object.assign(object, child.value);
                            else object[key] = child.value;
                            index = child.index;
                        }
                        result.push(object);
                        continue;
                    }
                    result.push(scalar(itemText));
                    index += 1;
                } else {
                    if (line.startsWith('-')) throw new SyntaxError('List item is not valid in a mapping at line ' + (lines[index].lineNumber + 1));
                    const pair = line.match(/^([^:]+):(.*)$/);
                    if (!pair) throw new SyntaxError('Expected key/value at line ' + (lines[index].lineNumber + 1));
                    const key = pair[1].trim();
                    const rawValue = pair[2].trim();
                    index += 1;
                    if (rawValue) result[key] = scalar(rawValue);
                    else if (index < lines.length && lines[index].indent > indent) {
                        const child = parseBlock(index, lines[index].indent);
                        result[key] = child.value;
                        index = child.index;
                    } else result[key] = null;
                }
            }
            return { value: result, index };
        }

        const parsed = parseBlock(0, lines[0].indent);
        if (parsed.index !== lines.length) throw new SyntaxError('Invalid indentation at line ' + (lines[parsed.index].lineNumber + 1));
        return parsed.value;
    }

    function quoteString(value) {
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (value === null || value === undefined) return 'null';
        const text = String(value);
        return text === '' || /[:#[\]{}\n]/.test(text) || /^(true|false|null|~|-?\d+(?:\.\d+)?)$/i.test(text)
            ? JSON.stringify(text)
            : text;
    }

    function stringifyYaml(value, indent = 2) {
        const padding = ' '.repeat(Number(indent) || 2);
        function render(node, depth) {
            const prefix = padding.repeat(depth);
            if (Array.isArray(node)) {
                if (!node.length) return '[]';
                return node.map((item) => {
                    if (item && typeof item === 'object') {
                        const nested = render(item, depth + 1).split('\n');
                        return prefix + '- ' + nested[0].trimStart() + (nested.length > 1 ? '\n' + nested.slice(1).join('\n') : '');
                    }
                    return prefix + '- ' + quoteString(item ?? '');
                }).join('\n');
            }
            if (node && typeof node === 'object') {
                const entries = Object.entries(node);
                if (!entries.length) return '{}';
                return entries.map(([key, item]) => {
                    if (item && typeof item === 'object') return prefix + key + ':\n' + render(item, depth + 1);
                    return prefix + key + ': ' + quoteString(item ?? '');
                }).join('\n');
            }
            return prefix + quoteString(node ?? '');
        }
        return render(value, 0);
    }

    function yamlToJson(input) {
        return parseYaml(input);
    }

    function jsonToYaml(input, indent = 2) {
        const value = typeof input === 'string' ? JSON.parse(input) : input;
        return stringifyYaml(value, indent);
    }

    return { jsonToYaml, parseYaml, stringifyYaml, yamlToJson };
});
