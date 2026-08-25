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
