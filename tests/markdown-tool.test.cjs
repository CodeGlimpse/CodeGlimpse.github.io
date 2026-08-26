const test = require('node:test');
const assert = require('node:assert/strict');
const markdown = require('../assets/js/tools/markdown-core.js');

test('renders common Markdown safely', () => {
    const html = markdown.render('# Title\n\n**bold** and [link](https://example.com)\n\n- item');
    assert.match(html, /<h1>Title<\/h1>/);
    assert.match(html, /<strong>bold<\/strong>/);
    assert.match(html, /<ul>/);
    assert.doesNotMatch(markdown.render('<script>alert(1)</script>'), /<script>/);
});

test('rejects unsafe link protocols', () => {
    assert.match(markdown.render('[bad](javascript:alert(1))'), /href="#"/);
});

test('escapes executable HTML and event attributes', () => {
    const payloads = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>x</svg>',
        '[bad](data:text/html,<script>alert(1)</script>)'
    ];

    for (const payload of payloads) {
        const html = markdown.render(payload);
        assert.doesNotMatch(html, /<(?:script|img|svg)\b|<[a-z][^>]*\son(?:error|load)\s*=|href="(?:javascript|data):/i);
    }
});
