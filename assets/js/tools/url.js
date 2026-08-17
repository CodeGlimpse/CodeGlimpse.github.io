(function () {
    const container = document.getElementById('tool-url');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        input: '输入内容', output: '处理结果', placeholder: '输入需要编码或解码的 URL 组件...',
        formMode: '表单模式：空格与 + 互转', encode: '编码', decode: '解码', clear: '清空',
        copy: '复制结果', copied: '已复制', copyFailed: '复制失败，请手动复制',
        required: '请输入需要处理的内容', encoded: 'URL 编码完成', decoded: 'URL 解码完成',
        encodeFailed: '无法编码：输入包含无效的 Unicode 字符', decodeFailed: '无法解码：输入包含无效的百分号转义'
    } : {
        input: 'Input', output: 'Result', placeholder: 'Enter a URL component to encode or decode...',
        formMode: 'Form mode: convert spaces and +', encode: 'Encode', decode: 'Decode', clear: 'Clear',
        copy: 'Copy Result', copied: 'Copied', copyFailed: 'Copy failed; please copy manually',
        required: 'Enter content to process', encoded: 'URL encoding complete', decoded: 'URL decoding complete',
        encodeFailed: 'Unable to encode: the input contains an invalid Unicode character',
        decodeFailed: 'Unable to decode: the input contains an invalid percent escape'
    };

    container.innerHTML = `
        <div class="tool-container tool-text-tool" data-output-state="empty">
            <div class="tool-field tool-input-panel">
                <label class="tool-label" for="url-input">${t.input}</label>
                <textarea class="tool-input tool-code-input" id="url-input" rows="9" spellcheck="false" placeholder="${t.placeholder}"></textarea>
                <label class="tool-check" for="url-form-mode">
                    <input type="checkbox" id="url-form-mode">
                    <span>${t.formMode}</span>
                </label>
            </div>
            <div class="tool-actions tool-action-panel">
                <button type="button" class="tool-btn tool-btn--primary" id="url-encode">${t.encode}</button>
                <button type="button" class="tool-btn tool-btn--primary" id="url-decode">${t.decode}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="url-clear">${t.clear}</button>
            </div>
            <div class="tool-status" id="url-status" role="status" aria-live="polite"></div>
            <div class="tool-field tool-output-panel" id="url-output-panel" hidden aria-hidden="true">
                <label class="tool-label" for="url-output">${t.output}</label>
                <textarea class="tool-input tool-code-input" id="url-output" rows="9" readonly></textarea>
                <button type="button" class="tool-btn tool-btn--copy" id="url-copy">${t.copy}</button>
            </div>
        </div>
    `;

    const input = document.getElementById('url-input');
    const output = document.getElementById('url-output');
    const formMode = document.getElementById('url-form-mode');
    const outputPanel = document.getElementById('url-output-panel');
    const status = document.getElementById('url-status');
    const tool = container.querySelector('.tool-text-tool');
    const ui = window.CodeGlimpseToolUi;

    function showResult(value, message) {
        output.value = value;
        outputPanel.hidden = false;
        outputPanel.setAttribute('aria-hidden', 'false');
        ui.setOutputState(tool, 'ready');
        ui.setStatus(status, 'success', message);
    }

    function process(action) {
        if (!input.value) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        try {
            showResult(window.CodeGlimpseUrl[action](input.value, formMode.checked), action === 'encode' ? t.encoded : t.decoded);
        } catch (error) {
            ui.setStatus(status, 'error', action === 'encode' ? t.encodeFailed : t.decodeFailed);
        }
    }

    document.getElementById('url-encode').addEventListener('click', () => process('encode'));
    document.getElementById('url-decode').addEventListener('click', () => process('decode'));
    document.getElementById('url-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setOutputState(tool, 'empty');
        ui.setStatus(status, '', '');
        input.focus();
    });
    document.getElementById('url-copy').addEventListener('click', (event) => {
        ui.copy({
            button: event.currentTarget,
            value: output.value,
            status,
            messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
        });
    });
    ui.bindShortcut(input, () => process('encode'));
})();
