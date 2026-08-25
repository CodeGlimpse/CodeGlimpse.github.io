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
    assert.equal(toolChecks.length, 32);
    assert.ok(toolChecks.every((check) => check.status === 200 && check.html));
});

test('validates HTML landmarks and tool containers', () => {
    assert.deepEqual(
        checker.validateResponse(
            { path: '/tools/json/', status: 200, html: true, toolId: 'json' },
            200,
            '<html><main><div id="tool-json"></div></main></html>',
        ),
        [],
    );
    assert.deepEqual(
        checker.validateResponse(
            { path: '/tools/json/', status: 200, html: true, toolId: 'json' },
            200,
            '<html><main></main></html>',
        ),
        ['missing tool container: json'],
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
