(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) root.CodeGlimpseToast = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    let hideTimer = null;
    let transitionTimer = null;

    function getDocument(documentObject) {
        return documentObject || root.document || null;
    }

    function ensure(documentObject) {
        const document = getDocument(documentObject);
        if (!document?.body) return null;

        const existing = document.getElementById('codeglimpse-toast');
        if (existing) return existing;

        const toast = document.createElement('div');
        toast.id = 'codeglimpse-toast';
        toast.className = 'codeglimpse-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('aria-atomic', 'true');
        toast.hidden = true;
        document.body.appendChild(toast);
        return toast;
    }

    function hide(documentObject) {
        const toast = ensure(documentObject);
        if (!toast) return;

        toast.classList.remove('is-visible');
        if (transitionTimer) root.clearTimeout(transitionTimer);
        transitionTimer = root.setTimeout(() => {
            toast.hidden = true;
        }, 180);
    }

    function show({ type = 'info', message = '', duration = 3200, document: documentObject } = {}) {
        const toast = ensure(documentObject);
        if (!toast || !String(message).trim()) return false;

        if (hideTimer) root.clearTimeout(hideTimer);
        if (transitionTimer) root.clearTimeout(transitionTimer);
        toast.hidden = false;
        toast.dataset.type = type;
        toast.textContent = String(message);
        root.setTimeout(() => toast.classList.add('is-visible'), 0);
        hideTimer = root.setTimeout(() => hide(documentObject), Math.max(1200, duration));
        return true;
    }

    return { ensure, hide, show };
});
