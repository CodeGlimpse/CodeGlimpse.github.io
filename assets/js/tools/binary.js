(function() {
    const container = document.getElementById('tool-binary');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'zh-cn';
    
    const i18n = {
        'zh-cn': {
            labelInput: '输入数值',
            labelBase: '源进制',
            labelBinary: '二进制 (2)',
            labelOctal: '八进制 (8)',
            labelDecimal: '十进制 (10)',
            labelHex: '十六进制 (16)',
            labelCustom: '自定义进制 (2-36)',
            placeholderInput: '在这里输入数值...',
            placeholderCustom: '例如: 32',
            invalidInput: '无效输入',
            btnClear: '清空',
            copyBtn: '复制',
            copied: '已复制',
            copyFailed: '复制失败，请手动复制'
        },
        'en': {
            labelInput: 'Input Value',
            labelBase: 'Source Base',
            labelBinary: 'Binary (2)',
            labelOctal: 'Octal (8)',
            labelDecimal: 'Decimal (10)',
            labelHex: 'Hexadecimal (16)',
            labelCustom: 'Custom Base (2-36)',
            placeholderInput: 'Enter value here...',
            placeholderCustom: 'e.g., 32',
            invalidInput: 'Invalid Input',
            btnClear: 'Clear',
            copyBtn: 'Copy',
            copied: 'Copied',
            copyFailed: 'Copy failed; please copy manually'
        }
    };

    const t = i18n[lang] || i18n['en'];

    container.innerHTML = `
        <style>
            #tool-binary .tool-container { display: flex; flex-direction: column; gap: 1.5rem; max-width: 600px; margin: 0 auto; }
            #tool-binary .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
            #tool-binary .input-group label { font-weight: bold; font-size: 1.1rem; color: var(--card-text-color-main); }
            #tool-binary select, #tool-binary input {
                padding: 0.8rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-size: 1rem;
                outline: none;
                transition: border-color 0.2s;
            }
            #tool-binary select:focus, #tool-binary input:focus { border-color: var(--accent-color); }
            #tool-binary .results-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 1rem; }
            #tool-binary .result-item { display: flex; flex-direction: column; gap: 0.3rem; }
            #tool-binary .result-item label { font-size: 0.9rem; color: var(--card-text-color-secondary); }
            #tool-binary .result-row { display: flex; gap: 0.5rem; }
            #tool-binary .result-row input { flex: 1; }
            #tool-binary .copy-btn {
                padding: 0 1rem;
                background: var(--accent-color);
                color: #fff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: opacity 0.2s;
            }
            #tool-binary .copy-btn:hover { opacity: 0.8; }
            #tool-binary .custom-base-group { display: flex; gap: 1rem; }
            #tool-binary .custom-base-group .input-group { flex: 1; }
        </style>
        <div class="tool-container">
            <div class="custom-base-group">
                <div class="input-group tool-field">
                    <label class="tool-label" for="source-base">${t.labelBase}</label>
                    <select class="tool-input" id="source-base">
                        <option value="2">2 (${t.labelBinary})</option>
                        <option value="8">8 (${t.labelOctal})</option>
                        <option value="10" selected>10 (${t.labelDecimal})</option>
                        <option value="16">16 (${t.labelHex})</option>
                        <option value="custom">${t.labelCustom}</option>
                    </select>
                </div>
                <div class="input-group tool-field" id="custom-source-group" hidden>
                    <label class="tool-label" for="custom-source-base">${t.labelCustom}</label>
                    <input class="tool-input" type="number" id="custom-source-base" min="2" max="36" value="32">
                </div>
            </div>
            
            <div class="input-group tool-field">
                <label class="tool-label" for="binary-input">${t.labelInput}</label>
                <input class="tool-input" type="text" id="binary-input" placeholder="${t.placeholderInput}" inputmode="text" autocomplete="off">
            </div>

            <div class="tool-actions">
                <button type="button" class="tool-btn tool-btn--secondary" id="binary-clear">${t.btnClear}</button>
            </div>

            <div class="tool-status" id="binary-status" role="status" aria-live="polite"></div>

            <div class="results-grid">
                <div class="result-item">
                    <label for="res-2">${t.labelBinary}</label>
                    <div class="result-row">
                        <input class="tool-input" type="text" id="res-2" readonly>
                        <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="res-2" aria-label="${t.copyBtn}: ${t.labelBinary}" disabled>${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <label for="res-8">${t.labelOctal}</label>
                    <div class="result-row">
                        <input class="tool-input" type="text" id="res-8" readonly>
                        <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="res-8" aria-label="${t.copyBtn}: ${t.labelOctal}" disabled>${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <label for="res-10">${t.labelDecimal}</label>
                    <div class="result-row">
                        <input class="tool-input" type="text" id="res-10" readonly>
                        <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="res-10" aria-label="${t.copyBtn}: ${t.labelDecimal}" disabled>${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <label for="res-16">${t.labelHex}</label>
                    <div class="result-row">
                        <input class="tool-input" type="text" id="res-16" readonly>
                        <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="res-16" aria-label="${t.copyBtn}: ${t.labelHex}" disabled>${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label for="target-custom-base">${t.labelCustom}</label>
                        <input class="tool-input" type="number" id="target-custom-base" min="2" max="36" value="32" style="width: 7rem;">
                    </div>
                    <div class="result-row">
                        <input class="tool-input" type="text" id="res-custom" aria-label="${t.labelCustom}" readonly>
                        <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="res-custom" aria-label="${t.copyBtn}: ${t.labelCustom}" disabled>${t.copyBtn}</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const sourceBaseSelect = document.getElementById('source-base');
    const customSourceGroup = document.getElementById('custom-source-group');
    const customSourceBaseInput = document.getElementById('custom-source-base');
    const binaryInput = document.getElementById('binary-input');
    const targetCustomBaseInput = document.getElementById('target-custom-base');
    const clearButton = document.getElementById('binary-clear');
    const status = document.getElementById('binary-status');
    const ui = window.CodeGlimpseToolUi;

    const resultInputs = {
        2: document.getElementById('res-2'),
        8: document.getElementById('res-8'),
        10: document.getElementById('res-10'),
        16: document.getElementById('res-16'),
        custom: document.getElementById('res-custom')
    };
    const copyButtons = [...container.querySelectorAll('.copy-btn')];

    function clearResults() {
        Object.values(resultInputs).forEach(input => { input.value = ''; });
        copyButtons.forEach(button => { button.disabled = true; });
    }

    function updateConversion() {
        const val = binaryInput.value.trim();
        if (!val) {
            clearResults();
            ui.setStatus(status, '', '');
            return;
        }

        let sourceBase = sourceBaseSelect.value === 'custom' 
            ? parseInt(customSourceBaseInput.value, 10)
            : parseInt(sourceBaseSelect.value, 10);
        
        if (isNaN(sourceBase) || sourceBase < 2 || sourceBase > 36) {
            clearResults();
            ui.setStatus(status, 'error', t.invalidInput);
            return;
        }

        try {
            const decimalValue = window.CodeGlimpseBinary.parseInteger(val, sourceBase);

            resultInputs[2].value = window.CodeGlimpseBinary.formatInteger(decimalValue, 2);
            resultInputs[8].value = window.CodeGlimpseBinary.formatInteger(decimalValue, 8);
            resultInputs[10].value = window.CodeGlimpseBinary.formatInteger(decimalValue, 10);
            resultInputs[16].value = window.CodeGlimpseBinary.formatInteger(decimalValue, 16);
            
            const targetCustomBase = parseInt(targetCustomBaseInput.value, 10);
            if (isNaN(targetCustomBase) || targetCustomBase < 2 || targetCustomBase > 36) {
                throw new RangeError(t.invalidInput);
            }
            resultInputs['custom'].value = window.CodeGlimpseBinary.formatInteger(decimalValue, targetCustomBase);
            copyButtons.forEach(button => { button.disabled = false; });
            ui.setStatus(status, '', '');

        } catch (e) {
            clearResults();
            ui.setStatus(status, 'error', t.invalidInput);
        }
    }

    sourceBaseSelect.addEventListener('change', () => {
        customSourceGroup.hidden = sourceBaseSelect.value !== 'custom';
        updateConversion();
    });

    [customSourceBaseInput, binaryInput, targetCustomBaseInput].forEach(el => {
        el.addEventListener('input', updateConversion);
    });

    // Copy functionality
    copyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            ui.copy({
                button: btn,
                value: input?.value,
                status,
                messages: { empty: t.invalidInput, copied: t.copied, copyFailed: t.copyFailed }
            });
        });
    });

    clearButton.addEventListener('click', () => {
        binaryInput.value = '';
        clearResults();
        ui.setStatus(status, '', '');
        binaryInput.focus();
    });
})();
