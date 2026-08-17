const test = require('node:test');
const assert = require('node:assert/strict');

const toolUi = require('../assets/js/tools/tool-ui.js');

test('updates status and output layout state', () => {
    const status = { className: '', textContent: '' };
    const container = { dataset: {} };

    toolUi.setStatus(status, 'error', 'Invalid input');
    toolUi.setOutputState(container, 'ready');

    assert.equal(status.className, 'tool-status error');
    assert.equal(status.textContent, 'Invalid input');
    assert.equal(container.dataset.outputState, 'ready');
});

test('reports clipboard success and failure', async () => {
    const originalClipboard = globalThis.CodeGlimpseClipboard;
    const button = { disabled: false, textContent: 'Copy' };
    const status = { className: '', textContent: '' };
    const messages = {
        empty: 'Nothing to copy',
        copied: 'Copied',
        copyFailed: 'Copy failed'
    };

    try {
        globalThis.CodeGlimpseClipboard = { copy: async () => true };
        assert.equal(await toolUi.copy({ button, value: 'value', status, messages, restoreDelay: 0 }), true);
        assert.equal(status.textContent, 'Copied');
        assert.equal(button.disabled, false);

        globalThis.CodeGlimpseClipboard = { copy: async () => false };
        assert.equal(await toolUi.copy({ button, value: 'value', status, messages }), false);
        assert.equal(status.className, 'tool-status error');
        assert.equal(status.textContent, 'Copy failed');
    } finally {
        globalThis.CodeGlimpseClipboard = originalClipboard;
    }
});
