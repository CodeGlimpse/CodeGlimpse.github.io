(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseAnalytics = api;

    if (root && root.document) api.start(root.document, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    const OPTOUT_KEY = 'codeglimpse:analytics-optout:v1';
    const LOADED_ATTRIBUTE = 'data-codeglimpse-analytics-provider';
    const PROVIDER_HOSTS = Object.freeze({
        google: 'https://www.googletagmanager.com/gtag/js?id=',
        baidu: 'https://hm.baidu.com/hm.js?',
        clarity: 'https://www.clarity.ms/tag/'
    });

    function getStorage(storage) {
        try {
            if (!storage) return null;
            const probe = '__codeglimpse_analytics_probe__';
            storage.setItem(probe, '1');
            storage.removeItem(probe);
            return storage;
        } catch {
            return null;
        }
    }

    function getOptOutStorage(windowObject = root) {
        let localStorage = null;
        let sessionStorage = null;
        try { localStorage = windowObject?.localStorage; } catch { /* blocked storage */ }
        try { sessionStorage = windowObject?.sessionStorage; } catch { /* blocked storage */ }
        return getStorage(localStorage) || getStorage(sessionStorage);
    }

    function resolveStorage(storage, windowObject = root) {
        return storage === undefined ? getOptOutStorage(windowObject) : getStorage(storage);
    }

    function isHardOptedOut(windowObject = root) {
        return windowObject?.__codeglimpseAnalyticsHardOptOut === true;
    }

    function disableLoadedProviders(windowObject = root) {
        try {
            windowObject?.gtag?.('consent', 'update', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
            });
        } catch { /* provider may not be initialized */ }
        try { windowObject?.clarity?.('consent', false); } catch { /* provider may not be initialized */ }
    }

    function isOptedOut(storage, windowObject = root) {
        if (isHardOptedOut(windowObject)) return true;
        try {
            return resolveStorage(storage, windowObject)?.getItem(OPTOUT_KEY) === 'true';
        } catch {
            return false;
        }
    }

    function optOut(storage, windowObject = root) {
        windowObject.__codeglimpseAnalyticsHardOptOut = true;
        const target = resolveStorage(storage, windowObject);
        try {
            target?.setItem(OPTOUT_KEY, 'true');
            disableLoadedProviders(windowObject);
            windowObject?.dispatchEvent?.(new windowObject.CustomEvent('codeglimpse:analytics-optout'));
            return true;
        } catch {
            disableLoadedProviders(windowObject);
            return true;
        }
    }

    function optIn(storage, windowObject = root) {
        delete windowObject.__codeglimpseAnalyticsHardOptOut;
        const target = resolveStorage(storage, windowObject);
        try {
            target?.removeItem(OPTOUT_KEY);
            windowObject?.dispatchEvent?.(new windowObject.CustomEvent('codeglimpse:analytics-optin'));
            return true;
        } catch {
            return true;
        }
    }

    function pageLocation(windowObject = root) {
        const location = windowObject?.location;
        if (!location) return '';
        // Deliberately omit query strings and fragments. Share state is stored
        // in #cgshare=..., and must never be part of an analytics page field.
        return `${location.origin || ''}${location.pathname || '/'}`;
    }

    function redactShareHash(windowObject = root) {
        const location = windowObject?.location;
        const hash = String(location?.hash || '');
        if (!hash.startsWith('#cgshare=')) return '';

        windowObject.__codeglimpsePrivateShareHash = hash;
        try {
            windowObject.history?.replaceState?.(
                windowObject.history.state,
                '',
                `${location.pathname || '/'}${location.search || ''}`,
            );
        } catch {
            // The analytics page field still excludes the fragment even when a
            // constrained browser prevents replacing the visible URL.
        }
        return hash;
    }

    function loadScript(documentObject, src, provider) {
        if (!documentObject?.createElement || !src) return null;
        const existing = documentObject.querySelector?.(`script[${LOADED_ATTRIBUTE}="${provider}"]`);
        if (existing) return existing;
        const script = documentObject.createElement('script');
        script.async = true;
        script.src = src;
        script.setAttribute(LOADED_ATTRIBUTE, provider);
        documentObject.head?.appendChild(script);
        return script;
    }

    function startGoogle(documentObject, windowObject, id) {
        if (!id) return false;
        windowObject.dataLayer = windowObject.dataLayer || [];
        windowObject.gtag = windowObject.gtag || function () {
            windowObject.dataLayer.push(arguments);
        };
        windowObject.gtag('js', new Date());
        windowObject.gtag('config', id, {
            send_page_view: true,
            page_location: pageLocation(windowObject),
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });
        loadScript(documentObject, `${PROVIDER_HOSTS.google}${encodeURIComponent(id)}`, 'google');
        return true;
    }

    function startClarity(documentObject, windowObject, id) {
        if (!id) return false;
        windowObject.clarity = windowObject.clarity || function () {
            (windowObject.clarity.q = windowObject.clarity.q || []).push(arguments);
        };
        loadScript(documentObject, `${PROVIDER_HOSTS.clarity}${encodeURIComponent(id)}`, 'clarity');
        return true;
    }

    function startBaidu(documentObject, windowObject, id) {
        if (!id) return false;
        windowObject._hmt = windowObject._hmt || [];
        loadScript(documentObject, `${PROVIDER_HOSTS.baidu}${encodeURIComponent(id)}`, 'baidu');
        return true;
    }

    function start(documentObject = root?.document, windowObject = root, config = null) {
        if (!documentObject || !windowObject) return { enabled: false, reason: 'unavailable' };
        if (windowObject.__codeglimpseAnalyticsStarted) return windowObject.CodeGlimpseAnalytics;

        redactShareHash(windowObject);
        // A share link can be opened through client-side navigation without a
        // full document reload. Redact that fragment before the share module's
        // hashchange listener receives it, while keeping the value in memory
        // for local-only restoration.
        windowObject.addEventListener?.('hashchange', () => redactShareHash(windowObject));
        const element = config || documentObject.querySelector?.('[data-codeglimpse-analytics-config]');
        const ids = {
            google: String(element?.getAttribute?.('data-google-id') || '').trim(),
            baidu: String(element?.getAttribute?.('data-baidu-id') || '').trim(),
            clarity: String(element?.getAttribute?.('data-clarity-id') || '').trim()
        };
        const storage = getOptOutStorage(windowObject);
        const state = {
            enabled: !isOptedOut(storage, windowObject),
            optedOut: isOptedOut(storage, windowObject),
            storageAvailable: Boolean(storage),
            pageLocation: pageLocation(windowObject),
            providers: Object.freeze({ google: false, baidu: false, clarity: false }),
            optOut: () => optOut(storage, windowObject),
            optIn: () => optIn(storage, windowObject),
        };

        if (!state.enabled) {
            windowObject.__codeglimpseAnalyticsStarted = true;
            windowObject.CodeGlimpseAnalytics = state;
            return state;
        }

        const providers = {
            google: startGoogle(documentObject, windowObject, ids.google),
            baidu: startBaidu(documentObject, windowObject, ids.baidu),
            clarity: startClarity(documentObject, windowObject, ids.clarity)
        };
        state.providers = Object.freeze(providers);
        windowObject.__codeglimpseAnalyticsStarted = true;
        windowObject.CodeGlimpseAnalytics = state;
        return state;
    }

    return {
        LOADED_ATTRIBUTE,
        OPTOUT_KEY,
        PROVIDER_HOSTS,
        getStorage,
        getOptOutStorage,
        isOptedOut,
        isHardOptedOut,
        loadScript,
        optIn,
        optOut,
        pageLocation,
        redactShareHash,
        start,
        startBaidu,
        startClarity,
        startGoogle
    };
});
