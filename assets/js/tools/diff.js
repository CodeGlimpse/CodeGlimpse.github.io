(function () {
    const container = document.getElementById('tool-diff');
    if (!container) return;
    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        left: '原始文本', right: '比较文本', leftPlaceholder: '粘贴原始内容...', rightPlaceholder: '粘贴要比较的内容...',
        compare: '开始对比', clear: '清空', ignoreSpace: '忽略空白差异', ignoreCase: '忽略大小写',
        result: '差异结果', added: '新增', removed: '删除', unchanged: '未改变', required: '请填写两侧文本',
        complete: '对比完成', copied: '已复制', copyFailed: '复制失败，请手动复制', copy: '复制结果', download: '下载报告',
        noDiff: '两侧文本没有差异', error: '对比失败'
    } : {
        left: 'Original text', right: 'Compared text', leftPlaceholder: 'Paste the original content...', rightPlaceholder: 'Paste the content to compare...',
        compare: 'Compare', clear: 'Clear', ignoreSpace: 'Ignore whitespace', ignoreCase: 'Ignore case',
        result: 'Diff result', added: 'Added', removed: 'Removed', unchanged: 'Unchanged', required: 'Fill in both text areas',
        complete: 'Comparison complete', copied: 'Copied', copyFailed: 'Copy failed; please copy manually', copy: 'Copy result', download: 'Download report',
        noDiff: 'The two texts are identical', error: 'Comparison failed'
    };

    container.innerHTML = [
        '<div class="tool-container tool-text-tool" data-output-state="empty">',
        '<div class="tool-split">',
        '<div class="tool-field"><label class="tool-label" for="diff-left">' + t.left + '</label><textarea class="tool-input tool-code-input" id="diff-left" rows="12" spellcheck="false" placeholder="' + t.leftPlaceholder + '"></textarea></div>',
        '<div class="tool-field"><label class="tool-label" for="diff-right">' + t.right + '</label><textarea class="tool-input tool-code-input" id="diff-right" rows="12" spellcheck="false" placeholder="' + t.rightPlaceholder + '"></textarea></div>',
        '</div>',
        '<div class="tool-check-grid tool-check-grid--options"><label class="tool-check"><input type="checkbox" id="diff-ignore-space"><span>' + t.ignoreSpace + '</span></label><label class="tool-check"><input type="checkbox" id="diff-ignore-case"><span>' + t.ignoreCase + '</span></label></div>',
        '<div class="tool-actions"><button type="button" class="tool-btn tool-btn--primary" id="diff-compare">' + t.compare + '</button><button type="button" class="tool-btn tool-btn--secondary" id="diff-clear">' + t.clear + '</button></div>',
        '<div class="tool-status" id="diff-status" role="status" aria-live="polite"></div>',
        '<div class="tool-field tool-output-panel" id="diff-output-panel" hidden aria-hidden="true"><div class="tool-inline-summary" id="diff-summary"></div><ol class="tool-diff-output" id="diff-output"></ol><div class="tool-actions"><button type="button" class="tool-btn tool-btn--copy" id="diff-copy">' + t.copy + '</button><button type="button" class="tool-btn tool-btn--secondary" id="diff-download">' + t.download + '</button></div></div>',
        '</div>'
    ].join('');

    const left = document.getElementById('diff-left');
    const right = document.getElementById('diff-right');
    const output = document.getElementById('diff-output');
    const outputPanel = document.getElementById('diff-output-panel');
    const summary = document.getElementById('diff-summary');
    const status = document.getElementById('diff-status');
    const tool = container.querySelector('.tool-container');
    const ui = window.CodeGlimpseToolUi;
    let report = '';

    function compare() {
        if (!left.value.trim() || !right.value.trim()) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        try {
            const result = window.CodeGlimpseDiff.compare(left.value, right.value, {
                ignoreWhitespace: document.getElementById('diff-ignore-space').checked,
                ignoreCase: document.getElementById('diff-ignore-case').checked
            });
            output.replaceChildren();
            result.lines.forEach((line) => {
                const item = document.createElement('li');
                item.className = 'tool-diff-line tool-diff-line--' + line.type;
                item.textContent = (line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  ') + line.text;
                output.appendChild(item);
            });
            summary.textContent = t.added + ': ' + result.added + ' · ' + t.removed + ': ' + result.removed + ' · ' + t.unchanged + ': ' + result.unchanged;
            report = result.lines.map((line) => (line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  ') + line.text).join('\n');
            outputPanel.hidden = false;
            outputPanel.setAttribute('aria-hidden', 'false');
            ui.setOutputState(tool, 'ready');
            ui.setStatus(status, 'success', result.added || result.removed ? t.complete : t.noDiff);
        } catch (error) {
            ui.setStatus(status, 'error', t.error + ': ' + error.message);
        }
    }

    document.getElementById('diff-compare').addEventListener('click', compare);
    document.getElementById('diff-clear').addEventListener('click', () => {
        left.value = '';
        right.value = '';
        output.replaceChildren();
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setOutputState(tool, 'empty');
        ui.setStatus(status, '', '');
        left.focus();
    });
    document.getElementById('diff-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget, value: report, status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));
    document.getElementById('diff-download').addEventListener('click', () => ui.download('codeglimpse-diff.txt', report));
    ui.bindShortcut(left, compare);
    ui.bindShortcut(right, compare);
})();
