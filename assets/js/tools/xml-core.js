(function (root, factory) {
    const api = factory(require('@xmldom/xmldom'));
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseXml = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (xml) {
    // The parser is bundled locally. DTDs are rejected before parsing.
    // License text is published at /licenses.txt.
    function parseXml(input) {
        const source = String(input ?? '');
        const declarations = source.match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE\b/gi) || [];
        if (declarations.some((token) => /^<!DOCTYPE\b/i.test(token))) {
            throw new SyntaxError('DOCTYPE declarations and external entities are not supported');
        }
        try {
            const document = new xml.DOMParser({
                onError(_level, message) { throw new SyntaxError(message); },
            }).parseFromString(source, 'application/xml');
            if (!document.documentElement) throw new SyntaxError('XML must contain one root element');
            return document;
        } catch (error) {
            throw new SyntaxError('Invalid XML: ' + error.message);
        }
    }

    function validateXml(input) {
        parseXml(input);
        return true;
    }

    function arrangeElement(element, pretty, padding, depth = 0) {
        const children = Array.from(element.childNodes);
        // An inherited preserve region or any mixed text content is left intact,
        // including descendants, so formatting cannot change its text value.
        if (element.getAttribute('xml:space') === 'preserve'
            || children.some((node) => node.nodeType === 4 || (node.nodeType === 3 && /\S/.test(node.data)))) return;
        if (!children.some((node) => node.nodeType === 1)) return;
        for (const child of children) {
            if (child.nodeType === 3 && !/\S/.test(child.data)) element.removeChild(child);
        }
        for (const child of Array.from(element.childNodes)) {
            if (child.nodeType === 1) arrangeElement(child, pretty, padding, depth + 1);
            if (pretty) element.insertBefore(element.ownerDocument.createTextNode('\n' + padding.repeat(depth + 1)), child);
        }
        if (pretty) element.appendChild(element.ownerDocument.createTextNode('\n' + padding.repeat(depth)));
    }

    function serialize(input, pretty, indent = 2) {
        const width = Number(indent);
        if (!Number.isInteger(width) || width < 1 || width > 8) {
            throw new RangeError('XML indentation must be between 1 and 8 spaces');
        }
        const document = parseXml(input);
        arrangeElement(document.documentElement, pretty, ' '.repeat(width));
        for (const child of Array.from(document.childNodes)) {
            if (child.nodeType === 3 && !/\S/.test(child.data)) document.removeChild(child);
        }
        if (pretty) {
            for (const child of Array.from(document.childNodes).slice(1)) {
                document.insertBefore(document.createTextNode('\n'), child);
            }
        }
        return new xml.XMLSerializer().serializeToString(document);
    }

    function formatXml(input, indent = 2) {
        return serialize(input, true, indent);
    }

    function minifyXml(input) {
        return serialize(input, false);
    }

    return { formatXml, minifyXml, validateXml };
});
