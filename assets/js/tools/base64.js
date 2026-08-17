(function() {
    const container = document.getElementById('tool-base64');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'zh-cn';
    
    const i18n = {
        'zh-cn': {
            labelInput: '输入内容',
            labelOutput: '转换结果',
            placeholderInput: '在此输入需要编码或解码的文本...',
            btnEncode: '编码 (Encode)',
            btnDecode: '解码 (Decode)',
            btnClear: '清空内容',
            errorInvalid: '错误：无效的 Base64 编码',
            required: '请输入需要处理的内容',
            encoded: '编码完成',
            decoded: '解码完成',
            copyBtn: '复制结果',
            copied: '已复制',
            copyFailed: '复制失败，请手动复制'
        },
        'en': {
            labelInput: 'Input Content',
            labelOutput: 'Result',
            placeholderInput: 'Enter text to encode or Base64 to decode...',
            btnEncode: 'Encode',
            btnDecode: 'Decode',
            btnClear: 'Clear',
            errorInvalid: 'Error: Invalid Base64 string',
            required: 'Enter content to process',
            encoded: 'Encoding complete',
            decoded: 'Decoding complete',
            copyBtn: 'Copy Result',
            copied: 'Copied',
            copyFailed: 'Copy failed; please copy manually'
        }
    };

    const t = i18n[lang] || i18n['en'];

    container.innerHTML = `
        <style>
            #tool-base64 .tool-container { max-width: 100%; }
            #tool-base64 .input-group { margin-bottom: 1.5rem; }
            #tool-base64 label { font-weight: bold; font-size: 1.8rem; color: var(--card-text-color-main); display: block; margin-bottom: 0.5rem; }
            #tool-base64 textarea {
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
            #tool-base64 textarea:focus { border-color: var(--accent-color); }
            #tool-base64 .button-group { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1.5rem 0 2rem 0; }
            #tool-base64 .btn {
                padding: 1rem 2rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 1.4rem;
                transition: all 0.2s;
            }
            #tool-base64 .btn-primary { background: var(--accent-color); color: #fff; }
            #tool-base64 .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
            #tool-base64 .btn-secondary { background: var(--body-background); border: 1px solid var(--border-color); color: var(--card-text-color-main); }
            #tool-base64 .btn-secondary:hover { border-color: var(--accent-color); color: var(--accent-color); }
            #tool-base64 .result-group { position: relative; margin-top: 2rem; }
            #tool-base64 .btn-copy {
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
                <label class="tool-label" for="base64-input">${t.labelInput}</label>
                <textarea id="base64-input" rows="8" placeholder="${t.placeholderInput}"></textarea>
            </div>
            <div class="button-group tool-actions tool-action-panel">
                <button type="button" class="btn btn-primary tool-btn tool-btn--primary" id="base64-encode">${t.btnEncode}</button>
                <button type="button" class="btn btn-primary tool-btn tool-btn--primary" id="base64-decode">${t.btnDecode}</button>
                <button type="button" class="btn btn-secondary tool-btn tool-btn--secondary" id="base64-clear">${t.btnClear}</button>
            </div>
            <div class="tool-status" id="base64-status" role="status" aria-live="polite"></div>
            <div class="input-group result-group tool-field tool-output-panel" id="base64-result-group" hidden aria-hidden="true">
                <label class="tool-label" for="base64-output">${t.labelOutput}</label>
                <textarea id="base64-output" rows="8" readonly></textarea>
                <button type="button" class="btn-copy tool-btn tool-btn--copy" id="base64-copy" aria-label="${t.copyBtn}">${t.copyBtn}</button>
            </div>
        </div>
    `;

    const input = document.getElementById('base64-input');
    const output = document.getElementById('base64-output');
    const resultGroup = document.getElementById('base64-result-group');
    const btnEncode = document.getElementById('base64-encode');
    const btnDecode = document.getElementById('base64-decode');
    const btnClear = document.getElementById('base64-clear');
    const btnCopy = document.getElementById('base64-copy');
    const status = document.getElementById('base64-status');
    const ui = window.CodeGlimpseToolUi;

    const showResult = (val) => {
        output.value = val;
        resultGroup.hidden = false;
        resultGroup.setAttribute('aria-hidden', 'false');
        ui.setOutputState(container.querySelector('.tool-text-tool'), 'ready');
        setTimeout(() => {
            output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
    };

    btnEncode.onclick = () => {
        const str = input.value;
        if (!str) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        try {
            showResult(window.CodeGlimpseBase64.encode(str));
            ui.setStatus(status, 'success', t.encoded);
        } catch (e) {
            console.error(e);
        }
    };

    btnDecode.onclick = () => {
        const str = input.value.trim();
        if (!str) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        try {
            showResult(window.CodeGlimpseBase64.decode(str));
            ui.setStatus(status, 'success', t.decoded);
        } catch (e) {
            output.value = '';
            resultGroup.hidden = true;
            resultGroup.setAttribute('aria-hidden', 'true');
            ui.setOutputState(container.querySelector('.tool-text-tool'), 'empty');
            ui.setStatus(status, 'error', t.errorInvalid);
        }
    };

    btnClear.onclick = () => {
        input.value = '';
        output.value = '';
        resultGroup.hidden = true;
        resultGroup.setAttribute('aria-hidden', 'true');
        ui.setOutputState(container.querySelector('.tool-text-tool'), 'empty');
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

    ui.bindShortcut(input, () => btnEncode.click());
})();
