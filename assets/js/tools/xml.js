(function () {
    const container = document.getElementById('tool-xml');
    if (!container) return;
    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        input: '输入 XML', output: 'XML 结果', placeholder: '<root><item id="1">内容</item></root>',
        format: '格式化', minify: '压缩', validate: '校验', clear: '清空', copy: '复制结果', download: '下载 XML',
        required: '请输入 XML', complete: 'XML 处理完成', valid: 'XML 格式有效', copied: '已复制', copyFailed: '复制失败，请手动复制',
        failed: 'XML 无效'
    } : {
        input: 'Input XML', output: 'XML result', placeholder: '<root><item id="1">Content</item></root>',
        format: 'Format', minify: 'Minify', validate: 'Validate', clear: 'Clear', copy: 'Copy result', download: 'Download XML',
        required: 'Enter XML', complete: 'XML processing complete', valid: 'Valid XML', copied: 'Copied', copyFailed: 'Copy failed; please copy manually',
        failed: 'Invalid XML'
    };

    container.innerHTML = [
        '<div class="tool-container tool-text-tool" data-output-state="empty">',
        '<div class="tool-field tool-input-panel"><label class="tool-label" for="xml-input">' + t.input + '</label><textarea class="tool-input tool-code-input" id="xml-input" rows="12" spellcheck="false" placeholder="' + t.placeholder + '"></textarea></div>',
        '<div class="tool-actions"><button type="button" class="tool-btn tool-btn--primary" id="xml-format">' + t.format + '</button><button type="button" class="tool-btn tool-btn--primary" id="xml-minify">' + t.minify + '</button><button type="button" class="tool-btn tool-btn--secondary" id="xml-validate">' + t.validate + '</button><button type="button" class="tool-btn tool-btn--secondary" id="xml-clear">' + t.clear + '</button></div>',
        '<div class="tool-status" id="xml-status" role="status" aria-live="polite"></div>',
        '<div class="tool-field tool-output-panel" id="xml-output-panel" hidden aria-hidden="true"><label class="tool-label" for="xml-output">' + t.output + '</label><textarea class="tool-input tool-code-input" id="xml-output" rows="12" readonly></textarea><div class="tool-actions"><button type="button" class="tool-btn tool-btn--copy" id="xml-copy">' + t.copy + '</button><button type="button" class="tool-btn tool-btn--secondary" id="xml-download">' + t.download + '</button></div></div>',
        '</div>'
    ].join('');

    const input = document.getElementById('xml-input');
    const output = document.getElementById('xml-output');
    const outputPanel = document.getElementById('xml-output-panel');
    const status = document.getElementById('xml-status');
    const tool = container.querySelector('.tool-container');
    const ui = window.CodeGlimpseToolUi;

    function process(mode) {
        if (!input.value.trim()) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        try {
            if (mode === 'validate') {
                window.CodeGlimpseXml.validateXml(input.value);
                ui.setStatus(status, 'success', t.valid);
                return;
            }
            output.value = mode === 'format'
                ? window.CodeGlimpseXml.formatXml(input.value)
                : window.CodeGlimpseXml.minifyXml(input.value);
            outputPanel.hidden = false;
            outputPanel.setAttribute('aria-hidden', 'false');
            ui.setOutputState(tool, 'ready');
            ui.setStatus(status, 'success', t.complete);
        } catch (error) {
            outputPanel.hidden = true;
            outputPanel.setAttribute('aria-hidden', 'true');
            ui.setOutputState(tool, 'empty');
            ui.setStatus(status, 'error', t.failed + ': ' + error.message);
        }
    }

    document.getElementById('xml-format').addEventListener('click', () => process('format'));
    document.getElementById('xml-minify').addEventListener('click', () => process('minify'));
    document.getElementById('xml-validate').addEventListener('click', () => process('validate'));
    document.getElementById('xml-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setOutputState(tool, 'empty');
        ui.setStatus(status, '', '');
        input.focus();
    });
    document.getElementById('xml-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget, value: output.value, status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));
    document.getElementById('xml-download').addEventListener('click', () => ui.download('codeglimpse.xml', output.value, 'application/xml;charset=utf-8'));
    ui.bindShortcut(input, () => process('format'));
})();
