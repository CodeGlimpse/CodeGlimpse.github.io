(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseMarkdown = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[character]));
    }

    function safeUrl(value) {
        const url = String(value).trim();
        return /^(https?:|mailto:|#)/i.test(url) ? url : '#';
    }

    function inline(value) {
        let text = escapeHtml(value);
        text = text.replace(/\x60([^\x60]+)\x60/g, '<code>$1</code>');
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
        text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
        text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, label, url) => (
            '<a href="' + escapeHtml(safeUrl(url)) + '" rel="noreferrer noopener">' + label + '</a>'
        ));
        return text;
    }

    function render(markdown) {
        const lines = String(markdown ?? '').replace(/\r\n?/g, '\n').split('\n');
        const output = [];
        let index = 0;
        let inCode = false;
        let codeLanguage = '';
        let codeLines = [];
        let listType = null;

        function closeList() {
            if (listType) {
                output.push('</' + listType + '>');
                listType = null;
            }
        }

        while (index < lines.length) {
            const line = lines[index];
            const fence = line.match(/^\x60\x60\x60\s*([\w-]*)\s*$/);
            if (fence) {
                if (!inCode) {
                    closeList();
                    inCode = true;
                    codeLanguage = fence[1];
                    codeLines = [];
                } else {
                    const className = codeLanguage ? ' class="language-' + escapeHtml(codeLanguage) + '"' : '';
                    output.push('<pre><code' + className + '>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
                    inCode = false;
                    codeLanguage = '';
                }
                index += 1;
                continue;
            }
            if (inCode) {
                codeLines.push(line);
                index += 1;
                continue;
            }
            if (!line.trim()) {
                closeList();
                index += 1;
                continue;
            }
            const heading = line.match(/^(#{1,6})\s+(.+)$/);
            if (heading) {
                closeList();
                output.push('<h' + heading[1].length + '>' + inline(heading[2].trim()) + '</h' + heading[1].length + '>');
                index += 1;
                continue;
            }
            const list = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
            if (list) {
                const nextType = /^\d+\./.test(list[2]) ? 'ol' : 'ul';
                if (listType !== nextType) {
                    closeList();
                    listType = nextType;
                    output.push('<' + listType + '>');
                }
                output.push('<li>' + inline(list[3]) + '</li>');
                index += 1;
                continue;
            }
            if (/^>\s?/.test(line)) {
                closeList();
                output.push('<blockquote>' + inline(line.replace(/^>\s?/, '')) + '</blockquote>');
                index += 1;
                continue;
            }
            closeList();
            const paragraph = [line];
            while (index + 1 < lines.length && lines[index + 1].trim()
                && !/^#{1,6}\s+/.test(lines[index + 1])
                && !/^(\s*)([-*+]|\d+\.)\s+/.test(lines[index + 1])
                && !/^>\s?/.test(lines[index + 1])
                && !/^\x60\x60\x60\s*/.test(lines[index + 1])) {
                index += 1;
                paragraph.push(lines[index]);
            }
            output.push('<p>' + inline(paragraph.join('\n')).replace(/\n/g, '<br>') + '</p>');
            index += 1;
        }
        if (inCode) output.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
        closeList();
        return output.join('\n');
    }

    return { escapeHtml, render, safeUrl };
});
