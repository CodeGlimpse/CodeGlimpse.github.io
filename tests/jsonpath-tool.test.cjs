const test = require('node:test');
const assert = require('node:assert/strict');
const jsonpath = require('../assets/js/tools/jsonpath-core.js');

test('queries properties, indexes, and wildcards', () => {
    const input = { users: [{ name: 'Alice' }, { name: 'Bob' }] };
    assert.deepEqual(jsonpath.query(input, '$.users[*].name').map((item) => item.value), ['Alice', 'Bob']);
    assert.equal(jsonpath.query(input, '$.users[1].name')[0].path, '$.users[1].name');
});

test('rejects unsupported or invalid expressions', () => {
    assert.throws(() => jsonpath.parsePath('users.name'), SyntaxError);
    assert.throws(() => jsonpath.parsePath('$..name'), /Recursive descent/);
});
