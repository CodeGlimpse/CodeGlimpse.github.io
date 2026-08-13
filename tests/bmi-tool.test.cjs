const test = require('node:test');
const assert = require('node:assert/strict');
const bmiTool = require('../assets/js/tools/bmi-core.js');

test('calculates BMI and rejects invalid measurements', () => {
    assert.equal(bmiTool.calculate('175', '70').toFixed(1), '22.9');
    assert.throws(() => bmiTool.calculate('', '70'), RangeError);
    assert.throws(() => bmiTool.calculate('175', '-1'), RangeError);
});
