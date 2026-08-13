const test = require('node:test');
const assert = require('node:assert/strict');
globalThis.crypto = require('node:crypto').webcrypto;
const jsonTool = require('../assets/js/tools/json.js');
const binaryTool = require('../assets/js/tools/binary-core.js');
const bmiTool = require('../assets/js/tools/bmi-core.js');
const colorTool = require('../assets/js/tools/color-core.js');
const md5Tool = require('../assets/js/tools/md5-core.js');
const shaTool = require('../assets/js/tools/sha-core.js');
const timeTool = require('../assets/js/tools/time-core.js');

test('formats JSON with the selected indentation', () => {
    const input = '{"name":"Fernweh","items":[1,true,null]}';
    const expected = '{\n  "name": "Fernweh",\n  "items": [\n    1,\n    true,\n    null\n  ]\n}';

    assert.equal(jsonTool.formatJson(input, '2'), expected);
    assert.equal(jsonTool.formatJson(input, 'tab').split('\n')[1], '\t"name": "Fernweh",');
});

test('minifies valid JSON', () => {
    assert.equal(jsonTool.minifyJson('{ "enabled": true, "count": 2 }'), '{"enabled":true,"count":2}');
});

test('validates valid and invalid JSON', () => {
    assert.equal(jsonTool.validateJson('{"valid":true}'), true);
    assert.throws(() => jsonTool.validateJson('{"valid":}'), SyntaxError);
});

test('escapes and unescapes JSON text, including Unicode and control characters', () => {
    const input = '{"message":"你好\\n世界","quote":"她说\\\"你好\\\""}';
    const escaped = jsonTool.escapeJsonText(input);

    assert.equal(escaped, '{\\"message\\":\\"你好\\\\n世界\\",\\"quote\\":\\"她说\\\\\\"你好\\\\\\"\\"}');
    assert.equal(jsonTool.unescapeJsonText(escaped), input);
});

test('unescapes a complete JSON string literal', () => {
    assert.equal(jsonTool.unescapeJsonText('"{\\"ok\\":true}"'), '{"ok":true}');
});

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

test('parses seconds, milliseconds, negative timestamps, and rejects trailing text', () => {
    assert.equal(timeTool.parseTimestamp('0').milliseconds, 0);
    assert.equal(timeTool.parseTimestamp('1700000000').milliseconds, 1700000000000);
    assert.equal(timeTool.parseTimestamp('1700000000000').milliseconds, 1700000000000);
    assert.equal(timeTool.parseTimestamp('-1').milliseconds, -1000);
    assert.throws(() => timeTool.parseTimestamp('123abc'), SyntaxError);
});

test('converts date time using an explicit timezone and validates calendar dates', () => {
    assert.equal(timeTool.dateTimeToTimestamp('1970-01-01 08:00:00', 'Asia/Shanghai'), 0);
    assert.equal(timeTool.formatDate(new Date(0), 'UTC'), '1970-01-01 00:00:00');
    assert.throws(() => timeTool.parseDateTime('2024-02-30 12:00:00'), RangeError);
});

test('falls back to a usable timezone list when supportedValuesOf is unavailable', () => {
    const original = Intl.supportedValuesOf;
    try {
        Intl.supportedValuesOf = undefined;
        assert.ok(timeTool.getTimezones().includes('UTC'));
    } finally {
        Intl.supportedValuesOf = original;
    }
});

test('calculates BMI and rejects invalid measurements', () => {
    assert.equal(bmiTool.calculate('175', '70').toFixed(1), '22.9');
    assert.throws(() => bmiTool.calculate('', '70'), RangeError);
    assert.throws(() => bmiTool.calculate('175', '-1'), RangeError);
});

test('converts colors between HEX, RGB, and HSL', () => {
    assert.deepEqual(colorTool.hexToRgb('#3b82f6'), { r: 59, g: 130, b: 246 });
    assert.equal(colorTool.rgbToHex(59, 130, 246), '#3B82F6');
    assert.deepEqual(colorTool.rgbToHsl(255, 0, 0), { h: 0, s: 100, l: 50 });
    assert.deepEqual(colorTool.hslToRgb(0, 100, 50), { r: 255, g: 0, b: 0 });
    assert.throws(() => colorTool.hexToRgb('#xyz'), SyntaxError);
});

test('generates the standard MD5 digest for UTF-8 text', () => {
    assert.equal(md5Tool.hash(''), 'd41d8cd98f00b204e9800998ecf8427e');
    assert.equal(md5Tool.hash('你好'), '7eca689f0d3389d9dea66ae112e5cfd7');
});

test('generates SHA digests using the selected algorithm', async () => {
    assert.equal(
        await shaTool.digest('abc', 'SHA-256'),
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
    assert.equal(
        await shaTool.digest('abc', 'SHA-512'),
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
        '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
    );
});
