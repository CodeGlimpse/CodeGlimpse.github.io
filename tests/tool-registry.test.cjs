const test = require('node:test');
const assert = require('node:assert/strict');

const { LANGUAGES, TOOL_IDS, TOOL_REGISTRY } = require('../scripts/tool-registry.cjs');

test('registers the supported bilingual tool set', () => {
    assert.deepEqual(LANGUAGES, ['zh-cn', 'en']);
    assert.deepEqual(TOOL_IDS, [
        'base64', 'binary', 'bmi', 'color', 'csv', 'html', 'json', 'jwt',
        'md5', 'password', 'regex', 'sha', 'text', 'time', 'url', 'uuid'
    ]);
    assert.equal(Object.keys(TOOL_REGISTRY).length, TOOL_IDS.length);
});

test('maps every tool to an implementation and required core module', () => {
    for (const [toolId, spec] of Object.entries(TOOL_REGISTRY)) {
        assert.match(spec.script, new RegExp(`^${toolId}\\.js$`));
        assert.equal(spec.core, toolId === 'json' ? null : `${toolId}-core.js`);
    }
});
