const test = require('node:test');
const assert = require('node:assert/strict');

const regex = require('../assets/js/tools/regex-core.js');

test('finds global matches with captures and replacement output', () => {
    const result = regex.execute('(\\w+)=(\\d+)', 'gi', 'a=1 B=22', '$1:[$2]');
    assert.deepEqual(result.matches, [
        { captures: ['a', '1'], groups: null, index: 0, match: 'a=1' },
        { captures: ['B', '22'], groups: null, index: 4, match: 'B=22' }
    ]);
    assert.equal(result.replacement, 'a:[1] B:[22]');
    assert.equal(result.truncated, false);
});

test('handles zero-length matches without looping forever', () => {
    const result = regex.execute('(?=a)', 'g', 'aa');
    assert.deepEqual(result.matches.map((match) => match.index), [0, 1]);

    const unicode = regex.execute('(?=.)', 'gu', '\ud83d\ude00');
    assert.deepEqual(unicode.matches.map((match) => match.index), [0]);
});

test('normalizes flags and rejects unsafe input sizes', () => {
    assert.equal(regex.normalizeFlags('mig'), 'gim');
    assert.throws(() => regex.normalizeFlags('gg'), /Duplicate/);
    assert.throws(() => regex.normalizeFlags('v'), /Unsupported/);
    assert.throws(() => regex.execute('x'.repeat(501), '', ''), /Pattern exceeds/);
});

test('caps large match output and rejects oversized input', () => {
    const result = regex.execute('a', 'g', 'a'.repeat(regex.MAX_MATCHES + 1));
    assert.equal(result.matches.length, regex.MAX_MATCHES);
    assert.equal(result.truncated, true);
    assert.throws(() => regex.execute('a', '', 'a'.repeat(regex.MAX_INPUT_LENGTH + 1)), /Input exceeds/);
});
