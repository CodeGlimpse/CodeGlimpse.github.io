const test = require('node:test');
const assert = require('node:assert/strict');

const base64Tool = require('../assets/js/tools/base64-core.js');

test('encodes and decodes Unicode text', () => {
    const input = '你好, Web';
    const encoded = base64Tool.encode(input);

    assert.equal(encoded, '5L2g5aW9LCBXZWI=');
    assert.equal(base64Tool.decode(encoded), input);
});

test('rejects invalid Base64 input', () => {
    assert.throws(() => base64Tool.decode('not base64!'));
});

test('handles empty input and rejects malformed padding', () => {
    assert.equal(base64Tool.encode(''), '');
    assert.equal(base64Tool.decode(''), '');
    assert.throws(() => base64Tool.decode('A==='));
});
