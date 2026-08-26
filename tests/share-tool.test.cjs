const test = require('node:test');
const assert = require('node:assert/strict');

const share = require('../assets/js/tools/share.js');

test('encodes and decodes Unicode share state using a URL-safe hash', () => {
    const state = {
        version: 1,
        tool: 'json',
        language: 'zh-cn',
        fields: [{ id: 'json-input', type: 'textarea', value: '{"名称":"工具"}' }]
    };
    const hash = share.buildShareHash(state);
    assert.match(hash, /^#cgshare=[A-Za-z0-9_-]+$/);
    assert.deepEqual(share.parseShareHash(hash), state);
});

test('rejects malformed or oversized share state', () => {
    assert.equal(share.parseShareHash('#other=value'), null);
    assert.throws(() => share.parseShareHash('#cgshare=not-valid%%%'), /Invalid|Unexpected/);
    assert.throws(() => share.buildShareHash({
        version: 1,
        tool: 'text',
        fields: [{ id: 'text-input', value: 'x'.repeat(20000) }]
    }), /too large/i);
});

test('protects sensitive tools from generated share links', () => {
    assert.equal(share.SENSITIVE_TOOLS.has('jwt'), true);
    assert.equal(share.SENSITIVE_TOOLS.has('password'), true);
    assert.equal(share.SENSITIVE_TOOLS.has('json'), false);
});

test('restores only exact control ids inside the current tool', () => {
    const events = [];
    const control = {
        checked: false,
        dataset: {},
        disabled: false,
        dispatchEvent: (event) => events.push(event.type),
        id: 'safe-input',
        multiple: false,
        readOnly: false,
        tagName: 'TEXTAREA',
        type: 'textarea',
        value: ''
    };
    const outsideControl = { ...control, id: 'outside-input' };
    const controls = new Map([
        [control.id, control],
        [outsideControl.id, outsideControl]
    ]);
    const wrapper = {
        contains: (element) => element === control,
        ownerDocument: { getElementById: (id) => controls.get(id) || null }
    };

    const restored = share.restoreFields(wrapper, [
        { id: 'safe-input', value: '<img src=x onerror=alert(1)>' },
        { id: 'safe-input, #outside-input', value: 'selector injection' },
        { id: 'outside-input', value: 'outside wrapper' }
    ]);

    assert.equal(restored, 1);
    assert.equal(control.value, '<img src=x onerror=alert(1)>');
    assert.equal(outsideControl.value, '');
    assert.deepEqual(events, ['input', 'change']);
});
