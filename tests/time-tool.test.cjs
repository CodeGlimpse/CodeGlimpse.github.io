const test = require('node:test');
const assert = require('node:assert/strict');
const timeTool = require('../assets/js/tools/time-core.js');

test('parses seconds, milliseconds, negative timestamps, and rejects trailing text', () => {
    assert.equal(timeTool.parseTimestamp('0').milliseconds, 0);
    assert.equal(timeTool.parseTimestamp('1700000000').milliseconds, 1700000000000);
    assert.equal(timeTool.parseTimestamp('1700000000000').milliseconds, 1700000000000);
    assert.equal(timeTool.parseTimestamp('-1').milliseconds, -1000);
    assert.throws(() => timeTool.parseTimestamp('123abc'), SyntaxError);
});

test('rejects unsafe timestamps and invalid timezone calendar input', () => {
    assert.throws(() => timeTool.parseTimestamp('9007199254740992'), RangeError);
    assert.throws(() => timeTool.parseDateTime('2024-13-01 00:00:00'), RangeError);
    assert.throws(() => timeTool.dateTimeToTimestamp('2024-03-10 02:30:00', 'America/New_York'), RangeError);
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
