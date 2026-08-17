const test = require('node:test');
const assert = require('node:assert/strict');

const html = require('../assets/js/tools/html-core.js');

test('encodes HTML-sensitive characters without altering ordinary text', () => {
    assert.equal(html.encode('<a title="x">Tom & Jerry\'s</a>'), '&lt;a title=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;');
});

test('optionally encodes non-ASCII code points as hexadecimal entities', () => {
    assert.equal(html.encode('\u4f60\u597d \ud83d\ude00', true), '&#x4F60;&#x597D; &#x1F600;');
});

test('decodes common named and numeric entities safely', () => {
    assert.equal(html.decode('&lt;b&gt;Hi&nbsp;&#x1F600;&lt;/b&gt;'), '<b>Hi\u00A0\ud83d\ude00</b>');
    assert.equal(html.decode('&unknown;'), '&unknown;');
    assert.equal(html.decode('&#xD800;'), '\uFFFD');
});
