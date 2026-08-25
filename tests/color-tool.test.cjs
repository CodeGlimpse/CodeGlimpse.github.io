const test = require('node:test');
const assert = require('node:assert/strict');
const colorTool = require('../assets/js/tools/color-core.js');

test('converts colors between HEX, RGB, and HSL', () => {
    assert.deepEqual(colorTool.hexToRgb('#3b82f6'), { r: 59, g: 130, b: 246 });
    assert.equal(colorTool.rgbToHex(59, 130, 246), '#3B82F6');
    assert.deepEqual(colorTool.rgbToHsl(255, 0, 0), { h: 0, s: 100, l: 50 });
    assert.deepEqual(colorTool.hslToRgb(0, 100, 50), { r: 255, g: 0, b: 0 });
    assert.throws(() => colorTool.hexToRgb('#xyz'), SyntaxError);
});

test('supports shorthand colors and rejects non-integer RGB values', () => {
    assert.deepEqual(colorTool.hexToRgb('#0f8'), { r: 0, g: 255, b: 136 });
    assert.equal(colorTool.rgbToHex(-10, 260, 12), '#00FF0C');
    assert.throws(() => colorTool.rgbToHex(1.5, 2, 3), RangeError);
});
