const test = require('node:test');
const assert = require('node:assert/strict');

const checker = require('../scripts/check-deployed-site.cjs');

test('normalizes site URLs and resolves endpoint paths', () => {
    const baseUrl = checker.normalizeBaseUrl('https://example.com/site///');
    assert.equal(baseUrl.toString(), 'https://example.com/site/');
    assert.equal(checker.endpointUrl(baseUrl, '/tools/json/'), 'https://example.com/site/tools/json/');
});

test('validates expected success responses and JSON arrays', () => {
    const errors = checker.validateResponse(
        { path: '/search/index.json', status: 200, jsonArray: true },
        200,
        '[{"title":"JSON"}]',
    );
    assert.deepEqual(errors, []);
});

test('publishes both language routes for every registered tool', () => {
    const toolChecks = checker.checks.filter((check) => check.toolId);
    assert.equal(toolChecks.length, 44);
    assert.ok(toolChecks.every((check) => check.status === 200 && check.html));
});

test('validates HTML landmarks and tool containers', () => {
    const page = '<html lang="zh-cn"><head><title>JSON</title><meta name="description" content="Tool"><link rel="canonical" href="https://example.com/tools/json/"><link rel="alternate" hreflang="zh-cn" href="https://example.com/tools/json/"><link rel="alternate" hreflang="en" href="https://example.com/en/tools/json/"><link rel="alternate" hreflang="x-default" href="https://example.com/tools/json/"><link rel="stylesheet" href="/style.css"></head><body><main><div id="tool-json"></div><script src="/js/tools/json.abc.js"></script><script src="/js/tools/clipboard.def.js"></script><script src="/js/tools/tool-ui.ghi.js"></script></main></body></html>';
    assert.deepEqual(
        checker.validateResponse(
            { path: '/tools/json/', status: 200, html: true, toolId: 'json' },
            200,
            page,
        ),
        [],
    );
    assert.deepEqual(
        checker.validateResponse(
            { path: '/tools/json/', status: 200, html: true, toolId: 'json' },
            200,
            page.replace('<div id="tool-json"></div>', ''),
        ),
        ['missing tool container: json'],
    );
});

test('validates tool metadata and discovers local assets', () => {
    const page = '<html lang="en"><head><title>Tool</title><meta name="description" content="Tool"><link rel="canonical" href="https://example.com/en/tools/json/"><link rel="alternate" hreflang="zh-cn" href="https://example.com/tools/json/"><link rel="alternate" hreflang="en" href="https://example.com/en/tools/json/"><link rel="alternate" hreflang="x-default" href="https://example.com/tools/json/"><link rel="stylesheet" href="/style.css"></head><body><main><img src="/img/icon.svg"><script src="/js/tools/json.abc.js"></script><script src="/js/tools/clipboard.def.js"></script><script src="/js/tools/tool-ui.ghi.js"></script></main></body></html>';
    const pageWithMissingContainer = page.replace('<img src="/img/icon.svg">', '<div id="tool-json"></div><img src="/img/icon.svg">');
    assert.deepEqual(
        checker.validateResponse({ path: '/en/tools/json/', status: 200, html: true, language: 'en', toolId: 'json' }, 200, pageWithMissingContainer, 'https://example.com/en/tools/json/'),
        [],
    );
    assert.deepEqual(
        checker.collectLocalAssetUrls('https://example.com/en/tools/json/', page).sort(),
        [
            'https://example.com/en/tools/json/',
            'https://example.com/img/icon.svg',
            'https://example.com/js/tools/clipboard.def.js',
            'https://example.com/js/tools/json.abc.js',
            'https://example.com/js/tools/tool-ui.ghi.js',
            'https://example.com/style.css',
            'https://example.com/tools/json/',
        ].sort(),
    );
});

test('accepts the intentional homepage JSON 404', () => {
    const errors = checker.validateResponse({ path: '/index.json', status: 404 }, 404, 'Not Found');
    assert.deepEqual(errors, []);
});

test('reports invalid status and JSON payloads', () => {
    const errors = checker.validateResponse(
        { path: '/search/index.json', status: 200, jsonArray: true },
        500,
        '{invalid',
    );
    assert.deepEqual(errors, ['expected HTTP 200, received 500']);

    const jsonErrors = checker.validateResponse(
        { path: '/search/index.json', status: 200, jsonArray: true },
        200,
        '{invalid',
    );
    assert.match(jsonErrors[0], /^invalid JSON:/);
});
