const CACHE_VERSION = 'codeglimpse-v5';
const PRECACHE_URLS = [
    '/',
    '/en/',
    '/archives/',
    '/en/archives/',
    '/tools/',
    '/en/tools/',
    '/links/',
    '/en/links/',
    '/offline.html',
    '/favicon.png',
    '/signature.svg',
    '/img/github-mark.svg',
    '/archives/index.json',
    '/en/archives/index.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys
                .filter((key) => key.startsWith('codeglimpse-v') && key !== CACHE_VERSION)
                .map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

async function readCached(request) {
    try {
        const cache = await caches.open(CACHE_VERSION);
        const response = await cache.match(request);
        return response?.ok ? response : undefined;
    } catch {
        return undefined;
    }
}

async function cacheSuccessfulResponse(request, response) {
    if (!response.ok) return;
    try {
        const cache = await caches.open(CACHE_VERSION);
        await cache.put(request, response.clone());
    } catch {
        // Storage failures must not turn a successful network load into an error.
    }
}

async function navigationResponse(request) {
    let response;
    try { response = await fetch(request); } catch { /* use the offline cache */ }
    if (response && response.status < 500) {
        await cacheSuccessfulResponse(request, response);
        return response;
    }
    return await readCached(request)
        || await readCached('/offline.html')
        || response
        || Response.error();
}

async function assetResponse(request) {
    const cached = await readCached(request);
    const immutable = /\.[a-f0-9]{64}\.(?:css|js)$/i.test(new URL(request.url).pathname);
    if (cached && immutable) return cached;
    try {
        const response = await fetch(request);
        if (response.status >= 500 && cached) return cached;
        await cacheSuccessfulResponse(request, response);
        return response;
    } catch {
        return cached || Response.error();
    }
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;

    // The response promise includes cache writes, keeping them within the fetch
    // event lifetime. Fingerprinted assets reuse their cache; fixed URLs such
    // as search indexes refresh online and fall back to their cache offline.
    event.respondWith(request.mode === 'navigate'
        ? navigationResponse(request)
        : assetResponse(request));
});
