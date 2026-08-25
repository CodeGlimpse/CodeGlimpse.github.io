(function () {
    const container = document.getElementById('tool-markdown');
    if (!container) return;
    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        input: 'Markdown 输入', preview: '预览', placeholder: '# 标题\n\n输入 **Markdown** 内容...',
        example: '示例', clear: '清空', copyHtml: '复制 HTML', download: '下载 HTML',
        required: '请输入 Markdown', complete: '预览已更新', copied: '已复制', copyFailed: '复制失败，请手动复制'
    } : {
        input: 'Markdown input', preview: 'Preview', placeholder: '# Heading\n\nEnter **Markdown** content...',
        example: 'Example', clear: 'Clear', copyHtml: 'Copy HTML', download: 'Download HTML',
        required: 'Enter Markdown', complete: 'Preview updated', copied: 'Copied', copyFailed: 'Copy failed; please copy manually'
    };
    const example = '# CodeGlimpse\\n\\nA **local-first** Markdown preview.\\n\\n- Safe HTML\\n- Code blocks\\n\\n\\x60\\x60\\x60js\\nconst ready = true;\\n\\x60\\x60\\x60';

    container.innerHTML = [
        '<div class="tool-container tool-text-tool" data-output-state="empty">',
        '<div class="tool-split">',
        '<div class="tool-field"><label class="tool-label" for="markdown-input">' + t.input + '</label><textarea class="tool-input tool-code-input" id="markdown-input" rows="15" spellcheck="false" placeholder="' + t.placeholder + '"></textarea></div>',
        '<div class="tool-field"><span class="tool-label">' + t.preview + '</span><div class="tool-markdown-preview" id="markdown-preview" aria-live="polite"></div></div>',
        '</div>',
        '<div class="tool-actions"><button type="button" class="tool-btn tool-btn--primary" id="markdown-example">' + t.example + '</button><button type="button" class="tool-btn tool-btn--secondary" id="markdown-clear">' + t.clear + '</button><button type="button" class="tool-btn tool-btn--copy" id="markdown-copy">' + t.copyHtml + '</button><button type="button" class="tool-btn tool-btn--secondary" id="markdown-download">' + t.download + '</button></div>',
        '<div class="tool-status" id="markdown-status" role="status" aria-live="polite"></div>',
        '</div>'
    ].join('');

    const input = document.getElementById('markdown-input');
    const preview = document.getElementById('markdown-preview');
    const status = document.getElementById('markdown-status');
    const tool = container.querySelector('.tool-container');
    const ui = window.CodeGlimpseToolUi;
    let html = '';

    function render() {
        if (!input.value.trim()) {
            preview.replaceChildren();
            html = '';
            ui.setOutputState(tool, 'empty');
            ui.setStatus(status, '', '');
            return;
        }
        html = window.CodeGlimpseMarkdown.render(input.value);
        preview.innerHTML = html;
        ui.setOutputState(tool, 'ready');
        ui.setStatus(status, 'success', t.complete);
    }

    document.getElementById('markdown-example').addEventListener('click', () => {
        input.value = example;
        render();
    });
    document.getElementById('markdown-clear').addEventListener('click', () => {
        input.value = '';
        render();
        input.focus();
    });
    input.addEventListener('input', render);
    document.getElementById('markdown-copy').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget, value: html, status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));
    document.getElementById('markdown-download').addEventListener('click', () => ui.download('codeglimpse.html', html, 'text/html;charset=utf-8'));
})();
