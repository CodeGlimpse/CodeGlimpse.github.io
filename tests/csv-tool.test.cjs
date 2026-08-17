const test = require('node:test');
const assert = require('node:assert/strict');

const csv = require('../assets/js/tools/csv-core.js');

test('parses quoted CSV fields, escaped quotes, and embedded newlines', () => {
    assert.deepEqual(csv.parse('name,note\r\nAlice,"hello, ""Codex"""\r\nBob,"line 1\r\nline 2"'), [
        ['name', 'note'],
        ['Alice', 'hello, "Codex"'],
        ['Bob', 'line 1\nline 2']
    ]);
});

test('converts header-based CSV to JSON and pads missing fields', () => {
    assert.deepEqual(csv.csvToJson('name,age\nAlice,30\nBob'), [
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '' }
    ]);
    assert.throws(() => csv.csvToJson('name,name\nA,B'), /must be unique/);
});

test('converts object arrays to escaped CSV with stable column order', () => {
    const result = csv.jsonToCsv([
        { name: 'Alice', note: 'hello, world' },
        { name: 'Bob', active: true }
    ]);
    assert.equal(result, 'name,note,active\nAlice,"hello, world",\nBob,,true');
});

test('supports array rows and rejects mixed JSON arrays', () => {
    assert.equal(csv.jsonToCsv([[1, 2], ['a', 'b']], { delimiter: ';' }), '1;2\na;b');
    assert.throws(() => csv.jsonToCsv('[{"a":1},[2]]'), /all be objects or all be arrays/);
    assert.throws(() => csv.parse('a,"unclosed'), /unclosed quoted field/);
});
