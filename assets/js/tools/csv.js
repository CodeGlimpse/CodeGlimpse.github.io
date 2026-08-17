(function () {
    const container = document.getElementById('tool-csv');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        csvToJson: 'CSV 转 JSON', jsonToCsv: 'JSON 转 CSV', delimiter: '分隔符', comma: '逗号', semicolon: '分号',
        tab: 'Tab', pipe: '竖线', header: '使用标题行', inputCsv: '输入 CSV', inputJson: '输入 JSON 数组',
        csvPlaceholder: 'name,age\nAlice,30', jsonPlaceholder: '[\n  {"name": "Alice", "age": 30}\n]',
        outputJson: 'JSON 结果', outputCsv: 'CSV 结果', convert: '转换', clear: '清空', copy: '复制结果',
        required: '请输入需要转换的内容', complete: '转换完成', failed: '转换失败', copied: '已复制', copyFailed: '复制失败，请手动复制'
    } : {
        csvToJson: 'CSV to JSON', jsonToCsv: 'JSON to CSV', delimiter: 'Delimiter', comma: 'Comma', semicolon: 'Semicolon',
        tab: 'Tab', pipe: 'Pipe', header: 'Use Header Row', inputCsv: 'Input CSV', inputJson: 'Input JSON Array',
        csvPlaceholder: 'name,age\nAlice,30', jsonPlaceholder: '[\n  {"name": "Alice", "age": 30}\n]',
        outputJson: 'JSON Result', outputCsv: 'CSV Result', convert: 'Convert', clear: 'Clear', copy: 'Copy Result',
        required: 'Enter content to convert', complete: 'Conversion complete', failed: 'Conversion failed', copied: 'Copied', copyFailed: 'Copy failed; please copy manually'
    };

    container.innerHTML = `
        <div class="tool-container tool-text-tool" data-output-state="empty" data-mode="csv-to-json">
            <div class="tool-field tool-input-panel">
                <div class="tool-segmented" role="group" aria-label="${t.convert}">
                    <button type="button" class="tool-segmented__button" id="csv-mode-csv" data-csv-mode="csv-to-json" aria-pressed="true">${t.csvToJson}</button>
                    <button type="button" class="tool-segmented__button" id="csv-mode-json" data-csv-mode="json-to-csv" aria-pressed="false">${t.jsonToCsv}</button>
                </div>
                <div class="tool-inline-controls">
                    <div class="tool-field tool-field--compact">
                        <label class="tool-label" for="csv-delimiter">${t.delimiter}</label>
                        <select class="tool-input" id="csv-delimiter">
                            <option value="comma">${t.comma}</option><option value="semicolon">${t.semicolon}</option>
                            <option value="tab">${t.tab}</option><option value="pipe">${t.pipe}</option>
                        </select>
                    </div>
                    <label class="tool-check tool-check--bottom" for="csv-header">
                        <input type="checkbox" id="csv-header" checked>
                        <span>${t.header}</span>
                    </label>
                </div>
                <label class="tool-label" for="csv-input" id="csv-input-label">${t.inputCsv}</label>
                <textarea class="tool-input tool-code-input" id="csv-input" rows="11" spellcheck="false" placeholder="${t.csvPlaceholder}"></textarea>
            </div>
            <div class="tool-actions tool-action-panel">
                <button type="button" class="tool-btn tool-btn--primary" id="csv-convert">${t.convert}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="csv-clear">${t.clear}</button>
            </div>
            <div class="tool-status" id="csv-status" role="status" aria-live="polite"></div>
            <div class="tool-field tool-output-panel" id="csv-output-panel" hidden aria-hidden="true">
                <label class="tool-label" for="csv-output" id="csv-output-label">${t.outputJson}</label>
                <textarea class="tool-input tool-code-input" id="csv-output" rows="11" readonly></textarea>
                <button type="button" class="tool-btn tool-btn--copy" id="csv-copy">${t.copy}</button>
            </div>
        </div>
    `;

    const tool = container.querySelector('.tool-text-tool');
    const input = document.getElementById('csv-input');
    const output = document.getElementById('csv-output');
    const outputPanel = document.getElementById('csv-output-panel');
    const status = document.getElementById('csv-status');
    const ui = window.CodeGlimpseToolUi;
    const delimiters = { comma: ',', semicolon: ';', tab: '\t', pipe: '|' };

    function setMode(mode) {
        tool.dataset.mode = mode;
        container.querySelectorAll('[data-csv-mode]').forEach((button) => {
            button.setAttribute('aria-pressed', String(button.getAttribute('data-csv-mode') === mode));
        });
        const csvMode = mode === 'csv-to-json';
        document.getElementById('csv-input-label').textContent = csvMode ? t.inputCsv : t.inputJson;
        document.getElementById('csv-output-label').textContent = csvMode ? t.outputJson : t.outputCsv;
        input.placeholder = csvMode ? t.csvPlaceholder : t.jsonPlaceholder;
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
        const options = {
            delimiter: delimiters[document.getElementById('csv-delimiter').value],
            header: document.getElementById('csv-header').checked
        };
        try {
            output.value = tool.dataset.mode === 'csv-to-json'
                ? JSON.stringify(window.CodeGlimpseCsv.csvToJson(input.value, options), null, 2)
                : window.CodeGlimpseCsv.jsonToCsv(input.value, options);
            outputPanel.hidden = false;
            outputPanel.setAttribute('aria-hidden', 'false');
            ui.setOutputState(tool, 'ready');
            ui.setStatus(status, 'success', t.complete);
        } catch (error) {
            outputPanel.hidden = true;
            outputPanel.setAttribute('aria-hidden', 'true');
            ui.setOutputState(tool, 'empty');
            ui.setStatus(status, 'error', `${t.failed}: ${error.message}`);
        }
    }

    container.querySelectorAll('[data-csv-mode]').forEach((button) => {
        button.addEventListener('click', () => setMode(button.getAttribute('data-csv-mode')));
    });
    document.getElementById('csv-convert').addEventListener('click', convert);
    document.getElementById('csv-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setOutputState(tool, 'empty');
        ui.setStatus(status, '', '');
        input.focus();
    });
    document.getElementById('csv-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget,
        value: output.value,
        status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));
    ui.bindShortcut(input, convert);
})();
