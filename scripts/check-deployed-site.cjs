const { TOOL_IDS, TOOL_REGISTRY } = require('./tool-registry.cjs');
const games = require('../data/games.json');
const { DEMO_REGISTRY } = require('./demo-registry.cjs');

const checks = [
    { path: '/', status: 200, html: true, language: 'zh-cn' },
    { path: '/en/', status: 200, html: true, language: 'en' },
    { path: '/archives/', status: 200, html: true, language: 'zh-cn' },
    { path: '/en/archives/', status: 200, html: true, language: 'en' },
    { path: '/demos/', status: 200, html: true, language: 'zh-cn', demoCatalog: true },
    { path: '/en/demos/', status: 200, html: true, language: 'en', demoCatalog: true },
    ...createDemoChecks(),
    { path: '/search/', status: 404 },
    { path: '/en/search/', status: 404 },
    { path: '/search/index.json', status: 404 },
    { path: '/en/search/index.json', status: 404 },
    { path: '/privacy/', status: 200, html: true, language: 'zh-cn' },
    { path: '/en/privacy/', status: 200, html: true, language: 'en' },
    { path: '/tools/', status: 200, html: true, language: 'zh-cn' },
    { path: '/en/tools/', status: 200, html: true, language: 'en' },
    { path: '/links/', status: 200, html: true, language: 'zh-cn' },
    { path: '/en/links/', status: 200, html: true, language: 'en' },
    { path: '/about/', status: 200, html: true, language: 'zh-cn' },
    { path: '/en/about/', status: 200, html: true, language: 'en' },
    { path: '/series/', status: 200, html: true, language: 'zh-cn' },
    { path: '/en/series/', status: 200, html: true, language: 'en' },
    { path: '/series/openclaw/', status: 200, html: true, language: 'zh-cn' },
    { path: '/en/series/openclaw/', status: 200, html: true, language: 'en' },
    { path: '/index.xml', status: 200, rss: true },
    { path: '/en/index.xml', status: 200, rss: true },
    { path: '/favicon.png', status: 200 },
    { path: '/signature.svg', status: 200 },
    { path: '/img/github-mark.svg', status: 200 },
    { path: '/archives/index.json', status: 200, jsonArray: true },
    { path: '/en/archives/index.json', status: 200, jsonArray: true },
    { path: '/robots.txt', status: 200 },
    { path: '/sitemap.xml', status: 200 },
    { path: '/sw.js', status: 200 },
    { path: '/offline.html', status: 200 },
    // GitHub Pages consumes CNAME for routing but does not guarantee exposing it
    // as a public response. The build-output check validates the source artifact.
    { path: '/manifest.webmanifest', status: 404 },
    { path: '/img/app-icon.svg', status: 404 },
    { path: '/index.json', status: 404 },
    { path: '/en/index.json', status: 404 },
];

for (const script of [
    'CleanupOpenClawForWindows.ps1',
    'CleanupOpenClawForLinux.sh',
    'CleanupOpenClawForMacOS.sh',
]) {
    checks.push({ path: `/post/openclaw-uninstall/${script}`, status: 200, resource: true });
}

for (const toolId of TOOL_IDS) {
    checks.push({ path: `/tools/${toolId}/`, status: 200, html: true, language: 'zh-cn', toolId });
    checks.push({ path: `/en/tools/${toolId}/`, status: 200, html: true, language: 'en', toolId });
}

for (const language of ['zh-cn', 'en']) {
    const prefix = language === 'en' ? '/en' : '';
    for (const slug of ['python-environment-mismatch', 'openclaw-troubleshooting', 'reaction-timing']) {
        checks.push({ path: `${prefix}/p/${slug}/`, status: 200, html: true, language });
    }
    checks.push({ path: `${prefix}/games/`, status: 200, html: true, language, gameCatalog: true });
    for (const game of games) checks.push({ path: `${prefix}/games/${game.id}/`, status: 200, html: true, language, gameId: game.id });
}

for (const check of checks) {
    if (check.html) {
        check.analytics = true;
        check.provenance = true;
    }
}

function normalizeBaseUrl(value) {
    if (!value) {
        throw new Error('site URL is required; pass it as SITE_URL or the first argument');
    }

    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error(`unsupported site URL protocol: ${url.protocol}`);
    }

    url.pathname = url.pathname.replace(/\/+$/, '') + '/';
    url.search = '';
    url.hash = '';
    return url;
}

function endpointUrl(baseUrl, relativePath) {
    return new URL(relativePath.replace(/^\/+/, ''), baseUrl).toString();
}

function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function extractTags(body, tagName) {
    return [...body.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function extractAttributes(tag) {
    const attributes = {};
    for (const match of tag.matchAll(/([A-Za-z_:][-A-Za-z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
        attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
    }
    return attributes;
}

function findTag(body, tagName, predicate) {
    return extractTags(body, tagName).map(extractAttributes).find(predicate) ?? null;
}

function createDemoChecks(registry = DEMO_REGISTRY) {
    return registry.flatMap((demo) => [
        ...demo.checks.pages.map((page) => ({
            path: `/${demo.path}${page}`,
            status: 200,
            demoHtml: true,
            demo,
            demoNavigation: page === '' ? demo.checks.navigation : [],
            requiredText: page === '' ? demo.checks.requiredText : [],
        })),
        ...demo.checks.assets.map((asset) => ({ path: `/${demo.path}${asset}`, status: 200, resource: true })),
        { path: `/${demo.preview.image}`, status: 200, resource: true },
    ]);
}

function resolveSiteBase(check, pageUrl, options = {}) {
    if (options.baseUrl) return normalizeBaseUrl(options.baseUrl);
    if (!pageUrl) return normalizeBaseUrl('https://demo.invalid/');
    const url = new URL(pageUrl);
    const route = check.path?.replace(/^\/+/, '');
    url.pathname = route && url.pathname.endsWith(route)
        ? url.pathname.slice(0, -route.length) : '/';
    return normalizeBaseUrl(url.toString());
}

function validateDemoCatalog(body, pageUrl, language, baseUrl = null, registry = DEMO_REGISTRY) {
    const errors = [];
    const siteBase = resolveSiteBase({ path: language === 'en' ? '/en/demos/' : '/demos/' }, pageUrl, { baseUrl });
    const links = collectLocalLinkUrls(pageUrl, body);
    const images = extractTags(body, 'img').map(extractAttributes);
    for (const demo of registry) {
        const target = new URL(demo.path, siteBase);
        if (!links.some((link) => new URL(link).pathname === target.pathname)) errors.push(`missing demo link: ${demo.id}`);
        const title = demo.copy[language].title;
        const escapedTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&#34;').replace(/'/g, '&#39;');
        const text = body.replace(/<[^>]*>/g, '');
        if (!text.includes(title) && !text.includes(escapedTitle)) errors.push(`missing demo title: ${demo.id}`);
        const preview = new URL(demo.preview.image, siteBase).toString();
        if (!images.some((image) => {
            try { return image.src && new URL(image.src, pageUrl).toString() === preview; }
            catch { return false; }
        })) errors.push(`missing demo preview: ${demo.id}`);
    }
    return errors;
}

function srcsetUrls(value) {
    const urls = [];
    let position = 0;
    while (position < value.length) {
        while (position < value.length && /[\s,]/.test(value[position])) position += 1;
        const start = position;
        while (position < value.length && !/\s/.test(value[position])) position += 1;
        const token = value.slice(start, position);
        if (!token) break;
        // URL tokens may contain commas (including data URLs). Only trailing
        // commas separate a URL without descriptors from the next candidate.
        urls.push(token.replace(/,+$/, ''));
        if (token.endsWith(',')) continue;
        while (position < value.length && value[position] !== ',') position += 1;
        position += 1;
    }
    return urls;
}

function collectLocalAssetUrls(pageUrl, body) {
    const assets = new Set();
    const origin = new URL(pageUrl).origin;
    function add(raw) {
        if (!raw || /^(?:data|blob|mailto|javascript):/i.test(raw)) return;
        try {
            const url = new URL(raw, pageUrl);
            if (url.origin === origin) assets.add(url.toString());
        } catch {
            // Invalid URLs are reported by the page-specific metadata checks.
        }
    }
    for (const name of ['script', 'link', 'img', 'source', 'section', 'div']) {
        for (const tag of extractTags(body, name)) {
            const attributes = extractAttributes(tag);
            add(attributes['data-game-module'] ?? attributes['data-tool-worker'] ?? attributes.src ?? attributes.href);
            for (const raw of srcsetUrls(attributes.srcset || '')) add(raw);
        }
    }
    return [...assets];
}

function collectLocalLinkUrls(pageUrl, body) {
    const links = new Set();
    for (const tag of extractTags(body, 'a')) {
        const attributes = extractAttributes(tag);
        const raw = attributes.href;
        if (!raw || /^(?:data|blob|mailto|javascript|tel):/i.test(raw)) continue;
        try {
            const url = new URL(raw, pageUrl);
            if (url.origin !== new URL(pageUrl).origin) continue;
            url.hash = '';
            links.add(url.toString());
        } catch {
            // Invalid URLs are reported by the page-specific metadata checks.
        }
    }
    return [...links];
}

function validateResponse(check, status, body, pageUrl = null, options = {}) {
    const errors = [];
    if (status !== check.status) {
        errors.push(`expected HTTP ${check.status}, received ${status}`);
    }

    if (check.jsonArray && status === check.status) {
        try {
            const parsed = JSON.parse(body);
            if (!Array.isArray(parsed)) errors.push('expected a JSON array');
        } catch (error) {
            errors.push(`invalid JSON: ${error.message}`);
        }
    }

    if (check.rss && status === check.status && !/<rss\b[^>]*>[\s\S]*<channel>[\s\S]*<item>[\s\S]*<\/channel>\s*<\/rss>/i.test(body)) {
        errors.push('expected an RSS feed with article items');
    }

    if (check.exactText !== undefined && status === check.status && body.trim() !== check.exactText) {
        errors.push(`expected exact text ${JSON.stringify(check.exactText)}`);
    }
    if (check.containsText && status === check.status && !body.includes(check.containsText)) {
        errors.push(`missing expected text ${JSON.stringify(check.containsText)}`);
    }
    for (const text of check.requiredText ?? []) {
        if (status === check.status && !body.includes(text)) errors.push(`missing expected text ${JSON.stringify(text)}`);
    }

    // Standalone Hugo demos have their own layout, CSS, and metadata contract.
    if (check.demoHtml && status === check.status) {
        if (!/<html\b/i.test(body)) errors.push('expected an HTML document');
        if (!/<main\b/i.test(body)) errors.push('missing main landmark');
        if (!/<title\b[^>]*>[^<]+<\/title>/i.test(body)) errors.push('missing page title');
        if (/livereload/i.test(body)) errors.push('development livereload script is present');
        if (!check.demo) {
            errors.push('missing demo configuration');
        } else {
            const siteBase = resolveSiteBase(check, pageUrl, options);
            const url = pageUrl || endpointUrl(siteBase, check.path);
            const stylesheets = extractTags(body, 'link').map(extractAttributes)
                .filter((link) => link.rel?.toLowerCase().split(/\s+/).includes('stylesheet'));
            for (const asset of check.demo.checks.assets.filter((asset) => asset.endsWith('.css'))) {
                const expected = new URL(`${check.demo.path}${asset}`, siteBase).toString();
                if (!stylesheets.some((link) => {
                    try { return link.href && new URL(link.href, url).toString() === expected; }
                    catch { return false; }
                })) errors.push(`missing demo stylesheet: ${asset}`);
            }
            const links = collectLocalLinkUrls(url, body);
            for (const section of check.demoNavigation ?? []) {
                const expected = new URL(`${check.demo.path}${section}`, siteBase).pathname;
                if (!links.some((link) => new URL(link).pathname === expected)) {
                    errors.push(`missing ${section.replace(/\/$/, '')} navigation link`);
                }
            }
            const catalogPath = new URL('demos/', siteBase).pathname;
            const catalogLinks = extractTags(body, 'a').map(extractAttributes)
                .filter((link) => Object.hasOwn(link, 'data-demo-catalog'));
            if (!catalogLinks.length) errors.push('missing demo catalog return link');
            else if (catalogLinks.some((link) => link.href !== catalogPath)) errors.push(`demo catalog link must point to ${catalogPath}`);
        }
    }

    if (check.demoCatalog && status === check.status) {
        errors.push(...validateDemoCatalog(body, pageUrl, check.language, options.baseUrl));
    }

    if (check.html && status === check.status) {
        if (!/<html\b/i.test(body)) errors.push('expected an HTML document');
        if (!/<main\b/i.test(body)) errors.push('missing main landmark');
        const html = findTag(body, 'html', () => true);
        if (check.language && html?.lang !== check.language) {
            errors.push(`expected html lang ${check.language}, found ${html?.lang ?? 'missing'}`);
        }
        if (!/<title\b[^>]*>[^<]+<\/title>/i.test(body)) errors.push('missing page title');
        const description = findTag(body, 'meta', (attributes) => attributes.name?.toLowerCase() === 'description');
        if (!description?.content?.trim()) errors.push('missing meta description');
        const canonical = findTag(body, 'link', (attributes) => attributes.rel?.toLowerCase() === 'canonical');
        if (!canonical?.href) errors.push('missing canonical link');
        const expectedCanonical = pageUrl && options.canonicalOrigin
            ? endpointUrl(normalizeBaseUrl(options.canonicalOrigin), check.path)
            : pageUrl;
        if (expectedCanonical && canonical?.href !== expectedCanonical) errors.push(`canonical does not match ${expectedCanonical}`);
        const alternates = extractTags(body, 'link').map(extractAttributes)
            .filter((attributes) => attributes.rel?.toLowerCase() === 'alternate' && attributes.hreflang)
            .reduce((map, attributes) => map.set(attributes.hreflang.toLowerCase(), attributes.href), new Map());
        for (const language of ['zh-cn', 'en', 'x-default']) {
            if (!alternates.get(language)) errors.push(`missing hreflang alternate: ${language}`);
        }
        if (check.toolId && !new RegExp(`\\bid=(?:["']tool-${check.toolId}["']|tool-${check.toolId})(?:\\s|>)`, 'i').test(body)) {
            errors.push(`missing tool container: ${check.toolId}`);
        }
        if (check.toolId && !new RegExp(`/js/tools/${check.toolId}\\.[^"']+\\.js`, 'i').test(body)) {
            errors.push(`missing tool script: ${check.toolId}`);
        }
        if (check.toolId) {
            const requiredAssets = [check.toolId, 'clipboard', 'tool-ui', 'share'];
            const spec = TOOL_REGISTRY[check.toolId];
            if (spec?.worker) {
                const container = findTag(body, 'div', attributes => attributes.id === `tool-${check.toolId}`);
                if (!new RegExp(`^/js/tools/${check.toolId}-worker\\.[a-f0-9]{64}\\.js$`).test(container?.['data-tool-worker'] || '')) {
                    errors.push(`missing tool worker: ${check.toolId}`);
                }
                requiredAssets.push(`${check.toolId}-worker`);
            } else if (spec?.core) requiredAssets.push(`${check.toolId}-core`);
            for (const asset of requiredAssets) {
                if (!new RegExp(`/js/tools/${asset}\\.[^"']+\\.js`, 'i').test(body)) {
                    errors.push(`missing tool asset: ${asset}`);
                }
            }
        }
        if (check.gameId) {
            const game = findTag(body, 'section', attributes => attributes['data-game-id'] === check.gameId);
            if (game?.id !== `game-${check.gameId}`) errors.push(`missing game container: ${check.gameId}`);
            if (!new RegExp(`^/js/games/${check.gameId}\\.[a-f0-9]{64}\\.js$`).test(game?.['data-game-module'] || '')) errors.push(`missing local game module: ${check.gameId}`);
            if (game?.['data-clarity-mask'] !== 'true') errors.push('game region must be masked');
            if (/<iframe\b/i.test(body)) errors.push('game must run inline without an iframe');
            if (!/\/js\/games\/bootstrap\.[a-f0-9]{64}\.js/.test(body)) errors.push('missing game bootstrap');
        }
        if (check.gameCatalog) {
            if (!findTag(body, 'section', attributes => attributes.id === 'game-catalog')) errors.push('missing game catalog');
            if (!findTag(body, 'input', attributes => attributes.id === 'game-search' && attributes.type === 'search')) errors.push('missing game search input');
            if (!findTag(body, 'script', attributes => /^\/js\/game-catalog\.[a-f0-9]{64}\.js$/.test(attributes.src || ''))) errors.push('missing local game search script');
            if (/\/js\/games\//.test(body)) errors.push('catalog must not load game code');
        }
        if (check.analytics) {
            if (!/data-codeglimpse-analytics-config/i.test(body)) {
                errors.push('missing analytics configuration marker');
            }
            if (!/\/js\/analytics-privacy\.[^"']+\.js/i.test(body)) {
                errors.push('missing analytics privacy marker script');
            }
            if (!/id=(?:["']?)codeglimpse-privacy-notice(?:["']?)(?:\s|>)/i.test(body)) {
                errors.push('missing bilingual privacy notice');
            }
            if (options.expectClarity && !body.includes('occc2jaghm')) {
                errors.push('missing Microsoft Clarity project marker');
            }
        }
        if (check.provenance) {
            const source = findTag(body, 'meta', (attributes) => attributes.name === 'codeglimpse-source')?.content;
            if (!/^[a-f0-9]{40}$/i.test(source || '')) {
                errors.push('missing 40-character source marker');
            } else if (options.sourceCommit && source !== options.sourceCommit) {
                errors.push(`source marker does not match ${options.sourceCommit}`);
            }
        }
        if (!/<link\b[^>]*rel=(?:["']stylesheet["']|stylesheet)/i.test(body)) errors.push('missing stylesheet');
        if (!/\/js\/toast\.[^"']+\.js/i.test(body)) errors.push('missing global toast script');
        if (!/\/js\/workspace\.[^"']+\.js/i.test(body)) errors.push('missing local workspace script');
        if (/\/js\/pwa\.[^"']+\.js|manifest\.webmanifest|codeglimpse-install/i.test(body)) {
            errors.push('legacy PWA install artifact is still present');
        }
        if (/(?:src|href)=["']https?:\/\/[^"']*(?:signature\.svg|github\.githubassets\.com)/i.test(body)) {
            errors.push('page contains a disallowed external image asset');
        }
    }

    return errors;
}

async function checkEndpoint(baseUrl, check) {
    const url = endpointUrl(baseUrl, check.path);
    const attempts = Math.max(1, Number.parseInt(process.env.SITE_CHECK_RETRIES ?? '1', 10) || 1);
    const retryDelay = Math.max(0, Number.parseInt(process.env.SITE_CHECK_RETRY_DELAY_MS ?? '1000', 10) || 0);
    let lastResult = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const response = await fetch(url, {
                headers: { accept: 'text/html,application/json,application/xml,text/plain' },
                redirect: 'follow',
                signal: AbortSignal.timeout(15000),
            });
            const body = await response.text();
            const options = {
                baseUrl: baseUrl.toString(),
                expectClarity: process.env.SITE_EXPECT_CLARITY === 'true',
                sourceCommit: process.env.SITE_SOURCE_COMMIT?.trim() || '',
                canonicalOrigin: process.env.SITE_CANONICAL_ORIGIN?.trim() || '',
            };
            lastResult = {
                check,
                url,
                status: response.status,
                body,
                assets: (check.html || check.demoHtml) && response.status === check.status
                    ? [...collectLocalAssetUrls(url, body), ...collectLocalLinkUrls(url, body)]
                    : [],
                errors: validateResponse(check, response.status, body, url, options),
            };
        } catch (error) {
            lastResult = { check, url, status: null, errors: [error.message] };
        }

        if (lastResult.errors.length === 0 || attempt === attempts) return lastResult;
        await delay(retryDelay);
    }

    return lastResult;
}

async function main() {
    const baseUrl = normalizeBaseUrl(process.env.SITE_URL || process.argv[2]);
    const results = await Promise.all(checks.map((check) => checkEndpoint(baseUrl, check)));
    const assets = [...new Set(results.flatMap((result) => result.assets ?? []))].map((url) => ({
        path: url,
        status: 200,
        resource: true,
    }));
    const assetResults = await Promise.all(assets.map((check) => checkEndpoint(baseUrl, check)));
    const allResults = [...results, ...assetResults];
    const failures = allResults.filter((result) => result.errors.length > 0);

    for (const result of allResults) {
        const status = result.status === null ? 'error' : `HTTP ${result.status}`;
        const outcome = result.errors.length === 0 ? 'passed' : 'failed';
        console.log(`${outcome}: ${result.check.path} -> ${status}`);
        for (const error of result.errors) console.error(`  ${error}`);
    }

    if (failures.length > 0) {
        console.error(`Deployed site check failed: ${failures.length} endpoint(s)`);
        process.exit(1);
    }

    console.log(`Deployed site check passed: ${results.length} endpoints and ${assetResults.length} local assets at ${baseUrl}`);
}

if (require.main === module) {
    main().catch((error) => {
        console.error(`Deployed site check failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    checks,
    collectLocalAssetUrls,
    collectLocalLinkUrls,
    createDemoChecks,
    endpointUrl,
    extractAttributes,
    findTag,
    normalizeBaseUrl,
    validateDemoCatalog,
    validateResponse,
};
