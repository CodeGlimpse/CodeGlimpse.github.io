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
