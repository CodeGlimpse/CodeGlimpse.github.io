const test = require('node:test');
const assert = require('node:assert/strict');

const checker = require('../scripts/check-deployed-site.cjs');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');

test('normalizes site URLs and resolves endpoint paths', () => {
    const baseUrl = checker.normalizeBaseUrl('https://example.com/site///');
    assert.equal(baseUrl.toString(), 'https://example.com/site/');
    assert.equal(checker.endpointUrl(baseUrl, '/tools/json/'), 'https://example.com/site/tools/json/');
});

test('validates expected success responses and JSON arrays', () => {
    const errors = checker.validateResponse(
        { path: '/archives/index.json', status: 200, jsonArray: true },
        200,
        '[{"title":"JSON"}]',
    );
    assert.deepEqual(errors, []);
});

test('rejects successful error pages and empty documents at RSS endpoints', () => {
    const check = { path: '/index.xml', status: 200, rss: true };
    assert.deepEqual(checker.validateResponse(check, 200, '<rss version="2.0"><channel><item><title>A</title></item></channel></rss>'), []);
    for (const body of ['<html><body>Temporarily unavailable</body></html>', '<rss><channel></channel></rss>', '']) {
        assert.deepEqual(checker.validateResponse(check, 200, body), ['expected an RSS feed with article items']);
    }
});

test('requires source provenance only for production HTML checks', () => {
    const page = '<html lang="zh-cn"><head><title>T</title><meta name="description" content="T"><link rel="canonical" href="https://example.com/"><link rel="alternate" hreflang="zh-cn" href="https://example.com/"><link rel="alternate" hreflang="en" href="https://example.com/en/"><link rel="alternate" hreflang="x-default" href="https://example.com/"><link rel="stylesheet" href="/style.css"><script src="/js/toast.a.js"></script><script src="/js/workspace.b.js"></script></head><body><main><script data-codeglimpse-analytics-config src="/js/analytics.c.js"></script><script src="/js/analytics-privacy.d.js"></script><div id="codeglimpse-privacy-notice"></div></main></body></html>';
    const productionErrors = checker.validateResponse({ path: '/', status: 200, html: true, provenance: true }, 200, page, 'https://example.com/');
    assert.deepEqual(productionErrors, ['missing 40-character source marker']);
    assert.deepEqual(checker.validateResponse({ path: '/', status: 200, html: true }, 200, page, 'https://example.com/'), []);
});

test('does not require GitHub Pages to expose the consumed CNAME file', () => {
    assert.equal(checker.checks.some((check) => check.path === '/CNAME'), false);
});

test('publishes both language routes for every registered tool', () => {
    const toolChecks = checker.checks.filter((check) => check.toolId);
    assert.equal(toolChecks.length, require('../scripts/tool-registry.cjs').TOOL_IDS.length * 2);
    assert.ok(toolChecks.every((check) => check.status === 200 && check.html));
});

test('worker-backed QR pages require a local worker rather than a duplicate main-thread core', () => {
    const worker = '/js/tools/qrcode-worker.' + 'a'.repeat(64) + '.js';
    const html = `<html><head><title>QR</title><link rel="stylesheet" href="/style.css"><meta name="description" content="QR tool"><link rel="canonical" href="https://example.com/tools/qrcode/"><link rel="alternate" hreflang="zh-cn" href="/tools/qrcode/"><link rel="alternate" hreflang="en" href="/en/tools/qrcode/"><link rel="alternate" hreflang="x-default" href="/tools/qrcode/"></head><body><main><div id="tool-qrcode" data-tool-worker="${worker}"></div></main>${['qrcode', 'clipboard', 'tool-ui', 'share'].map(id => `<script src="/js/tools/${id}.abc.js"></script>`).join('')}<script src="/js/toast.abc.js"></script><script src="/js/workspace.abc.js"></script></body></html>`;
    const check = { path: '/tools/qrcode/', status: 200, html: true, toolId: 'qrcode' };
    assert.deepEqual(checker.validateResponse(check, 200, html, 'https://example.com/tools/qrcode/'), []);
    assert.ok(checker.collectLocalAssetUrls('https://example.com/tools/qrcode/', html).includes('https://example.com' + worker));
    assert.ok(checker.validateResponse(check, 200, html.replace(worker, 'https://external.example/worker.js')).includes('missing tool worker: qrcode'));
});

test('checks inline games and discovers their lazy modules without executing them', () => {
    const hash = 'a'.repeat(64);
    const modulePath = `/js/games/memory.${hash}.js`;
    const body = `<html><head><title>Memory</title><meta name="description" content="Game"><link rel="canonical" href="https://example.com/games/memory/"><link rel="alternate" hreflang="zh-cn" href="https://example.com/games/memory/"><link rel="alternate" hreflang="en" href="https://example.com/en/games/memory/"><link rel="alternate" hreflang="x-default" href="https://example.com/games/memory/"><link rel="stylesheet" href="/style.css"></head><body><main><section id="game-memory" data-game-id="memory" data-game-module="${modulePath}" data-clarity-mask="true"></section></main><script src="/js/toast.a.js"></script><script src="/js/workspace.a.js"></script><script src="/js/games/bootstrap.${hash}.js"></script></body></html>`;
    const check = { path:'/games/memory/', status:200, html:true, gameId:'memory' };
    assert.deepEqual(checker.validateResponse(check,200,body,'https://example.com/games/memory/'),[]);
    assert.ok(checker.collectLocalAssetUrls('https://example.com/games/memory/',body).includes(`https://example.com${modulePath}`));
    assert.ok(checker.validateResponse(check,200,body.replace('</main>','<iframe></iframe></main>')).includes('game must run inline without an iframe'));
    assert.ok(checker.validateResponse(check,200,body.replace(modulePath,'https://outside.example/game.js')).includes('missing local game module: memory'));
});

test('checks the catalog filter while rejecting early game loading and an external filter', () => {
    const hash = 'a'.repeat(64);
    const script = '/js/game-catalog.' + hash + '.js';
    const body = '<html><head><title>Games</title><meta name="description" content="Games"><link rel="canonical" href="https://example.com/games/"><link rel="alternate" hreflang="zh-cn" href="https://example.com/games/"><link rel="alternate" hreflang="en" href="https://example.com/en/games/"><link rel="alternate" hreflang="x-default" href="https://example.com/games/"><link rel="stylesheet" href="/style.css"></head><body><main><input id="game-search" type="search"><section id="game-catalog"></section></main><script src="/js/toast.a.js"></script><script src="/js/workspace.a.js"></script><script src="' + script + '"></script></body></html>';
    const check = { path: '/games/', status: 200, html: true, gameCatalog: true };
    assert.deepEqual(checker.validateResponse(check, 200, body, 'https://example.com/games/'), []);
    assert.ok(checker.validateResponse(check, 200, body.replace('id="game-search"', 'id="missing"')).includes('missing game search input'));
    assert.ok(checker.validateResponse(check, 200, body.replace(script, 'https://outside.example' + script)).includes('missing local game search script'));
    assert.ok(checker.validateResponse(check, 200, body.replace('</main>', '<script src="/js/games/snake.js"></script></main>')).includes('catalog must not load game code'));
});

test('validates HTML landmarks and tool containers', () => {
    const page = '<html lang="zh-cn"><head><title>JSON</title><meta name="description" content="Tool"><link rel="canonical" href="https://example.com/tools/json/"><link rel="alternate" hreflang="zh-cn" href="https://example.com/tools/json/"><link rel="alternate" hreflang="en" href="https://example.com/en/tools/json/"><link rel="alternate" hreflang="x-default" href="https://example.com/tools/json/"><link rel="stylesheet" href="/style.css"><script src="/js/toast.abc.js"></script><script src="/js/workspace.ghi.js"></script></head><body><main><div id="tool-json"></div><script src="/js/tools/json.abc.js"></script><script src="/js/tools/clipboard.def.js"></script><script src="/js/tools/tool-ui.ghi.js"></script><script src="/js/tools/share.jkl.js"></script></main></body></html>';
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
    const page = '<html lang="en"><head><title>Tool</title><meta name="description" content="Tool"><link rel="canonical" href="https://example.com/en/tools/json/"><link rel="alternate" hreflang="zh-cn" href="https://example.com/tools/json/"><link rel="alternate" hreflang="en" href="https://example.com/en/tools/json/"><link rel="alternate" hreflang="x-default" href="https://example.com/en/tools/json/"><link rel="stylesheet" href="/style.css"><script src="/js/toast.abc.js"></script><script src="/js/workspace.ghi.js"></script></head><body><main><img src="/img/icon.svg"><script src="/js/tools/json.abc.js"></script><script src="/js/tools/clipboard.def.js"></script><script src="/js/tools/tool-ui.ghi.js"></script><script src="/js/tools/share.jkl.js"></script></main></body></html>';
    const pageWithMissingContainer = page.replace('<img src="/img/icon.svg">', '<div id="tool-json"></div><img src="/img/icon.svg">');
    assert.deepEqual(
        checker.validateResponse({ path: '/en/tools/json/', status: 200, html: true, language: 'en', toolId: 'json' }, 200, pageWithMissingContainer, 'http://127.0.0.1:4173/en/tools/json/', { canonicalOrigin: 'https://example.com' }),
        [],
    );
    assert.deepEqual(
        checker.collectLocalAssetUrls('https://example.com/en/tools/json/', page).sort(),
        [
            'https://example.com/en/tools/json/',
            'https://example.com/img/icon.svg',
            'https://example.com/js/toast.abc.js',
            'https://example.com/js/workspace.ghi.js',
            'https://example.com/js/tools/clipboard.def.js',
            'https://example.com/js/tools/json.abc.js',
            'https://example.com/js/tools/share.jkl.js',
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

test('discovers every local responsive candidate in source and img srcsets', () => {
    const pageUrl = 'https://example.test/review/demos/photo-portfolio/';
    const body = `<picture>
        <source srcset="images/small.jpg 640w,images/large.jpg 1440w, https://external.test/photo.jpg 2x">
        <img src="images/original.png" srcset="images/small.jpg 1x, images/retina.jpg 2x">
        </picture><img srcset="data:image/png;base64,AAAA 1x, images/retina.jpg 2x">
        <img src="data:image/svg+xml,a"><source srcset="//external.test/other.jpg 800w">`;
    assert.deepEqual(checker.collectLocalAssetUrls(pageUrl, body).sort(), [
        'images/small.jpg', 'images/large.jpg', 'images/original.png', 'images/retina.jpg',
    ].map(asset => new URL(asset, pageUrl).toString()).sort());
});

test('validates photography landmarks, navigation and demo disclosures', () => {
    const check = checker.checks.find((check) => check.path === '/demos/photo-portfolio/' && check.demoHtml);
    const pageUrl = 'https://example.test/demos/photo-portfolio/';
    const body = `<html><head><title>Demo</title><link rel="stylesheet" href="/demos/photo-portfolio/css/site.css"><link rel="stylesheet" href="/demos/photo-portfolio/css/demo-templates.css"></head><body><main>${check.requiredText.join(' · ')}<a href="works/">Works</a><a href="about/">About</a><a data-demo-catalog href="/demos/">All demos</a></main></body></html>`;
    assert.deepEqual(checker.validateResponse(check, 200, body, pageUrl), []);
    assert.ok(checker.validateResponse(check, 200, body.replace('href="about/"', 'href="missing/"'), pageUrl).includes('missing about navigation link'));
    assert.ok(checker.validateResponse(check, 200, body.replace(check.requiredText[0], ''), pageUrl).some(error => error.includes(check.requiredText[0])));
    assert.ok(checker.validateResponse(check, 200, body.replace('site.css', 'missing.css'), pageUrl).includes('missing demo stylesheet: css/site.css'));
});

test('registers every demo page, preview and asset with its homepage contract', () => {
    for (const demo of DEMO_REGISTRY) {
        for (const page of demo.checks.pages) {
            assert.ok(checker.checks.some((check) => check.demoHtml && check.demo.id === demo.id && check.path === `/${demo.path}${page}`));
        }
        for (const asset of [...demo.checks.assets.map((asset) => `${demo.path}${asset}`), demo.preview.image]) {
            assert.ok(checker.checks.some((check) => check.path === `/${asset}` && check.status === 200 && check.resource));
        }
        const home = checker.checks.find((check) => check.demoHtml && check.path === `/${demo.path}`);
        assert.deepEqual(home.requiredText, demo.checks.requiredText);
        assert.deepEqual(home.demoNavigation, demo.checks.navigation);
    }
});

test('uses the registered stylesheet and navigation for an additional demo and URL prefix', () => {
    const demo = {
        ...DEMO_REGISTRY[0],
        id: 'drawing-portfolio',
        path: 'demos/drawing-portfolio/',
        checks: {
            pages: ['', 'collection/'],
            assets: ['assets/layout.css'],
            requiredText: ['独立示例'],
            navigation: ['collection/'],
        },
    };
    const check = checker.createDemoChecks([demo]).find((check) => check.demoHtml && check.path === `/${demo.path}`);
    const pageUrl = 'https://example.test/review/demos/drawing-portfolio/';
    const catalogLink = '<a data-demo-catalog href="/review/demos/">返回目录</a>';
    const body = `<html><head><title>Drawing</title><link rel="stylesheet" href="/review/demos/drawing-portfolio/assets/layout.css"></head><body><main>独立示例<a href="collection/">Collection</a>${catalogLink}</main></body></html>`;
    assert.deepEqual(checker.validateResponse(check, 200, body, pageUrl), []);
    assert.ok(checker.validateResponse(check, 200, '', pageUrl).includes('expected an HTML document'));
    assert.deepEqual(checker.validateResponse(check, 200, body.replace('href="/review/demos/"', 'href=/review/demos/'), pageUrl), []);
    assert.ok(checker.validateResponse(check, 200, body.replace('assets/layout.css', 'css/site.css'), pageUrl).includes('missing demo stylesheet: assets/layout.css'));
    assert.ok(checker.validateResponse(check, 200, body.replace('href="collection/"', 'href="works/"'), pageUrl).includes('missing collection navigation link'));
    for (const replacement of [
        '<a data-demo-catalog href="/demos/">返回目录</a>',
        '<a data-demo-catalog href="../">返回目录</a>',
        '<a data-demo-catalog href="/review/demos/?preview=1">返回目录</a>',
        '<a href="/review/demos/">返回目录</a>',
        '<img data-demo-catalog src="/review/demos/" alt="目录">',
        '',
    ]) {
        assert.ok(checker.validateResponse(check, 200, body.replace(catalogLink, replacement), pageUrl).some((error) => error.includes('catalog')));
    }
});

test('checks bilingual catalog links, titles and previews from the registry', () => {
    for (const language of ['zh-cn', 'en']) {
        const pageUrl = `https://example.test/review/${language === 'en' ? 'en/' : ''}demos/`;
        const body = DEMO_REGISTRY.map((demo) => `<a href="/review/${demo.path}"><h2>${demo.copy[language].title}</h2><img src="/review/${demo.preview.image}" alt="Preview"></a>`).join('');
        assert.deepEqual(checker.validateDemoCatalog(body, pageUrl, language), []);
        const demo = DEMO_REGISTRY[0];
        assert.ok(checker.validateDemoCatalog(body.replace(`href="/review/${demo.path}"`, 'href="/review/demos/missing/"'), pageUrl, language).includes(`missing demo link: ${demo.id}`));
        assert.ok(checker.validateDemoCatalog(body.replace(demo.copy[language].title, 'Missing title'), pageUrl, language).includes(`missing demo title: ${demo.id}`));
        assert.ok(checker.validateDemoCatalog(body.replace(`src="/review/${demo.preview.image}"`, 'src="/review/img/missing.jpg"'), pageUrl, language).includes(`missing demo preview: ${demo.id}`));
    }
});

test('preserves commas inside srcset URLs and skips embedded data URLs', () => {
    const body = '<source srcset="/images/a,b.jpg 640w, /images/large.jpg 1440w"><img srcset="data:image/png;base64,AAAA, /images/fallback.jpg"><img srcset="/images/one.jpg, /images/two.jpg 2x">';
    assert.deepEqual(checker.collectLocalAssetUrls('https://example.test/', body).sort(), [
        '/images/a,b.jpg', '/images/large.jpg', '/images/fallback.jpg', '/images/one.jpg', '/images/two.jpg',
    ].map(asset => `https://example.test${asset}`).sort());
});

test('requires the portfolio demo marker in the deployed HTML', () => {
    const check = { path: '/demos/creator-portfolio/', status: 200, containsText: '虚构演示' };
    assert.deepEqual(checker.validateResponse(check, 200, '<html>虚构演示</html>'), []);
    assert.deepEqual(checker.validateResponse(check, 200, '<html>Not Found</html>'),
        ['missing expected text "虚构演示"']);
});

test('reports invalid status and JSON payloads', () => {
    const errors = checker.validateResponse(
        { path: '/archives/index.json', status: 200, jsonArray: true },
        500,
        '{invalid',
    );
    assert.deepEqual(errors, ['expected HTTP 200, received 500']);

    const jsonErrors = checker.validateResponse(
        { path: '/archives/index.json', status: 200, jsonArray: true },
        200,
        '{invalid',
    );
    assert.match(jsonErrors[0], /^invalid JSON:/);
});
