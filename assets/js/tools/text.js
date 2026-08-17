(function () {
    const container = document.getElementById('tool-text');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'en';
    const locale = lang === 'zh-cn' ? 'zh-CN' : 'en';
    const t = lang === 'zh-cn' ? {
        input: '输入文本', placeholder: '输入需要统计或转换的文本...', output: '转换结果',
        characters: '字符', noSpaces: '不含空白', words: '词数', lines: '行数', bytes: 'UTF-8 字节',
        upper: '转大写', lower: '转小写', title: '标题格式', sentence: '句首大写',
        trimLines: '清理行首尾', collapse: '合并多余空白', clear: '清空', copy: '复制结果',
        transformed: '文本转换完成', required: '请输入文本', copied: '已复制', copyFailed: '复制失败，请手动复制'
    } : {
        input: 'Input Text', placeholder: 'Enter text to analyze or transform...', output: 'Transformed Text',
        characters: 'Characters', noSpaces: 'No Whitespace', words: 'Words', lines: 'Lines', bytes: 'UTF-8 Bytes',
        upper: 'UPPERCASE', lower: 'lowercase', title: 'Title Case', sentence: 'Sentence case',
        trimLines: 'Trim Lines', collapse: 'Collapse Whitespace', clear: 'Clear', copy: 'Copy Result',
        transformed: 'Text transformation complete', required: 'Enter text', copied: 'Copied', copyFailed: 'Copy failed; please copy manually'
    };

    container.innerHTML = `
        <div class="tool-container tool-text-tool" data-output-state="empty">
            <div class="tool-field tool-input-panel">
                <label class="tool-label" for="text-input">${t.input}</label>
                <textarea class="tool-input tool-code-input" id="text-input" rows="10" placeholder="${t.placeholder}"></textarea>
                <dl class="tool-metrics" aria-live="polite">
                    <div><dt>${t.characters}</dt><dd id="text-characters">0</dd></div>
                    <div><dt>${t.noSpaces}</dt><dd id="text-no-spaces">0</dd></div>
                    <div><dt>${t.words}</dt><dd id="text-words">0</dd></div>
                    <div><dt>${t.lines}</dt><dd id="text-lines">0</dd></div>
                    <div><dt>${t.bytes}</dt><dd id="text-bytes">0</dd></div>
                </dl>
            </div>
            <div class="tool-actions tool-action-panel">
                <button type="button" class="tool-btn tool-btn--primary" data-text-mode="upper">${t.upper}</button>
                <button type="button" class="tool-btn tool-btn--primary" data-text-mode="lower">${t.lower}</button>
                <button type="button" class="tool-btn tool-btn--primary" data-text-mode="title">${t.title}</button>
                <button type="button" class="tool-btn tool-btn--primary" data-text-mode="sentence">${t.sentence}</button>
                <button type="button" class="tool-btn tool-btn--secondary" data-text-mode="trim-lines">${t.trimLines}</button>
                <button type="button" class="tool-btn tool-btn--secondary" data-text-mode="collapse-whitespace">${t.collapse}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="text-clear">${t.clear}</button>
            </div>
            <div class="tool-status" id="text-status" role="status" aria-live="polite"></div>
            <div class="tool-field tool-output-panel" id="text-output-panel" hidden aria-hidden="true">
                <label class="tool-label" for="text-output">${t.output}</label>
                <textarea class="tool-input tool-code-input" id="text-output" rows="10" readonly></textarea>
                <button type="button" class="tool-btn tool-btn--copy" id="text-copy">${t.copy}</button>
            </div>
        </div>
    `;

    const input = document.getElementById('text-input');
    const output = document.getElementById('text-output');
    const outputPanel = document.getElementById('text-output-panel');
    const status = document.getElementById('text-status');
    const tool = container.querySelector('.tool-text-tool');
    const ui = window.CodeGlimpseToolUi;
    const metricElements = {
        bytes: document.getElementById('text-bytes'),
        characters: document.getElementById('text-characters'),
        charactersNoSpaces: document.getElementById('text-no-spaces'),
        lines: document.getElementById('text-lines'),
        words: document.getElementById('text-words')
    };

    function updateMetrics() {
        const metrics = window.CodeGlimpseText.analyze(input.value, locale);
        for (const [name, element] of Object.entries(metricElements)) element.textContent = metrics[name];
    }

    function transform(mode) {
        if (!input.value) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        output.value = window.CodeGlimpseText.transform(input.value, mode, locale);
        outputPanel.hidden = false;
        outputPanel.setAttribute('aria-hidden', 'false');
        ui.setOutputState(tool, 'ready');
        ui.setStatus(status, 'success', t.transformed);
    }

    input.addEventListener('input', updateMetrics);
    container.querySelectorAll('[data-text-mode]').forEach((button) => {
        button.addEventListener('click', () => transform(button.getAttribute('data-text-mode')));
    });
    document.getElementById('text-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setOutputState(tool, 'empty');
        ui.setStatus(status, '', '');
        updateMetrics();
        input.focus();
    });
    document.getElementById('text-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget,
        value: output.value,
        status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));
    updateMetrics();
})();
