(function() {
    const container = document.getElementById('tool-sha');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'zh-cn';
    
    const i18n = {
        'zh-cn': {
            labelInput: '输入内容',
            labelOutput: 'SHA 哈希值',
            placeholderInput: '在此输入需要加密的文本...',
            btnHash: '生成 (Generate)',
            btnClear: '清空内容',
            copyBtn: '复制结果',
            copied: '已复制',
            copyFailed: '复制失败，请手动复制',
            required: '请输入需要处理的内容',
            processing: '正在生成哈希值…',
            generated: 'SHA 哈希值已生成',
            algoLabel: '算法选择',
            caseLabel: '输出格式',
            caseLower: '小写',
            caseUpper: '大写',
            errorCrypto: '浏览器不支持 Web Crypto API',
            errorAlgo: '当前浏览器不支持该算法'
        },
        'en': {
            labelInput: 'Input Content',
            labelOutput: 'SHA Hash',
            placeholderInput: 'Enter text to hash...',
            btnHash: 'Generate',
            btnClear: 'Clear',
            copyBtn: 'Copy Result',
            copied: 'Copied',
            copyFailed: 'Copy failed; please copy manually',
            required: 'Enter content to process',
            processing: 'Generating hash…',
            generated: 'SHA hash generated',
            algoLabel: 'Algorithm',
            caseLabel: 'Output Case',
            caseLower: 'Lowercase',
            caseUpper: 'Uppercase',
            errorCrypto: 'Browser does not support Web Crypto API',
            errorAlgo: 'Algorithm not supported by your browser'
        }
    };

    const t = i18n[lang] || i18n['en'];

    container.innerHTML = `
        <style>
            #tool-sha .tool-container { max-width: 100%; }
            #tool-sha .input-group { margin-bottom: 1.5rem; }
            #tool-sha label { font-weight: bold; font-size: 1.8rem; color: var(--card-text-color-main); display: block; margin-bottom: 0.5rem; }
            #tool-sha textarea {
                width: 100%;
                padding: 1.2rem;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-family: 'Fira Code', monospace;
                font-size: 1.4rem;
                line-height: 1.6;
                resize: vertical;
                outline: none;
                transition: border-color 0.2s;
            }
            #tool-sha textarea:focus { border-color: var(--accent-color); }
            #tool-sha .button-group { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; margin: 1.5rem 0 2rem 0; }
            #tool-sha .btn {
                padding: 1rem 2rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 1.4rem;
                transition: all 0.2s;
            }
            #tool-sha .btn-primary { background: var(--accent-color); color: #fff; }
            #tool-sha .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
            #tool-sha .btn-secondary { background: var(--body-background); border: 1px solid var(--border-color); color: var(--card-text-color-main); }
            #tool-sha .btn-secondary:hover { border-color: var(--accent-color); color: var(--accent-color); }
            
            #tool-sha .options-group { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; font-size: 1.4rem; color: var(--card-text-color-main); }
            #tool-sha .options-group select {
                padding: 0.5rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-size: 1.4rem;
                outline: none;
            }
            #tool-sha .options-group select:focus { border-color: var(--accent-color); }
            
            #tool-sha .result-group { position: relative; margin-top: 2rem; }
            #tool-sha .btn-copy {
                position: absolute;
                right: 1rem;
                top: 3.5rem;
                padding: 0.4rem 1rem;
                font-size: 1.2rem;
                background: var(--accent-color);
                color: #fff;
                border-radius: 4px;
                border: none;
                cursor: pointer;
            }
        </style>
        <div class="tool-container tool-text-tool" data-output-state="empty">
            <div class="input-group tool-field tool-input-panel">
                <label class="tool-label" for="sha-input">${t.labelInput}</label>
                <textarea id="sha-input" rows="8" placeholder="${t.placeholderInput}"></textarea>
            </div>
            <div class="button-group tool-actions tool-action-panel">
                <button type="button" class="btn btn-primary tool-btn tool-btn--primary" id="sha-generate">${t.btnHash}</button>
                <button type="button" class="btn btn-secondary tool-btn tool-btn--secondary" id="sha-clear">${t.btnClear}</button>
                <div class="options-group" role="group" aria-label="${t.caseLabel}">
                    <label for="sha-algo">${t.algoLabel}:</label>
                    <select id="sha-algo">
                        <option value="SHA-1">SHA-1</option>
                        <option value="SHA-256" selected>SHA-256</option>
                        <option value="SHA-384">SHA-384</option>
                        <option value="SHA-512">SHA-512</option>
                    </select>
                    <span>${t.caseLabel}:</span>
                    <input type="radio" id="sha-case-lower" name="sha-case" value="lower" checked>
                    <label for="sha-case-lower" style="display:inline; font-size: 1.4rem; margin-right: 0.5rem; font-weight: normal;">${t.caseLower}</label>
                    <input type="radio" id="sha-case-upper" name="sha-case" value="upper">
                    <label for="sha-case-upper" style="display:inline; font-size: 1.4rem; font-weight: normal;">${t.caseUpper}</label>
                </div>
            </div>
            <div class="tool-status" id="sha-status" role="status" aria-live="polite"></div>
            <div class="input-group result-group tool-field tool-output-panel" id="sha-result-group" hidden aria-hidden="true">
                <label class="tool-label" for="sha-output">${t.labelOutput}</label>
                <textarea id="sha-output" rows="4" readonly></textarea>
                <button type="button" class="btn-copy tool-btn tool-btn--copy" id="sha-copy" aria-label="${t.copyBtn}" disabled>${t.copyBtn}</button>
            </div>
        </div>
    `;

    const input = document.getElementById('sha-input');
    const output = document.getElementById('sha-output');
    const resultGroup = document.getElementById('sha-result-group');
    const btnGenerate = document.getElementById('sha-generate');
    const btnClear = document.getElementById('sha-clear');
    const btnCopy = document.getElementById('sha-copy');
    const algoSelect = document.getElementById('sha-algo');
    const caseRadios = document.getElementsByName('sha-case');
    const status = document.getElementById('sha-status');
    const toolLayout = container.querySelector('.tool-text-tool');
    const ui = window.CodeGlimpseToolUi;
    let generationToken = 0;

    async function generateHash(announce = false) {
        const str = input.value;
        if (!str) {
            generationToken += 1;
            output.value = '';
            resultGroup.hidden = true;
            resultGroup.setAttribute('aria-hidden', 'true');
            btnCopy.disabled = true;
            ui.setOutputState(toolLayout, 'empty');
            if (announce) ui.setStatus(status, 'error', t.required);
            return;
        }

        const algo = algoSelect.value;
        const requestToken = ++generationToken;
        btnGenerate.disabled = true;
        container.setAttribute('aria-busy', 'true');
        if (announce) ui.setStatus(status, 'info', t.processing);

        try {
            let hashHex = await window.CodeGlimpseSha.digest(str, algo);
            if (requestToken !== generationToken) return;

            const isUpper = document.getElementById('sha-case-upper').checked;
            if (isUpper) {
                hashHex = hashHex.toUpperCase();
            }

            output.value = hashHex;
            resultGroup.hidden = false;
            resultGroup.setAttribute('aria-hidden', 'false');
            btnCopy.disabled = false;
            ui.setOutputState(toolLayout, 'ready');
            ui.setStatus(status, announce ? 'success' : '', announce ? t.generated : '');
        } catch (e) {
            if (requestToken !== generationToken) return;
            console.error(e);
            output.value = '';
            resultGroup.hidden = true;
            resultGroup.setAttribute('aria-hidden', 'true');
            btnCopy.disabled = true;
            ui.setOutputState(toolLayout, 'empty');
            ui.setStatus(status, 'error', t.errorAlgo);
        } finally {
            if (requestToken === generationToken) {
                btnGenerate.disabled = false;
                container.removeAttribute('aria-busy');
            }
        }
    }

    btnGenerate.onclick = () => generateHash(true);
    input.oninput = () => generateHash(false);
    algoSelect.onchange = () => generateHash(false);
    caseRadios.forEach(radio => {
        radio.onchange = () => generateHash(false);
    });

    btnClear.onclick = () => {
        input.value = '';
        output.value = '';
        generationToken += 1;
        resultGroup.hidden = true;
        resultGroup.setAttribute('aria-hidden', 'true');
        btnGenerate.disabled = false;
        btnCopy.disabled = true;
        container.removeAttribute('aria-busy');
        ui.setOutputState(toolLayout, 'empty');
        ui.setStatus(status, '', '');
        input.focus();
    };

    btnCopy.onclick = () => {
        ui.copy({
            button: btnCopy,
            value: output.value,
            status,
            messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
        });
    };

    ui.bindShortcut(input, () => generateHash(true));
})();
