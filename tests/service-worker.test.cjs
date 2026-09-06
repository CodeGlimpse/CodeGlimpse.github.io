const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../static/sw.js'), 'utf8');
const currentCache = source.match(/CACHE_VERSION\s*=\s*'([^']+)'/)[1];
const origin = 'https://example.com';

function workerFixture({ network = async () => new Response('network'), beforeWrite = async () => {} } = {}) {
    const handlers = new Map();
    const stores = new Map();
    const calls = [];
    const writes = [];
    const lifecycle = [];
    const key = (request) => new URL(typeof request === 'string' ? request : request.url, origin).href;
    const store = (name = currentCache) => {
        if (!stores.has(name)) stores.set(name, new Map());
        return stores.get(name);
    };
    const caches = {
        keys: async () => [...stores.keys()],
        delete: async (name) => stores.delete(name),
        async open(name) {
            const entries = store(name);
            return {
                match: async (request) => entries.get(key(request))?.clone(),
                async put(request, response) {
                    await beforeWrite();
                    entries.set(key(request), response.clone());
                    writes.push(key(request));
                },
                async addAll(urls) {
                    for (const url of urls) entries.set(key(url), new Response(`precache ${url}`));
                    lifecycle.push('precache');
                },
            };
        },
    };
    vm.runInNewContext(source, {
        URL, Response, caches,
        fetch: async (request) => { calls.push(request.url); return network(request); },
        self: {
            location: { origin },
            addEventListener: (type, handler) => handlers.set(type, handler),
            skipWaiting: async () => lifecycle.push('skipWaiting'),
            clients: { claim: async () => lifecycle.push('claim') },
        },
    });
    return {
        calls, writes, lifecycle, stores,
        seed(url, body, name = currentCache) { store(name).set(key(url), new Response(body)); },
        read(url, name = currentCache) { return store(name).get(key(url))?.clone(); },
        request(url, { method = 'GET', mode = 'navigate' } = {}) {
            let response;
            handlers.get('fetch')({
                request: { url: key(url), method, mode },
                respondWith: (promise) => { response = Promise.resolve(promise); },
            });
            return response;
        },
        async run(type) {
            const promises = [];
            handlers.get(type)({ waitUntil: (promise) => promises.push(promise) });
            await Promise.all(promises);
        },
    };
}

function deferred() {
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    return { promise, resolve };
}

test('waits for successful navigation cache writes within the response lifetime', async () => {
    const started = deferred();
    const gate = deferred();
    const fixture = workerFixture({ beforeWrite: async () => { started.resolve(); await gate.promise; } });
    let finished = false;
    const task = fixture.request('/tools/json/').then((response) => { finished = true; return response; });
    await started.promise;
    assert.equal(finished, false);
    gate.resolve();
    assert.equal(await (await task).text(), 'network');
    assert.equal(await fixture.read('/tools/json/').text(), 'network');
});

test('serves the last successful navigation after 5xx without overwriting it', async () => {
    for (const status of [500, 503]) {
        const fixture = workerFixture({ network: async () => new Response('upstream failure', { status }) });
        fixture.seed('/tools/json/', 'good page');
        const response = await fixture.request('/tools/json/');
        assert.equal(response.status, 200);
        assert.equal(await response.text(), 'good page');
        assert.equal(await fixture.read('/tools/json/').text(), 'good page');
        assert.equal(fixture.writes.length, 0);
    }
});

test('returns genuine 404s without replacing a previously cached page', async () => {
    const fixture = workerFixture({ network: async () => new Response('not found', { status: 404 }) });
    fixture.seed('/removed/', 'previous page');
    assert.equal((await fixture.request('/removed/')).status, 404);
    assert.equal(await fixture.read('/removed/').text(), 'previous page');
    assert.equal(fixture.writes.length, 0);
});

test('uses the cached page or offline fallback when navigation cannot reach the network', async () => {
    const fixture = workerFixture({ network: async () => { throw new Error('offline'); } });
    fixture.seed('/tools/yaml/', 'cached tool');
    fixture.seed('/offline.html', 'offline page');
    assert.equal(await (await fixture.request('/tools/yaml/')).text(), 'cached tool');
    assert.equal(await (await fixture.request('/unvisited/')).text(), 'offline page');
});

test('falls back for uncached 503s and still returns a response when no fallback exists', async () => {
    const fixture = workerFixture({ network: async () => new Response('unavailable', { status: 503 }) });
    fixture.seed('/offline.html', 'offline page');
    assert.equal(await (await fixture.request('/new/')).text(), 'offline page');
    const unavailable = workerFixture({ network: async () => new Response('unavailable', { status: 503 }) });
    assert.equal((await unavailable.request('/new/')).status, 503);
    const offline = workerFixture({ network: async () => { throw new Error('offline'); } });
    assert.equal((await offline.request('/new/')).type, 'error');
});

test('returns successful online pages even if writing the offline cache fails', async () => {
    const fixture = workerFixture({ beforeWrite: async () => { throw new Error('quota exceeded'); } });
    assert.equal(await (await fixture.request('/tools/xml/')).text(), 'network');
    assert.equal(fixture.read('/tools/xml/'), undefined);
});

test('serves cached assets without starting a redundant offline network request', async () => {
    const fixture = workerFixture({ network: async () => { throw new Error('offline'); } });
    fixture.seed('/js/tool.hash.js', 'cached script');
    assert.equal(await (await fixture.request('/js/tool.hash.js', { mode: 'no-cors' })).text(), 'cached script');
    assert.equal(fixture.calls.length, 0);
    assert.equal((await fixture.request('/js/missing.js', { mode: 'no-cors' })).type, 'error');
});

test('caches successful asset responses and skips failed ones', async () => {
    const fixture = workerFixture({ network: async (request) => new Response('asset', {
        status: request.url.endsWith('missing.js') ? 503 : 200,
    }) });
    assert.equal((await fixture.request('/js/tool.js', { mode: 'no-cors' })).status, 200);
    assert.equal(await fixture.read('/js/tool.js').text(), 'asset');
    assert.equal((await fixture.request('/js/missing.js', { mode: 'no-cors' })).status, 503);
    assert.equal(fixture.read('/js/missing.js'), undefined);
});

test('ignores cross-origin and non-GET requests', () => {
    const fixture = workerFixture();
    assert.equal(fixture.request('https://external.example/script.js', { mode: 'no-cors' }), undefined);
    assert.equal(fixture.request('/submit', { method: 'POST' }), undefined);
    assert.equal(fixture.calls.length, 0);
});

test('installs the offline fallback and removes only obsolete site caches', async () => {
    const fixture = workerFixture();
    fixture.seed('/old/', 'old', 'codeglimpse-v1');
    fixture.seed('/foreign/', 'foreign', 'another-app');
    await fixture.run('install');
    assert.equal(await fixture.read('/offline.html').text(), 'precache /offline.html');
    await fixture.run('activate');
    assert.deepEqual([...fixture.stores.keys()].sort(), ['another-app', currentCache].sort());
    assert.deepEqual(fixture.lifecycle, ['precache', 'skipWaiting', 'claim']);
});
