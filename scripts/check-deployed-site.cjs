const { TOOL_IDS, TOOL_REGISTRY } = require('./tool-registry.cjs');

const checks = [
    { path: '/', status: 200, html: true, language: 'zh-cn' },
    { path: '/en/', status: 200, html: true, language: 'en' },
    { path: '/tools/', status: 200, html: true, language: 'zh-cn' },
    { path: '/en/tools/', status: 200, html: true, language: 'en' },
    { path: '/links/', status: 200, html: true, language: 'zh-cn' },
    { path: '/en/links/', status: 200, html: true, language: 'en' },
    { path: '/favicon.png', status: 200 },
    { path: '/signature.svg', status: 200 },
    { path: '/img/github-mark.svg', status: 200 },
    { path: '/search/index.json', status: 200, jsonArray: true },
    { path: '/en/search/index.json', status: 200, jsonArray: true },
    { path: '/robots.txt', status: 200 },
    { path: '/sitemap.xml', status: 200 },
    { path: '/sw.js', status: 200 },
    { path: '/offline.html', status: 200 },
    { path: '/manifest.webmanifest', status: 404 },
    { path: '/img/app-icon.svg', status: 404 },
    { path: '/index.json', status: 404 },
    { path: '/en/index.json', status: 404 },
];

for (const toolId of TOOL_IDS) {
    checks.push({ path: `/tools/${toolId}/`, status: 200, html: true, language: 'zh-cn', toolId });
    checks.push({ path: `/en/tools/${toolId}/`, status: 200, html: true, language: 'en', toolId });
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
    for (const match of tag.matchAll(/([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
        attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
    }
    return attributes;
}

function findTag(body, tagName, predicate) {
    return extractTags(body, tagName).map(extractAttributes).find(predicate) ?? null;
}

function collectLocalAssetUrls(pageUrl, body) {
    const assets = new Set();
    for (const tag of [...extractTags(body, 'script'), ...extractTags(body, 'link'), ...extractTags(body, 'img')]) {
        const attributes = extractAttributes(tag);
        const raw = attributes.src ?? attributes.href;
        if (!raw || /^(?:data|blob|mailto|javascript):/i.test(raw)) continue;
        try {
            const url = new URL(raw, pageUrl);
            if (url.origin === new URL(pageUrl).origin) assets.add(url.toString());
        } catch {
            // Invalid URLs are reported by the page-specific metadata checks.
        }
    }
    return [...assets];
}

function validateResponse(check, status, body, pageUrl = null) {
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
        if (pageUrl && canonical?.href !== pageUrl) errors.push(`canonical does not match ${pageUrl}`);
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
            if (TOOL_REGISTRY[check.toolId]?.core) requiredAssets.push(`${check.toolId}-core`);
            for (const asset of requiredAssets) {
                if (!new RegExp(`/js/tools/${asset}\\.[^"']+\\.js`, 'i').test(body)) {
                    errors.push(`missing tool asset: ${asset}`);
                }
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
            lastResult = {
                check,
                url,
                status: response.status,
                body,
                assets: check.html && response.status === check.status ? collectLocalAssetUrls(url, body) : [],
                errors: validateResponse(check, response.status, body, url),
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
    endpointUrl,
    extractAttributes,
    normalizeBaseUrl,
    validateResponse,
};
