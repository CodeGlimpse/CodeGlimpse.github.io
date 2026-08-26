const test = require('node:test');
const assert = require('node:assert/strict');

const workspace = require('../assets/js/workspace.js');

test('stores and manages named presets in local storage', () => {
    const originalStorage = globalThis.localStorage;
    const values = new Map();
    globalThis.localStorage = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
    };

    try {
        assert.equal(workspace.savePreset('json-demo', { tool: 'json', fields: [{ id: 'json-input', value: '{}' }] }), true);
        assert.deepEqual(workspace.listPresets(), ['json-demo']);
        assert.deepEqual(workspace.loadPreset('json-demo'), { tool: 'json', fields: [{ id: 'json-input', value: '{}' }] });
        assert.equal(workspace.removePreset('json-demo'), true);
        assert.equal(workspace.loadPreset('json-demo'), null);
    } finally {
        globalThis.localStorage = originalStorage;
    }
});

test('rejects unnamed, invalid, and over-limit presets', () => {
    assert.equal(workspace.savePreset('', {}), false);
    assert.equal(workspace.savePreset('invalid', null), false);
});
