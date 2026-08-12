const test = require('node:test');
const assert = require('node:assert/strict');
const jsonTool = require('../assets/js/tools/json.js');

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
