(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseAnalyticsPrivacy = api;

    if (root && root.document) {
        const start = () => api.mount(root.document, root);
        if (root.document.readyState === 'loading') {
            root.document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    const MASK_ATTRIBUTE = 'data-clarity-mask';
    const MASK_CLASS = 'clarity-mask';
    const MOUNT_ATTRIBUTE = 'data-codeglimpse-privacy-mounted';
    const SENSITIVE_TOOLS = Object.freeze(new Set(['jwt', 'password']));
    const FORM_SELECTOR = 'input, textarea, select, [contenteditable="true"]';
    const SENSITIVE_REGION_SELECTOR = '.tool-metrics, .tool-output-panel, .result-item, .tool-inline-summary';

    function getToolId(wrapper) {
        return String(wrapper?.id || '').replace(/^tool-/, '').toLowerCase();
    }

    function isSensitiveTool(toolId) {
        return SENSITIVE_TOOLS.has(String(toolId || '').toLowerCase());
    }

    function isOutputElement(element) {
        if (!element || element.nodeType !== 1) return false;
        if (String(element.tagName || '').toLowerCase() === 'output') return true;
        return /(?:output|result|status|summary|metric|entropy|current-|validation)/i.test(element.id || '')
            || element.matches?.(SENSITIVE_REGION_SELECTOR) === true;
    }

    function markElement(element) {
        if (!element || element.nodeType !== 1) return false;
        element.setAttribute(MASK_ATTRIBUTE, 'true');
        element.classList?.add(MASK_CLASS);
        return true;
    }

    function markTool(wrapper) {
        if (!wrapper || wrapper.nodeType !== 1) return 0;
        wrapper.setAttribute('data-clarity-region', 'tool');
        let count = 0;
        if (isSensitiveTool(getToolId(wrapper))) count += markElement(wrapper) ? 1 : 0;

        const controls = wrapper.querySelectorAll?.(`${FORM_SELECTOR}, ${SENSITIVE_REGION_SELECTOR}`) || [];
        controls.forEach((element) => { if (markElement(element)) count += 1; });

        const outputs = wrapper.querySelectorAll?.('[id], output') || [];
        outputs.forEach((element) => {
            if (isOutputElement(element) && markElement(element)) count += 1;
        });

        const sharePanels = wrapper.parentElement?.querySelectorAll?.('.tool-share-panel') || [];
        sharePanels.forEach((panel) => { if (markElement(panel)) count += 1; });
        return count;
    }

    function markDocument(documentObject) {
        if (!documentObject?.querySelectorAll) return 0;
        let count = 0;
        documentObject.querySelectorAll('.tool-wrapper').forEach((wrapper) => {
            count += markTool(wrapper);
        });

        documentObject.querySelectorAll(FORM_SELECTOR).forEach((element) => {
            if (markElement(element)) count += 1;
        });
        return count;
    }

    function markAddedNode(node) {
        if (!node || node.nodeType !== 1) return 0;
        let count = 0;
        if (node.matches?.('.tool-wrapper')) count += markTool(node);
        if (node.matches?.(FORM_SELECTOR) && markElement(node)) count += 1;
        if (node.matches?.(SENSITIVE_REGION_SELECTOR) && markElement(node)) count += 1;
        if (isOutputElement(node) && markElement(node)) count += 1;
        if (node.matches?.('.tool-share-panel') && markElement(node)) count += 1;
        node.querySelectorAll?.('.tool-wrapper').forEach((wrapper) => { count += markTool(wrapper); });
        node.querySelectorAll?.(FORM_SELECTOR).forEach((element) => {
            if (markElement(element)) count += 1;
        });
        node.querySelectorAll?.(SENSITIVE_REGION_SELECTOR).forEach((element) => {
            if (markElement(element)) count += 1;
        });
        node.querySelectorAll?.('[id], output').forEach((element) => {
            if (isOutputElement(element) && markElement(element)) count += 1;
        });
        return count;
    }

    function mount(documentObject = root?.document, windowObject = root) {
        if (!documentObject?.documentElement) return null;
        if (documentObject.documentElement.getAttribute(MOUNT_ATTRIBUTE) === 'true') return null;
        documentObject.documentElement.setAttribute(MOUNT_ATTRIBUTE, 'true');
        markDocument(documentObject);

        if (typeof windowObject?.MutationObserver === 'function' && documentObject.body) {
            const observer = new windowObject.MutationObserver((records) => {
                records.forEach((record) => record.addedNodes.forEach(markAddedNode));
            });
            observer.observe(documentObject.body, { childList: true, subtree: true });
            return observer;
        }
        return null;
    }

    return {
        FORM_SELECTOR,
        SENSITIVE_REGION_SELECTOR,
        MASK_ATTRIBUTE,
        MASK_CLASS,
        SENSITIVE_TOOLS,
        isOutputElement,
        isSensitiveTool,
        markDocument,
        markElement,
        markTool,
        mount,
    };
});
