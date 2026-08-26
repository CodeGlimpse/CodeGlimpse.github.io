const test = require('node:test');
const assert = require('node:assert/strict');

const { contrastRatio, extractStyleColors, parseHexColor } = require('../scripts/check-contrast.cjs');

test('parses three and six digit hex colors', () => {
    assert.deepEqual(parseHexColor('#fff'), [1, 1, 1]);
    assert.deepEqual(parseHexColor('#217a70'), [33 / 255, 122 / 255, 112 / 255]);
    assert.equal(parseHexColor('#abcd'), null);
});

test('calculates WCAG contrast ratio', () => {
    assert.equal(contrastRatio(parseHexColor('#fff'), parseHexColor('#217a70')) >= 4.5, true);
    assert.equal(contrastRatio(parseHexColor('#fff'), parseHexColor('#2a9d8f')) < 4.5, true);
});

test('extracts category badge colors from front matter', () => {
    assert.deepEqual(extractStyleColors('style:\n  background: "#217a70"\n  color: "#fff"'), {
        background: '#217a70',
        color: '#fff',
    });
});
