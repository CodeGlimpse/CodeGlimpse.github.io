const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('offline assets define versioned caching and an offline fallback', () => {
    const serviceWorker = fs.readFileSync(path.join(root, 'static', 'sw.js'), 'utf8');
    const offlinePage = fs.readFileSync(path.join(root, 'static', 'offline.html'), 'utf8');
    const manifest = fs.readFileSync(path.join(root, 'static', 'manifest.webmanifest'), 'utf8');
    const appIcon = fs.readFileSync(path.join(root, 'static', 'img', 'app-icon.svg'), 'utf8');
    assert.match(serviceWorker, /CACHE_VERSION\s*=\s*['"]codeglimpse-v\d+['"]/);
    assert.match(serviceWorker, /cache\.addAll\(PRECACHE_URLS\)/);
    assert.match(serviceWorker, /caches\.match\('\/offline\.html'\)/);
    assert.match(offlinePage, /当前处于离线状态/);
    assert.match(offlinePage, /href="\/tools\/"/);
    assert.match(manifest, /"display"\s*:\s*"standalone"/);
    assert.match(manifest, /"start_url"\s*:\s*"\/tools\/"/);
    assert.match(manifest, /app-icon\.svg/);
    assert.match(appIcon, /<svg\b/);
});
