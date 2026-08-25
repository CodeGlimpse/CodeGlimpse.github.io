(function () {
    const container = document.getElementById('tool-yaml');
    if (!container) return;
    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        yamlToJson: 'YAML 转 JSON', jsonToYaml: 'JSON 转 YAML', inputYaml: '输入 YAML', inputJson: '输入 JSON',
        outputJson: 'JSON 结果', outputYaml: 'YAML 结果', placeholderYaml: 'name: CodeGlimpse\nitems:\n  - JSON\n  - YAML',
        placeholderJson: '{\n  "name": "CodeGlimpse"\n}', convert: '转换', clear: '清空', copy: '复制结果', download: '下载结果',
        required: '请输入内容', complete: '转换完成', failed: '转换失败', copied: '已复制', copyFailed: '复制失败，请手动复制'
    } : {
        yamlToJson: 'YAML to JSON', jsonToYaml: 'JSON to YAML', inputYaml: 'Input YAML', inputJson: 'Input JSON',
        outputJson: 'JSON result', outputYaml: 'YAML result', placeholderYaml: 'name: CodeGlimpse\nitems:\n  - JSON\n  - YAML',
        placeholderJson: '{\n  "name": "CodeGlimpse"\n}', convert: 'Convert', clear: 'Clear', copy: 'Copy result', download: 'Download result',
        required: 'Enter content', complete: 'Conversion complete', failed: 'Conversion failed', copied: 'Copied', copyFailed: 'Copy failed; please copy manually'
    };

    container.innerHTML = [
        '<div class="tool-container tool-text-tool" data-output-state="empty" data-mode="yaml-to-json">',
        '<div class="tool-segmented" role="group" aria-label="' + t.convert + '"><button type="button" class="tool-segmented__button" data-yaml-mode="yaml-to-json" aria-pressed="true">' + t.yamlToJson + '</button><button type="button" class="tool-segmented__button" data-yaml-mode="json-to-yaml" aria-pressed="false">' + t.jsonToYaml + '</button></div>',
        '<div class="tool-field tool-input-panel"><label class="tool-label" for="yaml-input" id="yaml-input-label">' + t.inputYaml + '</label><textarea class="tool-input tool-code-input" id="yaml-input" rows="12" spellcheck="false" placeholder="' + t.placeholderYaml + '"></textarea></div>',
        '<div class="tool-actions"><button type="button" class="tool-btn tool-btn--primary" id="yaml-convert">' + t.convert + '</button><button type="button" class="tool-btn tool-btn--secondary" id="yaml-clear">' + t.clear + '</button></div>',
        '<div class="tool-status" id="yaml-status" role="status" aria-live="polite"></div>',
        '<div class="tool-field tool-output-panel" id="yaml-output-panel" hidden aria-hidden="true"><label class="tool-label" for="yaml-output" id="yaml-output-label">' + t.outputJson + '</label><textarea class="tool-input tool-code-input" id="yaml-output" rows="12" readonly></textarea><div class="tool-actions"><button type="button" class="tool-btn tool-btn--copy" id="yaml-copy">' + t.copy + '</button><button type="button" class="tool-btn tool-btn--secondary" id="yaml-download">' + t.download + '</button></div></div>',
        '</div>'
    ].join('');

    const tool = container.querySelector('.tool-container');
    const input = document.getElementById('yaml-input');
    const output = document.getElementById('yaml-output');
    const outputPanel = document.getElementById('yaml-output-panel');
    const status = document.getElementById('yaml-status');
    const ui = window.CodeGlimpseToolUi;

    function setMode(mode) {
        tool.dataset.mode = mode;
        const yamlMode = mode === 'yaml-to-json';
        container.querySelectorAll('[data-yaml-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.getAttribute('data-yaml-mode') === mode)));
        document.getElementById('yaml-input-label').textContent = yamlMode ? t.inputYaml : t.inputJson;
        document.getElementById('yaml-output-label').textContent = yamlMode ? t.outputJson : t.outputYaml;
        input.placeholder = yamlMode ? t.placeholderYaml : t.placeholderJson;
        output.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setOutputState(tool, 'empty');
        ui.setStatus(status, '', '');
    }

    function convert() {
        if (!input.value.trim()) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        try {
            output.value = tool.dataset.mode === 'yaml-to-json'
                ? JSON.stringify(window.CodeGlimpseYaml.yamlToJson(input.value), null, 2)
                : window.CodeGlimpseYaml.jsonToYaml(input.value);
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

    container.querySelectorAll('[data-yaml-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.getAttribute('data-yaml-mode'))));
    document.getElementById('yaml-convert').addEventListener('click', convert);
    document.getElementById('yaml-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setOutputState(tool, 'empty');
        ui.setStatus(status, '', '');
        input.focus();
    });
    document.getElementById('yaml-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget, value: output.value, status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));
    document.getElementById('yaml-download').addEventListener('click', () => ui.download(tool.dataset.mode === 'yaml-to-json' ? 'codeglimpse.json' : 'codeglimpse.yaml', output.value, 'text/plain;charset=utf-8'));
    ui.bindShortcut(input, convert);
})();
