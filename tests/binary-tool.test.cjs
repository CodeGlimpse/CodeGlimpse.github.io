const test = require('node:test');
const assert = require('node:assert/strict');
const binaryTool = require('../assets/js/tools/binary-core.js');

test('converts binary values without losing large integer precision', () => {
    const result = binaryTool.convert('9007199254740993', 10, {
        binary: 2,
        octal: 8,
        decimal: 10,
        hexadecimal: 16,
        custom: 36
    });

    assert.deepEqual(result, {
        binary: '100000000000000000000000000000000000000000000000000001',
        octal: '400000000000000001',
        decimal: '9007199254740993',
        hexadecimal: '20000000000001',
        custom: '2GOSA7PA2GX'
    });
});

test('rejects binary input with invalid digits or trailing text', () => {
    assert.throws(() => binaryTool.parseInteger('102', 2), SyntaxError);
    assert.throws(() => binaryTool.parseInteger('123abc', 10), SyntaxError);
    assert.equal(binaryTool.parseInteger('-FF', 16), -255n);
});

test('enforces the supported base range and empty-value boundary', () => {
    assert.equal(binaryTool.parseBase(2), 2);
    assert.equal(binaryTool.parseBase(36), 36);
    assert.throws(() => binaryTool.parseBase(1), RangeError);
    assert.throws(() => binaryTool.parseBase(37), RangeError);
    assert.throws(() => binaryTool.parseInteger('   ', 10), SyntaxError);
});
