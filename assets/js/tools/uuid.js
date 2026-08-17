(function () {
    const container = document.getElementById('tool-uuid');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        generateTitle: '生成 UUID v4', count: '生成数量', generate: '生成', clear: '清空', output: '生成结果',
        copy: '复制全部', copied: '已复制', copyFailed: '复制失败，请手动复制', generated: 'UUID 生成完成',
        validateTitle: '校验 UUID', validateInput: 'UUID 字符串', validate: '校验', valid: '有效的 RFC 9562 UUID',
        invalid: 'UUID 格式无效', version: '版本', nil: 'Nil UUID（全零）', max: 'Max UUID（全 F）', required: '请输入 UUID'
    } : {
        generateTitle: 'Generate UUID v4', count: 'Quantity', generate: 'Generate', clear: 'Clear', output: 'Generated UUIDs',
        copy: 'Copy All', copied: 'Copied', copyFailed: 'Copy failed; please copy manually', generated: 'UUID generation complete',
        validateTitle: 'Validate UUID', validateInput: 'UUID String', validate: 'Validate', valid: 'Valid RFC 9562 UUID',
        invalid: 'Invalid UUID format', version: 'Version', nil: 'Nil UUID (all zeros)', max: 'Max UUID (all Fs)', required: 'Enter a UUID'
    };

    container.innerHTML = `
        <div class="tool-container tool-section-stack">
            <section class="tool-section-stack" aria-labelledby="uuid-generate-title">
                <h2 class="tool-subheading" id="uuid-generate-title">${t.generateTitle}</h2>
                <div class="tool-inline-controls">
                    <div class="tool-field tool-field--compact">
                        <label class="tool-label" for="uuid-count">${t.count}</label>
                        <select class="tool-input" id="uuid-count">
                            <option value="1">1</option><option value="5" selected>5</option><option value="10">10</option>
                            <option value="25">25</option><option value="100">100</option>
                        </select>
                    </div>
                    <div class="tool-actions tool-actions--bottom">
                        <button type="button" class="tool-btn tool-btn--primary" id="uuid-generate">${t.generate}</button>
                        <button type="button" class="tool-btn tool-btn--secondary" id="uuid-clear">${t.clear}</button>
                    </div>
                </div>
                <div class="tool-status" id="uuid-status" role="status" aria-live="polite"></div>
                <div class="tool-field" id="uuid-output-panel" hidden aria-hidden="true">
                    <label class="tool-label" for="uuid-output">${t.output}</label>
                    <textarea class="tool-input tool-code-input" id="uuid-output" rows="7" readonly></textarea>
                    <button type="button" class="tool-btn tool-btn--copy tool-align-end" id="uuid-copy">${t.copy}</button>
                </div>
            </section>
            <section class="tool-section-stack tool-section-divider" aria-labelledby="uuid-validate-title">
                <h2 class="tool-subheading" id="uuid-validate-title">${t.validateTitle}</h2>
                <div class="tool-field">
                    <label class="tool-label" for="uuid-validate-input">${t.validateInput}</label>
                    <input class="tool-input tool-code-input" type="text" id="uuid-validate-input" autocomplete="off" spellcheck="false">
                </div>
                <div class="tool-actions">
                    <button type="button" class="tool-btn tool-btn--primary" id="uuid-validate">${t.validate}</button>
                </div>
                <div class="tool-status" id="uuid-validation-status" role="status" aria-live="polite"></div>
            </section>
        </div>
    `;

    const output = document.getElementById('uuid-output');
    const outputPanel = document.getElementById('uuid-output-panel');
    const status = document.getElementById('uuid-status');
    const validateInput = document.getElementById('uuid-validate-input');
    const validationStatus = document.getElementById('uuid-validation-status');
    const ui = window.CodeGlimpseToolUi;

    document.getElementById('uuid-generate').addEventListener('click', () => {
        try {
            output.value = window.CodeGlimpseUuid.generateMany(document.getElementById('uuid-count').value).join('\n');
            outputPanel.hidden = false;
            outputPanel.setAttribute('aria-hidden', 'false');
            ui.setStatus(status, 'success', t.generated);
        } catch (error) {
            ui.setStatus(status, 'error', error.message);
        }
    });
    document.getElementById('uuid-clear').addEventListener('click', () => {
        output.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setStatus(status, '', '');
    });
    document.getElementById('uuid-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget,
        value: output.value,
        status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));

    function validateUuid() {
        if (!validateInput.value.trim()) {
            ui.setStatus(validationStatus, 'error', t.required);
            return;
        }
        try {
            const result = window.CodeGlimpseUuid.inspect(validateInput.value);
            const detail = result.type === 'nil' ? t.nil : result.type === 'max' ? t.max : `${t.version} ${result.version}`;
            ui.setStatus(validationStatus, 'success', `${t.valid}: ${detail}`);
        } catch (error) {
            ui.setStatus(validationStatus, 'error', t.invalid);
        }
    }

    document.getElementById('uuid-validate').addEventListener('click', validateUuid);
    validateInput.addEventListener('input', () => {
        if (!validateInput.value) ui.setStatus(validationStatus, '', '');
    });
    validateInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            validateUuid();
        }
    });
})();
