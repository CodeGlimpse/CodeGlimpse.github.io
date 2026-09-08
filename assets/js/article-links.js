import { copy } from './tools/clipboard.js';

const article = document.querySelector('.main-article .article-content');
if (article) {
    const en = document.documentElement.lang === 'en';
    const status = document.createElement('span');
    status.className = 'visually-hidden';
    status.setAttribute('role', 'status');
    article.append(status);
    article.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]').forEach(heading => {
        const button = document.createElement('button');
        const label = (en ? 'Copy link to: ' : '复制段落链接：') + heading.textContent;
        button.type = 'button';
        button.className = 'heading-copy-link';
        button.textContent = '#';
        button.title = label;
        button.setAttribute('aria-label', label);
        button.addEventListener('click', async () => {
            const url = new URL(window.location.pathname, window.location.origin);
            url.hash = heading.id;
            status.textContent = '';
            let copied = false;
            try { copied = await copy(url.href); } catch { /* report the failure in the page */ }
            button.focus({ preventScroll: true });
            status.textContent = copied ? (en ? 'Section link copied' : '段落链接已复制')
                : (en ? 'Copy failed. Open the section from the table of contents to copy its address.' : '复制失败，可从目录打开本段后复制地址。');
        });
        heading.append(button);
    });
}
