const test = require('node:test');
const assert = require('node:assert/strict');

const url = require('../assets/js/tools/url-core.js');

test('encodes and decodes Unicode URL components', () => {
    const encoded = url.encode('hello world/\u4f60\u597d?');
    assert.equal(encoded, 'hello%20world%2F%E4%BD%A0%E5%A5%BD%3F');
    assert.equal(url.decode(encoded), 'hello world/\u4f60\u597d?');
});

test('supports application/x-www-form-urlencoded spaces', () => {
    assert.equal(url.encode('a b+c', true), 'a+b%2Bc');
    assert.equal(url.decode('a+b%2Bc', true), 'a b+c');
});

test('rejects malformed percent escapes', () => {
    assert.throws(() => url.decode('%E0%A4%A'), URIError);
});

test('encodes reserved punctuation consistently', () => {
    assert.equal(url.encode("!'()*"), '%21%27%28%29%2A');
    assert.equal(url.decode('a+b', false), 'a+b');
});
