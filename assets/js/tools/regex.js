(function () {
    const container = document.getElementById('tool-regex');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        pattern: '正则表达式', patternPlaceholder: '例如：(\\w+)=(\\d+)', flags: '标志', input: '测试文本',
        inputPlaceholder: '输入要匹配的文本...', replacement: '替换表达式', replacementPlaceholder: '例如：$1: $2',
        run: '测试并替换', clear: '清空', matches: '匹配结果', replacementOutput: '替换预览', copy: '复制替换结果',
        required: '请输入正则表达式', running: '正在安全执行正则表达式...', noMatches: '没有找到匹配项',
        complete: '执行完成，匹配 {count} 项', truncated: '执行完成，仅显示前 {count} 项', timeout: '执行超过 800 毫秒，已终止以避免页面卡死',
        failed: '正则表达式执行失败', copied: '已复制', copyFailed: '复制失败，请手动复制', empty: '没有可复制的结果',
        workerUnavailable: '当前浏览器不支持隔离执行正则表达式'
    } : {
        pattern: 'Regular Expression', patternPlaceholder: 'Example: (\\w+)=(\\d+)', flags: 'Flags', input: 'Test Text',
        inputPlaceholder: 'Enter text to match...', replacement: 'Replacement', replacementPlaceholder: 'Example: $1: $2',
        run: 'Test and Replace', clear: 'Clear', matches: 'Matches', replacementOutput: 'Replacement Preview', copy: 'Copy Replacement',
        required: 'Enter a regular expression', running: 'Running the expression in an isolated worker...', noMatches: 'No matches found',
        complete: 'Completed with {count} matches', truncated: 'Completed; showing the first {count} matches', timeout: 'Execution exceeded 800 ms and was stopped to keep the page responsive',
        failed: 'Regular expression execution failed', copied: 'Copied', copyFailed: 'Copy failed; please copy manually', empty: 'There is no result to copy',
        workerUnavailable: 'This browser cannot run the expression in an isolated worker'
    };

    container.innerHTML = `
        <div class="tool-container tool-section-stack">
            <div class="tool-field">
                <label class="tool-label" for="regex-pattern">${t.pattern}</label>
                <input class="tool-input tool-code-input" type="text" id="regex-pattern" spellcheck="false" autocomplete="off" placeholder="${t.patternPlaceholder}">
            </div>
            <fieldset class="tool-fieldset tool-fieldset--inline">
                <legend>${t.flags}</legend>
                <div class="tool-check-grid">
                    ${['g', 'i', 'm', 's', 'u', 'y'].map((flag) => `<label class="tool-check"><input type="checkbox" data-regex-flag="${flag}"${flag === 'g' ? ' checked' : ''}><span>${flag}</span></label>`).join('')}
                </div>
            </fieldset>
            <div class="tool-field">
                <label class="tool-label" for="regex-input">${t.input}</label>
                <textarea class="tool-input tool-code-input" id="regex-input" rows="8" spellcheck="false" placeholder="${t.inputPlaceholder}"></textarea>
            </div>
            <div class="tool-field">
                <label class="tool-label" for="regex-replacement">${t.replacement}</label>
                <input class="tool-input tool-code-input" type="text" id="regex-replacement" spellcheck="false" autocomplete="off" placeholder="${t.replacementPlaceholder}">
            </div>
            <div class="tool-actions">
                <button type="button" class="tool-btn tool-btn--primary" id="regex-run">${t.run}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="regex-clear">${t.clear}</button>
            </div>
            <div class="tool-status" id="regex-status" role="status" aria-live="polite"></div>
            <div class="tool-split" id="regex-output" hidden aria-hidden="true">
                <div class="tool-field">
                    <label class="tool-label" for="regex-match-output">${t.matches}</label>
                    <textarea class="tool-input tool-code-input" id="regex-match-output" rows="10" readonly></textarea>
                </div>
                <div class="tool-field">
                    <label class="tool-label" for="regex-replacement-output">${t.replacementOutput}</label>
                    <textarea class="tool-input tool-code-input" id="regex-replacement-output" rows="10" readonly></textarea>
                    <button type="button" class="tool-btn tool-btn--copy" id="regex-copy">${t.copy}</button>
                </div>
            </div>
        </div>
    `;

    const pattern = document.getElementById('regex-pattern');
    const input = document.getElementById('regex-input');
    const replacement = document.getElementById('regex-replacement');
    const runButton = document.getElementById('regex-run');
    const outputPanel = document.getElementById('regex-output');
    const matchOutput = document.getElementById('regex-match-output');
    const replacementOutput = document.getElementById('regex-replacement-output');
    const status = document.getElementById('regex-status');
    const ui = window.CodeGlimpseToolUi;

    function flags() {
        return Array.from(container.querySelectorAll('[data-regex-flag]:checked'))
            .map((checkbox) => checkbox.getAttribute('data-regex-flag')).join('');
    }

    function executeInWorker(payload) {
        const coreScript = Array.from(document.scripts).find((script) => /\/js\/tools\/regex-core\.[a-f0-9]{64}\.js$/i.test(script.src));
        if (!window.Worker || !coreScript) return Promise.reject(new Error(t.workerUnavailable));

        return new Promise((resolve, reject) => {
            const workerSource = `
                importScripts(${JSON.stringify(coreScript.src)});
                self.onmessage = function (event) {
                    try {
                        self.postMessage({ ok: true, result: self.CodeGlimpseRegex.execute(
                            event.data.pattern,
                            event.data.flags,
                            event.data.input,
                            event.data.replacement
                        ) });
                    } catch (error) {
                        self.postMessage({ ok: false, message: error.message });
                    }
                };
            `;
            const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
            const worker = new Worker(blobUrl);
            let finished = false;
            const finish = () => {
                if (finished) return false;
                finished = true;
                worker.terminate();
                URL.revokeObjectURL(blobUrl);
                return true;
            };
            const timer = window.setTimeout(() => {
                if (!finish()) return;
                const error = new Error(t.timeout);
                error.code = 'TIMEOUT';
                reject(error);
            }, 800);

            worker.onmessage = (event) => {
                if (!finish()) return;
                window.clearTimeout(timer);
                if (event.data.ok) resolve(event.data.result);
                else reject(new Error(event.data.message));
            };
            worker.onerror = () => {
                if (!finish()) return;
                window.clearTimeout(timer);
                reject(new Error(t.failed));
            };
            worker.postMessage(payload);
        });
    }

    function formatMatches(matches) {
        return matches.map((match, index) => {
            const captures = match.captures.length ? ` | captures: ${JSON.stringify(match.captures)}` : '';
            const groups = match.groups ? ` | groups: ${JSON.stringify(match.groups)}` : '';
            return `#${index + 1} @ ${match.index}: ${JSON.stringify(match.match)}${captures}${groups}`;
        }).join('\n');
    }

    async function run() {
        if (!pattern.value) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        runButton.disabled = true;
        ui.setStatus(status, 'info', t.running);
        try {
            const result = await executeInWorker({
                flags: flags(),
                input: input.value,
                pattern: pattern.value,
                replacement: replacement.value
            });
            matchOutput.value = formatMatches(result.matches);
            replacementOutput.value = result.replacement;
            outputPanel.hidden = false;
            outputPanel.setAttribute('aria-hidden', 'false');
            if (result.matches.length === 0) ui.setStatus(status, 'info', t.noMatches);
            else ui.setStatus(status, 'success', (result.truncated ? t.truncated : t.complete).replace('{count}', result.matches.length));
        } catch (error) {
            outputPanel.hidden = true;
            outputPanel.setAttribute('aria-hidden', 'true');
            ui.setStatus(status, 'error', error.code === 'TIMEOUT' ? t.timeout : `${t.failed}: ${error.message}`);
        } finally {
            runButton.disabled = false;
        }
    }

    runButton.addEventListener('click', run);
    document.getElementById('regex-clear').addEventListener('click', () => {
        pattern.value = '';
        input.value = '';
        replacement.value = '';
        matchOutput.value = '';
        replacementOutput.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setStatus(status, '', '');
        pattern.focus();
    });
    document.getElementById('regex-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget,
        value: replacementOutput.value,
        status,
        messages: { empty: t.empty, copied: t.copied, copyFailed: t.copyFailed }
    }));
    ui.bindShortcut(input, run);
})();
