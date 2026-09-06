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

function conversionFixture(tool) {
    const input = {
        id: `${tool}-input`, type: 'textarea', dataset: {}, value: '',
        dispatchEvent() {},
    };
    const container = { dataset: { mode: `${tool}-to-json` } };
    const clicks = [];
    const wrapper = {
        id: `tool-${tool}`,
        getAttribute: () => 'en',
        contains: (control) => control === input,
        ownerDocument: { getElementById: (id) => id === input.id ? input : null },
        querySelectorAll: (selector) => selector === 'input, textarea, select' ? [input] : [],
        querySelector(selector) {
            if (selector === '.tool-container') return container;
            const mode = [`${tool}-to-json`, `json-to-${tool}`]
                .find((value) => selector === `[data-${tool}-mode="${value}"]`);
            return mode ? { click() {
                clicks.push(mode);
                container.dataset.mode = mode;
                input.value = '';
            } } : null;
        },
    };
    return { wrapper, input, container, clicks };
}

test('includes CSV and YAML conversion directions in share links and snapshots', () => {
    for (const tool of ['csv', 'yaml']) {
        const { wrapper, container, input } = conversionFixture(tool);
        container.dataset.mode = `json-to-${tool}`;
        input.value = '{"name":"Ada"}';
        const state = share.parseShareHash(share.buildShareHash(share.collectShareState(wrapper)));
        assert.equal(state.version, 1);
        assert.equal(state.mode, `json-to-${tool}`);
        assert.equal(share.collectSnapshot(wrapper).mode, `json-to-${tool}`);
    }
});

test('restores conversion direction before restoring input fields', () => {
    for (const tool of ['csv', 'yaml']) {
        const { wrapper, container, input, clicks } = conversionFixture(tool);
        const value = '[{"name":"Ada"}]';
        assert.equal(share.restoreShareState(wrapper, {
            tool, mode: `json-to-${tool}`, fields: [{ id: input.id, value }],
        }), 1);
        assert.equal(container.dataset.mode, `json-to-${tool}`);
        assert.deepEqual(clicks, [`json-to-${tool}`]);
        assert.equal(input.value, value);
    }
});

test('restores legacy links to the default direction and rejects unknown modes', () => {
    for (const tool of ['csv', 'yaml']) {
        const { wrapper, container, input, clicks } = conversionFixture(tool);
        container.dataset.mode = `json-to-${tool}`;
        share.restoreShareState(wrapper, { tool, fields: [{ id: input.id, value: 'original' }] });
        assert.equal(container.dataset.mode, `${tool}-to-json`);
        for (const mode of ['unknown', '__proto__', 'constructor', '"] #outside', null, [`json-to-${tool}`]]) {
            assert.throws(() => share.restoreShareState(wrapper, {
                tool, mode, fields: [{ id: input.id, value: 'changed' }],
            }), /Invalid share mode/);
        }
        assert.deepEqual(clicks, [`${tool}-to-json`]);
        assert.equal(input.value, 'original');
    }
});
