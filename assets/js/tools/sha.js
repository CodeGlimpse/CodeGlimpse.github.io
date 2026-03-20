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
        <div class="tool-container">
            <div class="input-group">
                <label>${t.labelInput}</label>
                <textarea id="sha-input" rows="8" placeholder="${t.placeholderInput}"></textarea>
            </div>
            <div class="button-group">
                <button class="btn btn-primary" id="sha-generate">${t.btnHash}</button>
                <button class="btn btn-secondary" id="sha-clear">${t.btnClear}</button>
                <div class="options-group">
                    <span>${t.algoLabel}:</span>
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
            <div class="input-group result-group" id="sha-result-group" style="display: none;">
                <label>${t.labelOutput}</label>
                <textarea id="sha-output" rows="4" readonly></textarea>
                <button class="btn-copy" id="sha-copy">${t.copyBtn}</button>
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

    async function generateHash() {
        const str = input.value;
        if (!str) {
            resultGroup.style.display = 'none';
            return;
        }

        if (!window.crypto || !window.crypto.subtle) {
            alert(t.errorCrypto);
            return;
        }

        const algo = algoSelect.value;
        const msgUint8 = new TextEncoder().encode(str);

        try {
            const hashBuffer = await crypto.subtle.digest(algo, msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            let hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            const isUpper = document.getElementById('sha-case-upper').checked;
            if (isUpper) {
                hashHex = hashHex.toUpperCase();
            }

            output.value = hashHex;
            resultGroup.style.display = 'block';
        } catch (e) {
            console.error(e);
            alert(t.errorAlgo);
        }
    }

    btnGenerate.onclick = generateHash;
    input.oninput = generateHash;
    algoSelect.onchange = generateHash;
    caseRadios.forEach(radio => {
        radio.onchange = generateHash;
    });

    btnClear.onclick = () => {
        input.value = '';
        output.value = '';
        resultGroup.style.display = 'none';
        input.focus();
    };

    btnCopy.onclick = () => {
        output.select();
        document.execCommand('copy');
        const originalText = btnCopy.innerText;
        btnCopy.innerText = t.copied;
        setTimeout(() => { btnCopy.innerText = originalText; }, 2000);
    };
})();