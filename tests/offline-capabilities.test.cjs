const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('offline assets define versioned caching and an offline fallback', () => {
    const serviceWorker = fs.readFileSync(path.join(root, 'static', 'sw.js'), 'utf8');
    const offlinePage = fs.readFileSync(path.join(root, 'static', 'offline.html'), 'utf8');
    assert.match(serviceWorker, /CACHE_VERSION\s*=\s*['"]codeglimpse-v\d+['"]/);
    assert.match(serviceWorker, /cache\.addAll\(PRECACHE_URLS\)/);
    assert.match(serviceWorker, /caches\.match\('\/offline\.html'\)/);
    assert.match(offlinePage, /当前处于离线状态/);
    assert.match(offlinePage, /href="\/tools\/"/);
    assert.doesNotMatch(serviceWorker, /manifest\.webmanifest|app-icon\.svg/);
    assert.equal(fs.existsSync(path.join(root, 'static', 'manifest.webmanifest')), false);
    assert.equal(fs.existsSync(path.join(root, 'static', 'img', 'app-icon.svg')), false);
    assert.equal(fs.existsSync(path.join(root, 'assets', 'js', 'pwa.js')), false);
});
