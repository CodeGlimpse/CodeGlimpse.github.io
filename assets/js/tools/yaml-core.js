(function (root, factory) {
    const api = factory(require('yaml'));
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseYaml = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (yaml) {
    // yaml is bundled locally by Hugo. License text is published at /licenses.txt.
    function jsonValue(value, ancestors = new Set()) {
        if (typeof value === 'bigint') {
            if (value < BigInt(Number.MIN_SAFE_INTEGER) || value > BigInt(Number.MAX_SAFE_INTEGER)) {
                throw new SyntaxError('Integer exceeds the safe JSON number range; quote it as a string');
            }
            return Number(value);
        }
        if (typeof value === 'number') {
            if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))) {
                throw new SyntaxError('Number cannot be represented safely in JSON; quote it as a string');
            }
            return value;
        }
        if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
        if (!value || typeof value !== 'object') throw new SyntaxError('Only JSON-compatible values are supported');
        if (ancestors.has(value)) throw new SyntaxError('Circular values are not supported');
        ancestors.add(value);
        let result;
        if (Array.isArray(value)) result = value.map((item) => jsonValue(item, ancestors));
        else {
            if (![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
                throw new SyntaxError('Only JSON-compatible objects are supported');
            }
            result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonValue(item, ancestors)]));
        }
        ancestors.delete(value);
        return result;
    }

    function parseYaml(input) {
        try {
            const document = yaml.parseDocument(String(input ?? ''), {
                version: '1.2', schema: 'core', strict: true, uniqueKeys: true,
                stringKeys: true, intAsBigInt: true, resolveKnownTags: false,
            });
            const issue = document.errors[0] || document.warnings[0];
            if (issue) throw issue;
            if (document.directives?.yaml.version !== '1.2') {
                throw new SyntaxError('Only YAML 1.2 is supported');
            }
            yaml.visit(document, {
                Node(_key, node) {
                    if (yaml.isAlias(node) || node.anchor || node.tag) {
                        throw new SyntaxError('YAML anchors, aliases, and explicit tags are not supported');
                    }
                },
            });
            return jsonValue(document.toJS({ maxAliasCount: 0 }));
        } catch (error) {
            throw new SyntaxError(error.message);
        }
    }

    function stringifyYaml(value, indent = 2) {
        const width = Number(indent);
        if (!Number.isInteger(width) || width < 1 || width > 8) {
            throw new RangeError('YAML indentation must be between 1 and 8 spaces');
        }
        return yaml.stringify(jsonValue(value), {
            version: '1.2', schema: 'core', indent: width,
            aliasDuplicateObjects: false, lineWidth: 0,
        });
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
