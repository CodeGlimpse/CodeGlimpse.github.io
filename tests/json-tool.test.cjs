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

test('formatting and minifying preserve large integers and numeric literals', () => {
    const input = '{"id":9007199254740993,"negative":-9223372036854775808,"decimal":1.234567890123456789,"exponent":1E+400,"tiny":1e-400,"zero":-0,"trailing":1.2300}';
    for (const indent of ['2', '4', 'tab']) {
        assert.equal(jsonTool.minifyJson(jsonTool.formatJson(input, indent)), input);
    }
    for (const scalar of ['9007199254740993', '-0', '1e400', '1.000']) {
        assert.equal(jsonTool.formatJson(scalar), scalar);
    }
});

test('formatting preserves key order, duplicate keys, string escapes and empty containers', () => {
    const input = '{"2":{},"1":[],"same":1,"same":2,"text":"{[,]} : \\\" \\u4f60\\n"}';
    assert.equal(jsonTool.minifyJson(jsonTool.formatJson(input)), input);
    assert.equal(jsonTool.formatJson('{"a":[],"b":{}}'), '{\n  "a": [],\n  "b": {}\n}');
    assert.equal(jsonTool.formatJson('[]'), '[]');
});

test('lossless formatting still rejects malformed JSON before producing output', () => {
    for (const input of ['', '{"x":01}', '[1,]', 'NaN', 'Infinity', '1 2', '{"a":"unterminated}', '{"x":+1}']) {
        assert.throws(() => jsonTool.formatJson(input), SyntaxError);
        assert.throws(() => jsonTool.minifyJson(input), SyntaxError);
    }
});
