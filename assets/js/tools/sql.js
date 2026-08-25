(function () {
    const container = document.getElementById('tool-sql');
    if (!container) return;
    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        input: '输入 SQL', output: 'SQL 结果', placeholder: 'select id, name from users where active = true order by id;',
        format: '格式化', minify: '压缩', example: '示例', clear: '清空', copy: '复制结果', download: '下载 SQL',
        required: '请输入 SQL', complete: 'SQL 处理完成', copied: '已复制', copyFailed: '复制失败，请手动复制'
    } : {
        input: 'Input SQL', output: 'SQL result', placeholder: 'select id, name from users where active = true order by id;',
        format: 'Format', minify: 'Minify', example: 'Example', clear: 'Clear', copy: 'Copy result', download: 'Download SQL',
        required: 'Enter SQL', complete: 'SQL processing complete', copied: 'Copied', copyFailed: 'Copy failed; please copy manually'
    };
    const example = "select id, name from users where active = true and role = 'admin' order by id;";

    container.innerHTML = [
        '<div class="tool-container tool-text-tool" data-output-state="empty">',
        '<div class="tool-field tool-input-panel"><label class="tool-label" for="sql-input">' + t.input + '</label><textarea class="tool-input tool-code-input" id="sql-input" rows="12" spellcheck="false" placeholder="' + t.placeholder + '"></textarea></div>',
        '<div class="tool-actions"><button type="button" class="tool-btn tool-btn--primary" id="sql-format">' + t.format + '</button><button type="button" class="tool-btn tool-btn--primary" id="sql-minify">' + t.minify + '</button><button type="button" class="tool-btn tool-btn--secondary" id="sql-example">' + t.example + '</button><button type="button" class="tool-btn tool-btn--secondary" id="sql-clear">' + t.clear + '</button></div>',
        '<div class="tool-status" id="sql-status" role="status" aria-live="polite"></div>',
        '<div class="tool-field tool-output-panel" id="sql-output-panel" hidden aria-hidden="true"><label class="tool-label" for="sql-output">' + t.output + '</label><textarea class="tool-input tool-code-input" id="sql-output" rows="12" readonly></textarea><div class="tool-actions"><button type="button" class="tool-btn tool-btn--copy" id="sql-copy">' + t.copy + '</button><button type="button" class="tool-btn tool-btn--secondary" id="sql-download">' + t.download + '</button></div></div>',
        '</div>'
    ].join('');

    const input = document.getElementById('sql-input');
    const output = document.getElementById('sql-output');
    const outputPanel = document.getElementById('sql-output-panel');
    const status = document.getElementById('sql-status');
    const tool = container.querySelector('.tool-container');
    const ui = window.CodeGlimpseToolUi;

    function process(mode) {
        if (!input.value.trim()) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        output.value = mode === 'format'
            ? window.CodeGlimpseSql.formatSql(input.value)
            : window.CodeGlimpseSql.minifySql(input.value);
        outputPanel.hidden = false;
        outputPanel.setAttribute('aria-hidden', 'false');
        ui.setOutputState(tool, 'ready');
        ui.setStatus(status, 'success', t.complete);
    }

    document.getElementById('sql-format').addEventListener('click', () => process('format'));
    document.getElementById('sql-minify').addEventListener('click', () => process('minify'));
    document.getElementById('sql-example').addEventListener('click', () => {
        input.value = example;
        process('format');
    });
    document.getElementById('sql-clear').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setOutputState(tool, 'empty');
        ui.setStatus(status, '', '');
        input.focus();
    });
    document.getElementById('sql-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget, value: output.value, status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));
    document.getElementById('sql-download').addEventListener('click', () => ui.download('codeglimpse.sql', output.value, 'text/plain;charset=utf-8'));
    ui.bindShortcut(input, () => process('format'));
})();
