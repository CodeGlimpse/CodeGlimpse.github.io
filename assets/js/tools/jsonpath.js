(function () {
    const container = document.getElementById('tool-jsonpath');
    if (!container) return;
    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        input: '输入 JSON', path: 'JSONPath 表达式', output: '查询结果', placeholder: '{\n  "users": [{"name": "Alice"}, {"name": "Bob"}]\n}',
        pathPlaceholder: '$.users[*].name', query: '查询', example: '示例', clear: '清空', copy: '复制结果',
        required: '请输入 JSON 和 JSONPath', complete: '查询完成', empty: '没有匹配结果', failed: '查询失败',
        copied: '已复制', copyFailed: '复制失败，请手动复制'
    } : {
        input: 'Input JSON', path: 'JSONPath expression', output: 'Query result', placeholder: '{\n  "users": [{"name": "Alice"}, {"name": "Bob"}]\n}',
        pathPlaceholder: '$.users[*].name', query: 'Query', example: 'Example', clear: 'Clear', copy: 'Copy result',
        required: 'Enter JSON and JSONPath', complete: 'Query complete', empty: 'No matches', failed: 'Query failed',
        copied: 'Copied', copyFailed: 'Copy failed; please copy manually'
    };
    const exampleJson = '{"users":[{"name":"Alice","active":true},{"name":"Bob","active":false}]}';

    container.innerHTML = [
        '<div class="tool-container tool-text-tool" data-output-state="empty">',
        '<div class="tool-field tool-input-panel"><label class="tool-label" for="jsonpath-input">' + t.input + '</label><textarea class="tool-input tool-code-input" id="jsonpath-input" rows="11" spellcheck="false" placeholder="' + t.placeholder + '"></textarea></div>',
        '<div class="tool-inline-controls"><label class="tool-label" for="jsonpath-expression">' + t.path + '</label><input class="tool-input" id="jsonpath-expression" type="text" value="$" placeholder="' + t.pathPlaceholder + '"></div>',
        '<div class="tool-actions"><button type="button" class="tool-btn tool-btn--primary" id="jsonpath-query">' + t.query + '</button><button type="button" class="tool-btn tool-btn--secondary" id="jsonpath-example">' + t.example + '</button><button type="button" class="tool-btn tool-btn--secondary" id="jsonpath-clear">' + t.clear + '</button></div>',
        '<div class="tool-status" id="jsonpath-status" role="status" aria-live="polite"></div>',
        '<div class="tool-field tool-output-panel" id="jsonpath-output-panel" hidden aria-hidden="true"><label class="tool-label" for="jsonpath-output">' + t.output + '</label><textarea class="tool-input tool-code-input" id="jsonpath-output" rows="11" readonly></textarea><button type="button" class="tool-btn tool-btn--copy" id="jsonpath-copy">' + t.copy + '</button></div>',
        '</div>'
    ].join('');

    const input = document.getElementById('jsonpath-input');
    const expression = document.getElementById('jsonpath-expression');
    const output = document.getElementById('jsonpath-output');
    const outputPanel = document.getElementById('jsonpath-output-panel');
    const status = document.getElementById('jsonpath-status');
    const tool = container.querySelector('.tool-container');
    const ui = window.CodeGlimpseToolUi;

    function query() {
        if (!input.value.trim() || !expression.value.trim()) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        try {
            const matches = window.CodeGlimpseJsonPath.query(input.value, expression.value);
            output.value = JSON.stringify(matches.map((match) => ({ path: match.path, value: match.value })), null, 2);
            outputPanel.hidden = false;
            outputPanel.setAttribute('aria-hidden', 'false');
            ui.setOutputState(tool, 'ready');
            ui.setStatus(status, 'success', matches.length ? t.complete : t.empty);
        } catch (error) {
            outputPanel.hidden = true;
            outputPanel.setAttribute('aria-hidden', 'true');
            ui.setOutputState(tool, 'empty');
            ui.setStatus(status, 'error', t.failed + ': ' + error.message);
        }
    }

    document.getElementById('jsonpath-query').addEventListener('click', query);
    document.getElementById('jsonpath-example').addEventListener('click', () => {
        input.value = exampleJson;
        expression.value = '$.users[*].name';
        query();
    });
    document.getElementById('jsonpath-clear').addEventListener('click', () => {
        input.value = '';
        expression.value = '$';
        output.value = '';
        outputPanel.hidden = true;
        outputPanel.setAttribute('aria-hidden', 'true');
        ui.setOutputState(tool, 'empty');
        ui.setStatus(status, '', '');
        input.focus();
    });
    document.getElementById('jsonpath-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget, value: output.value, status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));
    ui.bindShortcut(expression, query);
})();
