(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseJsonTool = api;
    }

    if (root && root.document) {
        const start = () => api.mount(root.document);
        if (root.document.readyState === 'loading') {
            root.document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const INDENTS = {
        '2': '  ',
        '4': '    ',
        tab: '\t'
    };

    function parseJson(input) {
        return JSON.parse(String(input));
    }

    function getIndent(value) {
        return INDENTS[value] || INDENTS['2'];
    }

    function formatJson(input, indent) {
        return JSON.stringify(parseJson(input), null, getIndent(indent));
    }

    function minifyJson(input) {
        return JSON.stringify(parseJson(input));
    }

    function validateJson(input) {
        parseJson(input);
        return true;
    }

    // Escape a JSON document so it can be embedded inside a JSON string.
    // The outer pair of quotes is intentionally omitted.
    function escapeJsonText(input) {
        return JSON.stringify(String(input)).slice(1, -1);
    }

    // Decode text produced by escapeJsonText. Also accepts a complete JSON
    // string literal for convenience.
    function unescapeJsonText(input) {
        const text = String(input);

        if (text.length >= 2 && text[0] === '"' && text[text.length - 1] === '"') {
            const parsedLiteral = JSON.parse(text);
            if (typeof parsedLiteral !== 'string') {
                throw new SyntaxError('Expected a JSON string literal');
            }
            return parsedLiteral;
        }

        return JSON.parse(`"${text}"`);
    }

    function getErrorPosition(error) {
        const message = error && error.message ? error.message : '';
        const match = message.match(/position\s+(\d+)/i);
        return match ? Number(match[1]) : null;
    }

    function getErrorMessage(error, input, messages) {
        const position = getErrorPosition(error);
        if (position === null || position === undefined || position > input.length) {
            return `${messages.invalid}: ${error.message}`;
        }

        const beforeError = input.slice(0, position);
        const lines = beforeError.split(/\r\n|\r|\n/);
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        return `${messages.invalid}: ${error.message} (${messages.position} ${line}, ${column})`;
    }

    function mount(document) {
        const container = document.getElementById('tool-json');
        if (!container || container.dataset.mounted === 'true') return;
        container.dataset.mounted = 'true';

        const lang = container.getAttribute('data-lang') || 'en';
        const messages = lang === 'zh-cn' ? {
            inputLabel: '输入 JSON',
            outputLabel: '处理结果',
            indentLabel: '缩进',
            indent2: '2 个空格',
            indent4: '4 个空格',
            indentTab: 'Tab',
            format: '格式化',
            minify: '压缩',
            validate: '校验',
            escape: '转义',
            unescape: '反转义',
            example: '示例',
            clear: '清空',
            copy: '复制结果',
            copied: '已复制',
            copyFailed: '复制失败，请手动复制',
            valid: 'JSON 格式有效',
            escaped: '转义完成',
            unescaped: '反转义完成',
            required: '请输入 JSON 内容',
            invalid: 'JSON 无效',
            invalidEscaped: '转义文本无效',
            position: '位置',
            exampleLoaded: '示例已加载',
            cleared: '内容已清空'
        } : {
            inputLabel: 'Input JSON',
            outputLabel: 'Result',
            indentLabel: 'Indentation',
            indent2: '2 spaces',
            indent4: '4 spaces',
            indentTab: 'Tab',
            format: 'Format',
            minify: 'Minify',
            validate: 'Validate',
            escape: 'Escape',
            unescape: 'Unescape',
            example: 'Example',
            clear: 'Clear',
            copy: 'Copy Result',
            copied: 'Copied',
            copyFailed: 'Copy failed; please copy manually',
            valid: 'Valid JSON',
            escaped: 'Escaping complete',
            unescaped: 'Unescaping complete',
            required: 'Please enter JSON content',
            invalid: 'Invalid JSON',
            invalidEscaped: 'Invalid escaped text',
            position: 'position',
            exampleLoaded: 'Example loaded',
            cleared: 'Content cleared'
        };

        container.innerHTML = `
            <style>
                #tool-json .json-tool-container { display: flex; flex-direction: column; gap: 1.5rem; }
                #tool-json .json-field { display: flex; flex-direction: column; gap: 0.6rem; }
                #tool-json .json-label { color: var(--card-text-color-main); font-size: 1.4rem; font-weight: bold; }
                #tool-json .json-textarea {
                    width: 100%;
                    min-height: 220px;
                    padding: 1.2rem;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--body-background);
                    color: var(--card-text-color-main);
                    font-family: 'Fira Code', Consolas, monospace;
                    font-size: 1.35rem;
                    line-height: 1.6;
                    resize: vertical;
                    outline: none;
                    box-sizing: border-box;
                }
                #tool-json .json-textarea:focus,
                #tool-json select:focus { border-color: var(--accent-color); }
                #tool-json .json-toolbar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
                #tool-json .json-indent { display: flex; align-items: center; gap: 0.6rem; }
                #tool-json .json-indent label { color: var(--card-text-color-main); font-size: 1.3rem; }
                #tool-json select {
                    padding: 0.75rem 1rem;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    background: var(--body-background);
                    color: var(--card-text-color-main);
                    font-size: 1.3rem;
                }
                #tool-json .json-buttons { display: flex; gap: 0.8rem; flex-wrap: wrap; }
                #tool-json .json-button {
                    padding: 0.8rem 1.2rem;
                    border: 1px solid var(--accent-color);
                    border-radius: 6px;
                    background: var(--accent-color);
                    color: #fff;
                    cursor: pointer;
                    font-size: 1.3rem;
                    font-weight: bold;
                    transition: opacity 0.2s, transform 0.2s;
                }
                #tool-json .json-button:hover { opacity: 0.9; transform: translateY(-1px); }
                #tool-json .json-button.secondary {
                    background: var(--body-background);
                    color: var(--card-text-color-main);
                }
                #tool-json .json-status { min-height: 2rem; font-size: 1.3rem; line-height: 1.5; }
                #tool-json .json-status.success { color: #198754; }
                #tool-json .json-status.error { color: #dc3545; }
                #tool-json .json-output-wrapper { position: relative; }
                #tool-json .json-copy-button { position: absolute; right: 1rem; top: 3.3rem; }
                @media (max-width: 600px) {
                    #tool-json .json-textarea { min-height: 180px; font-size: 1.2rem; }
                    #tool-json .json-button { flex: 1 1 calc(50% - 0.8rem); }
                }
            </style>
            <div class="json-tool-container">
                <div class="json-field">
                    <label class="json-label" for="json-input">${messages.inputLabel}</label>
                    <textarea id="json-input" class="json-textarea" spellcheck="false" placeholder="{\n  &quot;name&quot;: &quot;Fernweh&quot;\n}"></textarea>
                </div>
                <div class="json-toolbar">
                    <div class="json-indent">
                        <label for="json-indent-select">${messages.indentLabel}</label>
                        <select id="json-indent-select">
                            <option value="2">${messages.indent2}</option>
                            <option value="4">${messages.indent4}</option>
                            <option value="tab">${messages.indentTab}</option>
                        </select>
                    </div>
                    <div class="json-buttons">
                        <button class="json-button" type="button" data-action="format">${messages.format}</button>
                        <button class="json-button" type="button" data-action="minify">${messages.minify}</button>
                        <button class="json-button" type="button" data-action="validate">${messages.validate}</button>
                        <button class="json-button" type="button" data-action="escape">${messages.escape}</button>
                        <button class="json-button" type="button" data-action="unescape">${messages.unescape}</button>
                        <button class="json-button secondary" type="button" data-action="example">${messages.example}</button>
                        <button class="json-button secondary" type="button" data-action="clear">${messages.clear}</button>
                    </div>
                </div>
                <div id="json-status" class="json-status" role="status" aria-live="polite"></div>
                <div class="json-field json-output-wrapper">
                    <label class="json-label" for="json-output">${messages.outputLabel}</label>
                    <textarea id="json-output" class="json-textarea" spellcheck="false" readonly></textarea>
                    <button class="json-button json-copy-button" type="button" data-action="copy">${messages.copy}</button>
                </div>
            </div>
        `;

        const input = document.getElementById('json-input');
        const output = document.getElementById('json-output');
        const indentSelect = document.getElementById('json-indent-select');
        const status = document.getElementById('json-status');
        const buttons = container.querySelectorAll('[data-action]');

        function setStatus(type, message) {
            status.className = `json-status ${type}`;
            status.textContent = message;
        }

        function requireInput() {
            if (input.value.trim()) return true;
            setStatus('error', messages.required);
            return false;
        }

        function run(action) {
            if (action === 'example') {
                input.value = JSON.stringify({
                    name: 'Fernweh',
                    description: 'A digital garden',
                    tools: ['JSON', 'Base64'],
                    enabled: true,
                    metadata: { version: 1 }
                }, null, 2);
                output.value = '';
                setStatus('success', messages.exampleLoaded);
                return;
            }

            if (action === 'clear') {
                input.value = '';
                output.value = '';
                setStatus('success', messages.cleared);
                input.focus();
                return;
            }

            if (action === 'copy') {
                copyOutput();
                return;
            }

            if (!requireInput()) return;

            try {
                if (action === 'format') {
                    output.value = formatJson(input.value, indentSelect.value);
                    setStatus('success', messages.valid);
                } else if (action === 'minify') {
                    output.value = minifyJson(input.value);
                    setStatus('success', messages.valid);
                } else if (action === 'validate') {
                    validateJson(input.value);
                    setStatus('success', messages.valid);
                } else if (action === 'escape') {
                    output.value = escapeJsonText(input.value);
                    setStatus('success', messages.escaped);
                } else if (action === 'unescape') {
                    output.value = unescapeJsonText(input.value);
                    setStatus('success', messages.unescaped);
                }
            } catch (error) {
                const errorText = action === 'unescape'
                    ? `${messages.invalidEscaped}: ${error.message}`
                    : getErrorMessage(error, input.value, messages);
                setStatus('error', errorText);
                output.value = '';
            }
        }

        async function copyOutput() {
            if (!output.value) {
                setStatus('error', messages.required);
                return;
            }

            try {
                const copied = await window.CodeGlimpseClipboard.copy(output.value);
                if (!copied) throw new Error('copy failed');
                setStatus('success', messages.copied);
            } catch (error) {
                setStatus('error', messages.copyFailed);
            }
        }

        buttons.forEach((button) => {
            button.addEventListener('click', () => run(button.dataset.action));
        });
    }

    return {
        escapeJsonText,
        formatJson,
        minifyJson,
        parseJson,
        unescapeJsonText,
        validateJson,
        mount
    };
});
