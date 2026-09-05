const test = require('node:test');
const assert = require('node:assert/strict');

const analytics = require('../assets/js/analytics.js');

function memoryStorage(initial = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem: (key) => values.has(key) ? values.get(key) : null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => values.set(key, String(value)),
    };
}

function analyticsFixture({ optedOut = false, hash = '', search = '' } = {}) {
    const scripts = [];
    const listeners = new Map();
    const config = {
        getAttribute(name) {
            return {
                'data-google-id': 'G-TEST',
                'data-baidu-id': 'BAIDU-TEST',
                'data-clarity-id': 'CLARITY-TEST',
            }[name] || '';
        },
    };
    const document = {
        createElement() {
            return {
                async: false,
                setAttribute(name, value) { this[name] = value; },
            };
        },
        head: { appendChild(script) { scripts.push(script); } },
        querySelector(selector) {
            if (selector === '[data-codeglimpse-analytics-config]') return config;
            return null;
        },
    };
    const replaced = [];
    const window = {
        CustomEvent: class CustomEvent { constructor(type) { this.type = type; } },
        dispatchEvent() {},
        addEventListener(type, listener) { listeners.set(type, listener); },
        history: {
            state: { preserved: true },
            replaceState(state, title, url) { replaced.push({ state, title, url }); },
        },
        localStorage: memoryStorage(optedOut ? { [analytics.OPTOUT_KEY]: 'true' } : {}),
        location: {
            origin: 'https://blog.codeglimpse.top',
            pathname: '/tools/json/',
            search,
            hash,
        },
    };
    return { config, document, listeners, replaced, scripts, window };
}

test('sanitizes analytics page locations and redacts private share fragments', () => {
    const fixture = analyticsFixture({
        hash: '#cgshare=PRIVACY_SENTINEL',
        search: '?source=private',
    });

    assert.equal(analytics.pageLocation(fixture.window), 'https://blog.codeglimpse.top/tools/json/');
    assert.equal(analytics.redactShareHash(fixture.window), '#cgshare=PRIVACY_SENTINEL');
    assert.equal(fixture.window.__codeglimpsePrivateShareHash, '#cgshare=PRIVACY_SENTINEL');
    assert.deepEqual(fixture.replaced, [{
        state: { preserved: true },
        title: '',
        url: '/tools/json/?source=private',
    }]);
});

test('loads only approved analytics providers without tool or URL-fragment data', () => {
    const fixture = analyticsFixture({
        hash: '#cgshare=PRIVACY_SENTINEL',
        search: '?query=PRIVACY_SENTINEL',
    });

    const state = analytics.start(fixture.document, fixture.window, fixture.config);
    assert.equal(state.enabled, true);
    assert.deepEqual(state.providers, { google: true, baidu: true, clarity: true });
    assert.equal(state.pageLocation, 'https://blog.codeglimpse.top/tools/json/');
    assert.deepEqual(fixture.scripts.map((script) => script.src).sort(), [
        'https://hm.baidu.com/hm.js?BAIDU-TEST',
        'https://www.clarity.ms/tag/CLARITY-TEST',
        'https://www.googletagmanager.com/gtag/js?id=G-TEST',
    ].sort());

    const outbound = JSON.stringify(fixture.scripts);
    assert.doesNotMatch(outbound, /PRIVACY_SENTINEL|cgshare/i);
    const googleConfig = fixture.window.dataLayer.at(-1);
    assert.equal(googleConfig[0], 'config');
    assert.equal(googleConfig[2].page_location, 'https://blog.codeglimpse.top/tools/json/');
    assert.equal(googleConfig[2].allow_google_signals, false);
    assert.equal(googleConfig[2].allow_ad_personalization_signals, false);
});

test('honors the local analytics opt-out before any provider script loads', () => {
    const fixture = analyticsFixture({ optedOut: true, hash: '#cgshare=PRIVATE' });
    const state = analytics.start(fixture.document, fixture.window, fixture.config);

    assert.equal(state.enabled, false);
    assert.equal(state.optedOut, true);
    assert.deepEqual(fixture.scripts, []);
});

test('keeps opt-out active when browser storage is unavailable', () => {
    const fixture = analyticsFixture();
    fixture.window.localStorage = null;
    fixture.window.sessionStorage = null;

    assert.equal(analytics.optOut(undefined, fixture.window), true);
    assert.equal(analytics.isHardOptedOut(fixture.window), true);
    const state = analytics.start(fixture.document, fixture.window, fixture.config);

    assert.equal(state.enabled, false);
    assert.deepEqual(fixture.scripts, []);
});

test('redacts share fragments added by client-side navigation', () => {
    const fixture = analyticsFixture();
    analytics.start(fixture.document, fixture.window, fixture.config);
    fixture.window.location.hash = '#cgshare=CLIENT_NAV_SENTINEL';
    fixture.listeners.get('hashchange')();

    assert.equal(fixture.window.__codeglimpsePrivateShareHash, '#cgshare=CLIENT_NAV_SENTINEL');
    assert.equal(fixture.replaced.at(-1).url, '/tools/json/');
});
