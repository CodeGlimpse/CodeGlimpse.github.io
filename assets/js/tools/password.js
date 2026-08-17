(function () {
    const container = document.getElementById('tool-password');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        length: '密码长度', count: '生成数量', lower: '小写字母', upper: '大写字母', numbers: '数字', symbols: '符号',
        ambiguous: '排除易混淆字符（I、l、1、O、0、o）', entropy: '估算熵', bits: '位', generate: '生成密码', clear: '清空',
        output: '生成结果', copy: '复制全部', generated: '密码已在浏览器本地生成', failed: '无法生成密码',
        copied: '已复制', copyFailed: '复制失败，请手动复制', empty: '请先生成密码'
    } : {
        length: 'Password Length', count: 'Quantity', lower: 'Lowercase', upper: 'Uppercase', numbers: 'Numbers', symbols: 'Symbols',
        ambiguous: 'Exclude ambiguous characters (I, l, 1, O, 0, o)', entropy: 'Estimated Entropy', bits: 'bits', generate: 'Generate Passwords', clear: 'Clear',
        output: 'Generated Passwords', copy: 'Copy All', generated: 'Passwords generated locally in your browser', failed: 'Unable to generate passwords',
        copied: 'Copied', copyFailed: 'Copy failed; please copy manually', empty: 'Generate a password first'
    };

    container.innerHTML = `
        <div class="tool-container tool-section-stack">
            <div class="tool-form-grid">
                <div class="tool-field tool-field--wide">
                    <label class="tool-label" for="password-length">${t.length}</label>
                    <div class="tool-range-row">
                        <input class="tool-range" type="range" id="password-length" min="8" max="128" value="20">
                        <input class="tool-input tool-number-input" type="number" id="password-length-number" min="8" max="128" value="20" aria-label="${t.length}">
                    </div>
                </div>
                <div class="tool-field tool-field--compact">
                    <label class="tool-label" for="password-count">${t.count}</label>
                    <select class="tool-input" id="password-count">
                        <option value="1">1</option><option value="5" selected>5</option><option value="10">10</option><option value="20">20</option>
                    </select>
                </div>
            </div>
            <fieldset class="tool-fieldset">
                <legend>${t.generate}</legend>
                <div class="tool-check-grid tool-check-grid--options">
                    <label class="tool-check"><input type="checkbox" id="password-lower" checked><span>${t.lower}</span></label>
                    <label class="tool-check"><input type="checkbox" id="password-upper" checked><span>${t.upper}</span></label>
                    <label class="tool-check"><input type="checkbox" id="password-numbers" checked><span>${t.numbers}</span></label>
                    <label class="tool-check"><input type="checkbox" id="password-symbols" checked><span>${t.symbols}</span></label>
                    <label class="tool-check tool-check--wide"><input type="checkbox" id="password-ambiguous"><span>${t.ambiguous}</span></label>
                </div>
            </fieldset>
            <div class="tool-inline-summary"><strong>${t.entropy}:</strong> <span id="password-entropy">0</span> ${t.bits}</div>
            <div class="tool-actions">
                <button type="button" class="tool-btn tool-btn--primary" id="password-generate">${t.generate}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="password-clear">${t.clear}</button>
            </div>
            <div class="tool-status" id="password-status" role="status" aria-live="polite"></div>
            <div class="tool-field" id="password-output-panel" hidden aria-hidden="true">
                <label class="tool-label" for="password-output">${t.output}</label>
                <textarea class="tool-input tool-code-input" id="password-output" rows="8" readonly></textarea>
                <button type="button" class="tool-btn tool-btn--copy tool-align-end" id="password-copy">${t.copy}</button>
            </div>
        </div>
    `;

    const lengthRange = document.getElementById('password-length');
    const lengthNumber = document.getElementById('password-length-number');
    const output = document.getElementById('password-output');
    const outputPanel = document.getElementById('password-output-panel');
    const status = document.getElementById('password-status');
    const entropy = document.getElementById('password-entropy');
    const ui = window.CodeGlimpseToolUi;

    function options() {
        return {
            excludeAmbiguous: document.getElementById('password-ambiguous').checked,
            length: Number(lengthNumber.value),
            lower: document.getElementById('password-lower').checked,
            numbers: document.getElementById('password-numbers').checked,
            symbols: document.getElementById('password-symbols').checked,
            upper: document.getElementById('password-upper').checked
        };
    }

    function updateEntropy() {
        try {
            entropy.textContent = window.CodeGlimpsePassword.estimateEntropy(options()).toFixed(1);
            ui.setStatus(status, '', '');
        } catch (error) {
            entropy.textContent = '0';
        }
    }

    function syncLength(source, target) {
        const value = Math.min(128, Math.max(8, Number(source.value) || 8));
        source.value = value;
        target.value = value;
        updateEntropy();
    }

    lengthRange.addEventListener('input', () => syncLength(lengthRange, lengthNumber));
    lengthNumber.addEventListener('input', () => syncLength(lengthNumber, lengthRange));
    container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => checkbox.addEventListener('change', updateEntropy));

    document.getElementById('password-generate').addEventListener('click', () => {
        try {
            output.value = window.CodeGlimpsePassword.generateMany(
                options(),
                Number(document.getElementById('password-count').value)
            ).join('\n');
            outputPanel.hidden = false;
            outputPanel.setAttribute('aria-hidden', 'false');
            ui.setStatus(status, 'success', t.generated);
        } catch (error) {
            outputPanel.hidden = true;
            outputPanel.setAttribute('aria-hidden', 'true');
            ui.setStatus(status, 'error', `${t.failed}: ${error.message}`);
        }
    });
    document.getElementById('password-clear').addEventListener('click', () => {
        output.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setStatus(status, '', '');
    });
    document.getElementById('password-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget,
        value: output.value,
        status,
        messages: { empty: t.empty, copied: t.copied, copyFailed: t.copyFailed }
    }));
    updateEntropy();
})();
