const test = require('node:test');
const assert = require('node:assert/strict');
const yaml = require('../assets/js/tools/yaml-core.js');

test('parses common YAML mappings and arrays', () => {
    const value = yaml.parseYaml('name: CodeGlimpse\nitems:\n  - JSON\n  - YAML\nenabled: true');
    assert.deepEqual(value, { name: 'CodeGlimpse', items: ['JSON', 'YAML'], enabled: true });
});

test('converts JSON to YAML and back', () => {
    const output = yaml.jsonToYaml('{"name":"CodeGlimpse","count":2}');
    assert.match(output, /name: CodeGlimpse/);
    assert.deepEqual(yaml.yamlToJson(output), { name: 'CodeGlimpse', count: 2 });
});

test('reports invalid YAML indentation', () => {
    assert.throws(() => yaml.parseYaml('root:\n  child: 1\n bad: 2'), SyntaxError);
});

test('preserves sibling fields in sequence mappings and nested collections', () => {
    assert.deepEqual(yaml.parseYaml('people:\n  - name: Ada\n    age: 36\n    settings:\n      active: true'), {
        people: [{ name: 'Ada', age: 36, settings: { active: true } }],
    });
});

test('round-trips JSON nulls, empty collections, quoted keys, and escaped text', () => {
    const values = [
        null, [], {}, '', true, 42,
        { value: null, list: [], object: {}, listOfNulls: [null, {}, []] },
        { 'a:b': 'line one\nline two\n\n', quote: 'he said "hello"', numeric: '1e3', flag: 'true' },
        { people: [{ name: 'Ada', age: 36 }, { name: '中文', active: false }] },
        JSON.parse('{"__proto__":{"safe":true},"constructor":"value"}'),
    ];
    for (const value of values) {
        assert.deepEqual(yaml.yamlToJson(yaml.jsonToYaml(JSON.stringify(value))), value);
    }
});

test('rejects ambiguous or unsupported YAML without losing data', () => {
    for (const input of [
        'key: 1\nkey: 2', 'base: &base [1]\ncopy: *base', 'value: !!str 123',
        'one: 1\n---\ntwo: 2', 'value: .inf', 'value: .nan', 'value: 9007199254740993',
        '? [one, two]\n: value',
    ]) assert.throws(() => yaml.parseYaml(input), SyntaxError, input);
    assert.throws(() => yaml.jsonToYaml('{"value":9007199254740993}'), SyntaxError);
});
