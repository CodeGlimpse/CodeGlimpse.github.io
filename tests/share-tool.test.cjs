const test = require('node:test');
const assert = require('node:assert/strict');

const share = require('../assets/js/tools/share.js');

test('encodes and decodes Unicode share state using a URL-safe hash', () => {
    const state = {
        version: 1,
        tool: 'json',
        language: 'zh-cn',
        fields: [{ id: 'json-input', type: 'textarea', value: '{"名称":"工具"}' }]
    };
    const hash = share.buildShareHash(state);
    assert.match(hash, /^#cgshare=[A-Za-z0-9_-]+$/);
    assert.deepEqual(share.parseShareHash(hash), state);
});

test('rejects malformed or oversized share state', () => {
    assert.equal(share.parseShareHash('#other=value'), null);
    assert.throws(() => share.parseShareHash('#cgshare=not-valid%%%'), /Invalid|Unexpected/);
    assert.throws(() => share.buildShareHash({
        version: 1,
        tool: 'text',
        fields: [{ id: 'text-input', value: 'x'.repeat(20000) }]
    }), /too large/i);
});
