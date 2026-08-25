const test = require('node:test');
const assert = require('node:assert/strict');

const password = require('../assets/js/tools/password-core.js');

function deterministicSource() {
    let value = 0;
    return (count) => Uint8Array.from({ length: count }, () => {
        value = (value + 37) % 256;
        return value;
    });
}

test('generates passwords containing every selected character class', () => {
    const generated = password.generate({ length: 24 }, deterministicSource());
    assert.equal(generated.length, 24);
    assert.match(generated, /[a-z]/);
    assert.match(generated, /[A-Z]/);
    assert.match(generated, /[0-9]/);
    assert.match(generated, /[!@#$%^&*()\-_=+\[\]{};:,.?]/);
});

test('excludes ambiguous characters and creates bounded batches', () => {
    const generated = password.generateMany({
        excludeAmbiguous: true,
        length: 16,
        symbols: false
    }, 5, deterministicSource());
    assert.equal(generated.length, 5);
    assert.ok(generated.every((value) => !/[Il1O0o]/.test(value)));
});

test('estimates entropy and validates generation options', () => {
    assert.ok(password.estimateEntropy({ length: 20, symbols: false }) > 100);
    assert.throws(() => password.generate({ length: 7 }, deterministicSource()), /between 8 and 128/);
    assert.throws(() => password.generate({
        length: 20,
        lower: false,
        upper: false,
        numbers: false,
        symbols: false
    }, deterministicSource()), /at least one character set/);
});

test('enforces length, count, and deterministic source contracts', () => {
    assert.equal(password.normalizeOptions({ length: 8 }).length, 8);
    assert.equal(password.generateMany({ length: 8 }, 20, deterministicSource()).length, 20);
    assert.throws(() => password.generate({ length: 129 }, deterministicSource()), /between 8 and 128/);
    assert.throws(() => password.generateMany({ length: 8 }, 21, deterministicSource()), /between 1 and 20/);
    assert.throws(() => password.generate({ length: 8 }, () => new Uint8Array(1)), /requested byte count/);
});
