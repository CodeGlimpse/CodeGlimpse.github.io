const checks = [
    { path: '/', status: 200 },
    { path: '/tools/json/', status: 200 },
    { path: '/en/tools/json/', status: 200 },
    { path: '/search/index.json', status: 200, jsonArray: true },
    { path: '/en/search/index.json', status: 200, jsonArray: true },
    { path: '/robots.txt', status: 200 },
    { path: '/sitemap.xml', status: 200 },
    { path: '/index.json', status: 404 },
    { path: '/en/index.json', status: 404 },
];

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

function validateResponse(check, status, body) {
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

    return errors;
}

async function checkEndpoint(baseUrl, check) {
    const url = endpointUrl(baseUrl, check.path);
    try {
        const response = await fetch(url, {
            headers: { accept: 'text/html,application/json,application/xml,text/plain' },
            redirect: 'follow',
            signal: AbortSignal.timeout(15000),
        });
        const body = await response.text();
        return {
            check,
            url,
            status: response.status,
            errors: validateResponse(check, response.status, body),
        };
    } catch (error) {
        return { check, url, status: null, errors: [error.message] };
    }
}

async function main() {
    const baseUrl = normalizeBaseUrl(process.env.SITE_URL || process.argv[2]);
    const results = await Promise.all(checks.map((check) => checkEndpoint(baseUrl, check)));
    const failures = results.filter((result) => result.errors.length > 0);

    for (const result of results) {
        const status = result.status === null ? 'error' : `HTTP ${result.status}`;
        const outcome = result.errors.length === 0 ? 'passed' : 'failed';
        console.log(`${outcome}: ${result.check.path} -> ${status}`);
        for (const error of result.errors) console.error(`  ${error}`);
    }

    if (failures.length > 0) {
        console.error(`Deployed site check failed: ${failures.length} endpoint(s)`);
        process.exit(1);
    }

    console.log(`Deployed site check passed: ${results.length} endpoints at ${baseUrl}`);
}

if (require.main === module) {
    main().catch((error) => {
        console.error(`Deployed site check failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { checks, endpointUrl, normalizeBaseUrl, validateResponse };
