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

    function readDismissed(storage = root?.localStorage) {
        try {
            return storage?.getItem(STORAGE_KEY) === 'dismissed';
        } catch {
            return false;
        }
    }

    function writeDismissed(storage = root?.localStorage) {
        try {
            storage?.setItem(STORAGE_KEY, 'dismissed');
            return true;
        } catch {
            return false;
        }
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
            writeDismissed(windowObject?.localStorage);
            notice.hidden = true;
            if (analytics?.storageAvailable !== false) windowObject?.location?.reload?.();
        }, { once: true });

        if (readDismissed(windowObject?.localStorage)) {
            notice.hidden = true;
            return notice;
        }

        notice.hidden = false;
        dismiss?.addEventListener('click', () => {
            writeDismissed(windowObject?.localStorage);
            notice.hidden = true;
        }, { once: true });
        return notice;
    }

    return { STORAGE_KEY, mount, readDismissed, writeDismissed };
});
