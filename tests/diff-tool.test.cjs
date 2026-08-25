const test = require('node:test');
const assert = require('node:assert/strict');
const diff = require('../assets/js/tools/diff-core.js');

test('compares added and removed lines', () => {
    const result = diff.compare('one\ntwo', 'one\nthree');
    assert.equal(result.added, 1);
    assert.equal(result.removed, 1);
    assert.deepEqual(result.lines.map((line) => line.type), ['equal', 'added', 'removed']);
});

test('can ignore whitespace and case', () => {
    const result = diff.compare('Hello   World', 'hello world', { ignoreWhitespace: true, ignoreCase: true });
    assert.equal(result.unchanged, 1);
    assert.equal(result.added, 0);
    assert.equal(result.removed, 0);
});

test('limits very large inputs', () => {
    assert.throws(() => diff.compare(Array(2501).fill('x').join('\n'), 'x'), RangeError);
});
