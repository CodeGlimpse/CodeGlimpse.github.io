(function () {
    const container = document.getElementById('tool-html');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        input: '输入内容', output: '处理结果', placeholder: '输入 HTML 或实体文本...', nonAscii: '编码所有非 ASCII 字符',
        encode: '编码实体', decode: '解码实体', clear: '清空', copy: '复制结果', required: '请输入需要处理的内容',
        encoded: 'HTML 实体编码完成', decoded: 'HTML 实体解码完成', copied: '已复制', copyFailed: '复制失败，请手动复制'
    } : {
        input: 'Input', output: 'Result', placeholder: 'Enter HTML or entity text...', nonAscii: 'Encode all non-ASCII characters',
        encode: 'Encode Entities', decode: 'Decode Entities', clear: 'Clear', copy: 'Copy Result', required: 'Enter content to process',
        encoded: 'HTML entity encoding complete', decoded: 'HTML entity decoding complete', copied: 'Copied', copyFailed: 'Copy failed; please copy manually'
    };

    container.innerHTML = `
        <div class="tool-container tool-text-tool" data-output-state="empty">
            <div class="tool-field tool-input-panel">
                <label class="tool-label" for="html-input">${t.input}</label>
                <textarea class="tool-input tool-code-input" id="html-input" rows="9" spellcheck="false" placeholder="${t.placeholder}"></textarea>
                <label class="tool-check" for="html-non-ascii">
                    <input type="checkbox" id="html-non-ascii">
                    <span>${t.nonAscii}</span>
                </label>
            </div>
            <div class="tool-actions tool-action-panel">
                <button type="button" class="tool-btn tool-btn--primary" id="html-encode">${t.encode}</button>
                <button type="button" class="tool-btn tool-btn--primary" id="html-decode">${t.decode}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="html-clear">${t.clear}</button>
            </div>
            <div class="tool-status" id="html-status" role="status" aria-live="polite"></div>
            <div class="tool-field tool-output-panel" id="html-output-panel" hidden aria-hidden="true">
                <label class="tool-label" for="html-output">${t.output}</label>
                <textarea class="tool-input tool-code-input" id="html-output" rows="9" readonly></textarea>
                <button type="button" class="tool-btn tool-btn--copy" id="html-copy">${t.copy}</button>
            </div>
        </div>
    `;

    const input = document.getElementById('html-input');
    const output = document.getElementById('html-output');
    const outputPanel = document.getElementById('html-output-panel');
    const status = document.getElementById('html-status');
    const tool = container.querySelector('.tool-text-tool');
    const ui = window.CodeGlimpseToolUi;

    function process(mode) {
        if (!input.value) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        output.value = mode === 'encode'
            ? window.CodeGlimpseHtml.encode(input.value, document.getElementById('html-non-ascii').checked)
            : window.CodeGlimpseHtml.decode(input.value);
        outputPanel.hidden = false;
        outputPanel.setAttribute('aria-hidden', 'false');
        ui.setOutputState(tool, 'ready');
        ui.setStatus(status, 'success', mode === 'encode' ? t.encoded : t.decoded);
    }

    document.getElementById('html-encode').addEventListener('click', () => process('encode'));
    document.getElementById('html-decode').addEventListener('click', () => process('decode'));
    document.getElementById('html-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setOutputState(tool, 'empty');
        ui.setStatus(status, '', '');
        input.focus();
    });
    document.getElementById('html-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget,
        value: output.value,
        status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));
    ui.bindShortcut(input, () => process('encode'));
})();
