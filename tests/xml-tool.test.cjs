const test = require('node:test');
const assert = require('node:assert/strict');
const xml = require('../assets/js/tools/xml-core.js');
const { DOMParser } = require('@xmldom/xmldom');

test('validates and formats XML', () => {
    assert.equal(xml.validateXml('<root><item id="1">Text</item></root>'), true);
    assert.equal(xml.formatXml('<root><item>Text</item></root>'), '<root>\n  <item>Text</item>\n</root>');
});

test('minifies XML and rejects mismatched tags', () => {
    assert.equal(xml.minifyXml('<root>\n  <item />\n</root>'), '<root><item/></root>');
    assert.throws(() => xml.validateXml('<root><item></root>'), SyntaxError);
});

test('preserves mixed content, CDATA, attributes, and explicit whitespace regions', () => {
    const input = '<root label="a  b"><p>Hello <b>world</b> !</p><raw><![CDATA[a  b]]></raw><v xml:space="preserve"> a  <x/> b </v><empty>  </empty></root>';
    for (const output of [xml.formatXml(input), xml.minifyXml(input)]) {
        const document = new DOMParser().parseFromString(output, 'application/xml');
        assert.equal(document.documentElement.getAttribute('label'), 'a  b');
        assert.equal(document.getElementsByTagName('p')[0].textContent, 'Hello world !');
        assert.equal(document.getElementsByTagName('raw')[0].firstChild.nodeType, 4);
        assert.equal(document.getElementsByTagName('raw')[0].textContent, 'a  b');
        assert.equal(document.getElementsByTagName('v')[0].textContent, ' a   b ');
        assert.equal(document.getElementsByTagName('empty')[0].textContent, '  ');
    }
});

test('preserves namespaces and literal declaration text without loading DTDs', () => {
    const input = '<r xmlns:x="urn:example"><x:item value="a > b &amp; c"/></r>';
    assert.equal(xml.validateXml(xml.formatXml(input)), true);
    assert.equal(xml.validateXml('<r><![CDATA[<!DOCTYPE example>]]></r>'), true);
    for (const input of [
        '<root id=1/>', '<root id="1" id="2"/>', '<root/><other/>',
        '<root>&missing;</root>', '<!DOCTYPE root SYSTEM "https://example.invalid/dtd"><root/>',
    ]) assert.throws(() => xml.validateXml(input), SyntaxError, input);
});
