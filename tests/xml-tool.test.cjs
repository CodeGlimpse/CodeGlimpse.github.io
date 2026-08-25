const test = require('node:test');
const assert = require('node:assert/strict');
const xml = require('../assets/js/tools/xml-core.js');

test('validates and formats XML', () => {
    assert.equal(xml.validateXml('<root><item id="1">Text</item></root>'), true);
    assert.equal(xml.formatXml('<root><item>Text</item></root>'), '<root>\n  <item>\n    Text\n  </item>\n</root>');
});

test('minifies XML and rejects mismatched tags', () => {
    assert.equal(xml.minifyXml('<root>\n  <item />\n</root>'), '<root><item /></root>');
    assert.throws(() => xml.validateXml('<root><item></root>'), /Mismatched|Unclosed/);
});
