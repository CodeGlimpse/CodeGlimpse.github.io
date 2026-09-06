(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpsePrivacyNotice = api;

    if (root && root.document) {
        const start = () => api.mount(root.document, root);
        if (root.document.readyState === 'loading') {
            root.document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    const STORAGE_KEY = 'codeglimpse:privacy-notice:v1';

    function storageCandidates(storage, windowObject) {
        if (storage !== undefined) return [storage];
        const candidates = [];
        for (const name of ['localStorage', 'sessionStorage']) {
            // Accessing the property itself can throw in restricted browsers.
            try {
                if (windowObject?.[name]) candidates.push(windowObject[name]);
            } catch { /* try the next storage type */ }
        }
        return candidates;
    }

    function readDismissed(storage, windowObject = root) {
        return storageCandidates(storage, windowObject).some((candidate) => {
            try {
                return candidate?.getItem(STORAGE_KEY) === 'dismissed';
            } catch {
                return false;
            }
        });
    }

    function writeDismissed(storage, windowObject = root) {
        for (const candidate of storageCandidates(storage, windowObject)) {
            try {
                if (!candidate) continue;
                candidate.setItem(STORAGE_KEY, 'dismissed');
                return true;
            } catch { /* try the next storage type */ }
        }
        return false;
    }

    function mount(documentObject = root?.document, windowObject = root) {
        const notice = documentObject?.getElementById('codeglimpse-privacy-notice');
        const analytics = windowObject?.CodeGlimpseAnalytics;

        documentObject?.querySelectorAll?.('[data-analytics-optout]').forEach((control) => {
            control.addEventListener('click', () => {
                analytics?.optOut?.();
                if (analytics?.storageAvailable !== false) windowObject?.location?.reload?.();
            });
        });
        documentObject?.querySelectorAll?.('[data-analytics-optin]').forEach((control) => {
            control.addEventListener('click', () => {
                analytics?.optIn?.();
                windowObject?.location?.reload?.();
            });
        });

        if (!notice) return null;

        const dismiss = notice.querySelector('[data-privacy-dismiss]');
        const optOut = notice.querySelector('[data-privacy-optout]');

        optOut?.addEventListener('click', () => {
            analytics?.optOut?.();
            writeDismissed(undefined, windowObject);
            notice.hidden = true;
            if (analytics?.storageAvailable !== false) windowObject?.location?.reload?.();
        }, { once: true });

        if (readDismissed(undefined, windowObject)) {
            notice.hidden = true;
            return notice;
        }

        notice.hidden = false;
        dismiss?.addEventListener('click', () => {
            writeDismissed(undefined, windowObject);
            notice.hidden = true;
        }, { once: true });
        return notice;
    }

    return { STORAGE_KEY, mount, readDismissed, writeDismissed };
});
