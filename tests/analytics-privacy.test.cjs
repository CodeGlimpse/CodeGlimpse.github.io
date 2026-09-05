const test = require('node:test');
const assert = require('node:assert/strict');

const privacy = require('../assets/js/analytics-privacy.js');

function element({ id = '', tagName = 'DIV' } = {}) {
    const attributes = new Map();
    const classes = new Set();
    return {
        id,
        nodeType: 1,
        tagName,
        classList: { add: (value) => classes.add(value), contains: (value) => classes.has(value) },
        getAttribute: (name) => attributes.get(name) ?? null,
        setAttribute: (name, value) => attributes.set(name, String(value)),
    };
}

test('marks form fields and result elements for Clarity masking', () => {
    const input = element({ id: 'json-input', tagName: 'TEXTAREA' });
    const output = element({ id: 'json-output', tagName: 'TEXTAREA' });

    assert.equal(privacy.markElement(input), true);
    assert.equal(input.getAttribute('data-clarity-mask'), 'true');
    assert.equal(input.classList.contains('clarity-mask'), true);
    assert.equal(privacy.isOutputElement(output), true);
});

test('treats password and JWT tool regions as sensitive', () => {
    assert.equal(privacy.isSensitiveTool('password'), true);
    assert.equal(privacy.isSensitiveTool('jwt'), true);
    assert.equal(privacy.isSensitiveTool('json'), false);
    assert.equal(privacy.isOutputElement(element({ id: 'result-summary' })), true);
    assert.equal(privacy.isOutputElement(element({ id: 'ordinary-container' })), false);
});
