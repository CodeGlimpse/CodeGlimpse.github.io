const test = require('node:test');
const assert = require('node:assert/strict');
const privacy = require('../assets/js/privacy-notice.js');
const analytics = require('../assets/js/analytics.js');

function memoryStorage() {
    const values = new Map();
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
    };
}

function noticeFixture({ blockLocal = false, blockSession = false } = {}) {
    const controls = new Map();
    for (const selector of ['[data-privacy-dismiss]', '[data-privacy-optout]', '[data-analytics-optout]', '[data-analytics-optin]']) {
        const listeners = new Map();
        controls.set(selector, {
            addEventListener: (type, listener) => listeners.set(type, listener),
            click: () => listeners.get('click')?.(),
        });
    }
    const notice = { hidden: true, querySelector: (selector) => controls.get(selector) };
    const document = {
        getElementById: () => notice,
        querySelector: () => null,
        querySelectorAll: (selector) => controls.has(selector) ? [controls.get(selector)] : [],
    };
    const reloads = [];
    const local = memoryStorage();
    const session = memoryStorage();
    const window = {
        location: { reload: () => reloads.push(true) },
        CustomEvent: class CustomEvent { constructor(type) { this.type = type; } },
        dispatchEvent() {},
    };
    for (const [name, blocked, storage] of [
        ['localStorage', blockLocal, local], ['sessionStorage', blockSession, session],
    ]) Object.defineProperty(window, name, {
        get() {
            if (blocked) throw new Error('Storage access denied');
            return storage;
        },
    });
    analytics.start(document, window);
    return { document, window, notice, controls, local, session, reloads };
}

test('handles missing storage and storage methods that throw', () => {
    const unavailable = {
        getItem() { throw new Error('blocked'); },
        setItem() { throw new Error('blocked'); },
    };
    assert.equal(privacy.readDismissed(unavailable), false);
    assert.equal(privacy.writeDismissed(unavailable), false);
    assert.equal(privacy.writeDismissed(null), false);
    const sessionStorage = memoryStorage();
    const window = { localStorage: unavailable, sessionStorage };
    assert.equal(privacy.writeDismissed(undefined, window), true);
    assert.equal(privacy.readDismissed(undefined, window), true);
});

test('wires dismissal when both storage property getters are blocked', () => {
    const fixture = noticeFixture({ blockLocal: true, blockSession: true });
    assert.doesNotThrow(() => privacy.mount(fixture.document, fixture.window));
    assert.equal(fixture.notice.hidden, false);
    fixture.controls.get('[data-privacy-dismiss]').click();
    assert.equal(fixture.notice.hidden, true);
    assert.equal(privacy.readDismissed(undefined, fixture.window), false);
});

test('uses session storage for notice dismissal and analytics opt-out before reload', () => {
    const fixture = noticeFixture({ blockLocal: true });
    privacy.mount(fixture.document, fixture.window);
    fixture.controls.get('[data-privacy-optout]').click();
    assert.equal(fixture.session.getItem(privacy.STORAGE_KEY), 'dismissed');
    assert.equal(fixture.session.getItem(analytics.OPTOUT_KEY), 'true');
    assert.equal(fixture.notice.hidden, true);
    assert.equal(fixture.reloads.length, 1);
    assert.equal(privacy.readDismissed(undefined, fixture.window), true);
});

test('preserves the current-page opt-out without reloading when neither storage works', () => {
    for (const selector of ['[data-privacy-optout]', '[data-analytics-optout]']) {
        const fixture = noticeFixture({ blockLocal: true, blockSession: true });
        privacy.mount(fixture.document, fixture.window);
        fixture.controls.get(selector).click();
        assert.equal(analytics.isHardOptedOut(fixture.window), true);
        assert.equal(fixture.reloads.length, 0);
    }
});
