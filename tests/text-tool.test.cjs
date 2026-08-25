const test = require('node:test');
const assert = require('node:assert/strict');

const textTool = require('../assets/js/tools/text-core.js');

test('counts Unicode text, lines, words, and UTF-8 bytes', () => {
    assert.deepEqual(textTool.analyze('Hello world\n\u4f60\u597d', 'en'), {
        bytes: 18,
        characters: 14,
        charactersNoSpaces: 12,
        lines: 2,
        words: 3
    });
});

test('applies case and whitespace transformations', () => {
    assert.equal(textTool.transform('hELLO wORLD', 'title', 'en'), 'Hello World');
    assert.equal(textTool.transform('HELLO. wORLD!', 'sentence', 'en'), 'Hello. World!');
    assert.equal(textTool.transform('  one   two \n\n\n three  ', 'collapse-whitespace'), 'one two\n\nthree');
    assert.equal(textTool.transform('  one  \r\n two ', 'trim-lines'), 'one\ntwo');
});

test('rejects unknown transformation modes', () => {
    assert.throws(() => textTool.transform('value', 'unknown'), /Unsupported text transform/);
});

test('handles empty input and CRLF line boundaries', () => {
    assert.deepEqual(textTool.analyze('', 'en'), {
        bytes: 0,
        characters: 0,
        charactersNoSpaces: 0,
        lines: 0,
        words: 0
    });
    assert.equal(textTool.transform(' one\r\n two ', 'trim-lines'), 'one\ntwo');
});
