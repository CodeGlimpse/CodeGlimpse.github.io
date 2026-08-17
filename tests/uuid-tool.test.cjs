const test = require('node:test');
const assert = require('node:assert/strict');

const uuid = require('../assets/js/tools/uuid-core.js');

test('generates RFC 9562 version 4 UUIDs from secure bytes', () => {
    const generated = uuid.generate(() => Uint8Array.from({ length: 16 }, (_, index) => index));
    assert.equal(generated, '00010203-0405-4607-8809-0a0b0c0d0e0f');
    assert.equal(uuid.validate(generated), true);
    assert.deepEqual(uuid.inspect(generated), {
        type: 'uuid',
        value: generated,
        variant: 'rfc9562',
        version: 4
    });
});

test('generates bounded UUID batches', () => {
    const generated = uuid.generateMany(3, () => new Uint8Array(16));
    assert.equal(generated.length, 3);
    assert.ok(generated.every((value) => value === '00000000-0000-4000-8000-000000000000'));
    assert.throws(() => uuid.generateMany(101, () => new Uint8Array(16)), /between 1 and 100/);
});

test('validates nil, max, and malformed UUID values', () => {
    assert.equal(uuid.validate(uuid.NIL_UUID), true);
    assert.equal(uuid.validate(uuid.MAX_UUID.toUpperCase()), true);
    assert.equal(uuid.validate('00000000-0000-4000-7000-000000000000'), false);
    assert.throws(() => uuid.inspect('invalid'), /Invalid RFC 9562 UUID/);
});
