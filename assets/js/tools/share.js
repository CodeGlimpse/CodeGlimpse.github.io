(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseToolShare = api;
    }

    if (root && root.document) {
        const start = () => api.mountAll(root.document, root);
        if (root.document.readyState === 'loading') {
            root.document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    const HASH_PREFIX = 'cgshare=';
    const MAX_HASH_LENGTH = 12000;
    const SENSITIVE_TOOLS = Object.freeze(new Set(['jwt', 'password']));
    const RESTORE_ACTIONS = Object.freeze({
        base64: '#base64-encode',
        bmi: '#bmi-calc',
        csv: '#csv-convert',
        diff: '#diff-compare',
        html: '#html-encode',
        json: '[data-action="format"]',
        jsonpath: '#jsonpath-query',
        jwt: '#jwt-decode',
        regex: '#regex-run',
        sql: '#sql-format',
        url: '#url-encode',
        xml: '#xml-format',
        yaml: '#yaml-convert'
    });

    function encodeBase64Url(value) {
        const text = String(value ?? '');
        let bytes;
        if (typeof TextEncoder === 'function') {
            bytes = new TextEncoder().encode(text);
        } else {
            bytes = Uint8Array.from(text, (character) => character.charCodeAt(0));
        }

        let binary = '';
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        const encoded = typeof root.btoa === 'function'
            ? root.btoa(binary)
            : root.Buffer.from(bytes).toString('base64');
        return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    function decodeBase64Url(value) {
        const normalized = String(value ?? '').replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
        let bytes;
        if (typeof root.atob === 'function') {
            const binary = root.atob(padded);
            bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        } else {
            bytes = Uint8Array.from(root.Buffer.from(padded, 'base64'));
        }

        if (typeof TextDecoder === 'function') return new TextDecoder().decode(bytes);
        return String.fromCharCode(...bytes);
    }

    function encodeState(state) {
        const encoded = encodeBase64Url(JSON.stringify(state));
        if (encoded.length > MAX_HASH_LENGTH) {
            throw new Error('Share state is too large');
        }
        return encoded;
    }

    function decodeState(value) {
        if (!value || String(value).length > MAX_HASH_LENGTH) throw new Error('Invalid share state');
        const parsed = JSON.parse(decodeBase64Url(value));
        if (!parsed || typeof parsed !== 'object' || parsed.version !== 1 || typeof parsed.tool !== 'string') {
            throw new Error('Invalid share state');
        }
        return parsed;
    }

    function buildShareHash(state) {
        return `#${HASH_PREFIX}${encodeState(state)}`;
    }

    function parseShareHash(hash) {
        const value = String(hash ?? '').replace(/^#/, '');
        if (!value.startsWith(HASH_PREFIX)) return null;
        return decodeState(value.slice(HASH_PREFIX.length));
    }

    function controlValue(control) {
        const type = (control.type || '').toLowerCase();
        if (type === 'checkbox' || type === 'radio') return Boolean(control.checked);
        if (control.multiple && control.options) {
            return [...control.options].filter((option) => option.selected).map((option) => option.value);
        }
        return String(control.value ?? '');
    }

    function isFormControl(control, includeReadonly) {
        const type = (control.type || '').toLowerCase();
        if (!control.id || ['button', 'submit', 'reset', 'file', 'image'].includes(type)) return false;
        if (control.disabled || control.dataset.shareIgnore === 'true') return false;
        return includeReadonly || !control.readOnly;
    }

    function collectFields(wrapper, includeReadonly = false) {
        return [...wrapper.querySelectorAll('input, textarea, select')]
            .filter((control) => isFormControl(control, includeReadonly))
            .map((control) => ({
                id: control.id,
                type: (control.type || control.tagName || 'text').toLowerCase(),
                value: controlValue(control),
                checked: ['checkbox', 'radio'].includes((control.type || '').toLowerCase())
                    ? Boolean(control.checked)
                    : undefined,
                readonly: Boolean(control.readOnly)
            }));
    }

    function collectDisplayValues(wrapper) {
        return [...wrapper.querySelectorAll('[id]')]
            .filter((element) => /(?:output|result|status|summary|metric|entropy|current-|validation)/i.test(element.id))
            .map((element) => ({
                id: element.id,
                value: 'value' in element ? String(element.value ?? '') : String(element.textContent ?? '').trim(),
                hidden: Boolean(element.hidden)
            }))
            .filter((item) => item.value || item.hidden);
    }

    function collectShareState(wrapper) {
        return {
            version: 1,
            tool: wrapper.id.replace(/^tool-/, ''),
            language: wrapper.getAttribute('data-lang') || 'en',
            fields: collectFields(wrapper, false)
        };
    }

    function collectSnapshot(wrapper, document) {
        return {
            format: 'codeglimpse-tool-snapshot',
            version: 1,
            tool: wrapper.id.replace(/^tool-/, ''),
            language: wrapper.getAttribute('data-lang') || 'en',
            path: document?.location?.pathname || '',
            fields: collectFields(wrapper, true),
            display: collectDisplayValues(wrapper)
        };
    }

    function setControlValue(control, field) {
        const type = (control.type || '').toLowerCase();
        if (type === 'checkbox' || type === 'radio') {
            control.checked = Boolean(field.checked ?? field.value);
        } else if (control.multiple && Array.isArray(field.value)) {
            [...control.options].forEach((option) => { option.selected = field.value.includes(option.value); });
        } else {
            control.value = String(field.value ?? '');
        }

        if (typeof root.Event === 'function') {
            control.dispatchEvent(new root.Event('input', { bubbles: true }));
            control.dispatchEvent(new root.Event('change', { bubbles: true }));
        }
    }

    function restoreFields(wrapper, fields) {
        if (!Array.isArray(fields)) return 0;
        let restored = 0;
        fields.forEach((field) => {
            if (!field || typeof field.id !== 'string') return;
            const control = wrapper.ownerDocument?.getElementById(field.id);
            if (!control || !wrapper.contains(control) || !isFormControl(control, true) || control.readOnly) return;
            setControlValue(control, field);
            restored += 1;
        });
        return restored;
    }

    function triggerRestoreAction(wrapper) {
        const tool = wrapper.id.replace(/^tool-/, '');
        const selector = RESTORE_ACTIONS[tool];
        if (!selector) return false;
        const action = wrapper.querySelector(selector);
        if (!action || action.disabled) return false;
        const hasInput = [...wrapper.querySelectorAll('input:not([readonly]), textarea:not([readonly])')]
            .some((control) => String(control.value ?? '').trim());
        if (!hasInput) return false;
        action.click();
        return true;
    }

    function triggerRestoreWhenReady(wrapper, windowObject) {
        let attempts = 0;
        const retry = () => {
            if (triggerRestoreAction(wrapper) || attempts >= 40) return;
            attempts += 1;
            windowObject.setTimeout(retry, 25);
        };
        retry();
    }

    function messages(language) {
        return language === 'zh-cn' ? {
            title: '分享与导出',
            hint: '分享链接会把当前输入和选项放入 URL，请勿分享敏感信息。',
            sensitiveHint: '为避免将敏感内容写入 URL，JWT 和密码工具默认禁用分享；仍可导出本地快照。',
            share: '分享',
            copy: '复制分享链接',
            export: '导出快照',
            copied: '分享链接已复制',
            shared: '已打开分享面板',
            exported: '快照已下载',
            restored: '已从分享链接恢复输入',
            invalid: '分享链接无效或已损坏',
            tooLarge: '输入内容过大，无法生成分享链接',
            failed: '操作失败，请稍后重试'
        } : {
            title: 'Share and export',
            hint: 'Share links put current inputs and options in the URL. Do not share sensitive data.',
            sensitiveHint: 'Sharing is disabled for JWT and password inputs to keep sensitive data out of URLs. Local snapshots remain available.',
            share: 'Share',
            copy: 'Copy share link',
            export: 'Export snapshot',
            copied: 'Share link copied',
            shared: 'Share sheet opened',
            exported: 'Snapshot downloaded',
            restored: 'Inputs restored from share link',
            invalid: 'The share link is invalid or corrupted',
            tooLarge: 'Inputs are too large for a share link',
            failed: 'Operation failed; try again later'
        };
    }

    function mount(wrapper, document, windowObject = root) {
        if (!wrapper || wrapper.dataset.shareMounted === 'true') return null;
        wrapper.dataset.shareMounted = 'true';
        const lang = wrapper.getAttribute('data-lang') || 'en';
        const t = messages(lang);
        const toolId = wrapper.id.replace(/^tool-/, '');
        const shareAllowed = !SENSITIVE_TOOLS.has(toolId);
        const panel = document.createElement('section');
        panel.className = 'tool-share-panel';
        panel.setAttribute('aria-labelledby', `${wrapper.id}-share-title`);
        panel.innerHTML = `
            <div class="tool-share-heading">
                <h2 class="tool-share-title" id="${wrapper.id}-share-title">${t.title}</h2>
                <span class="tool-share-badge">${lang === 'zh-cn' ? '浏览器本地处理' : 'Browser local'}</span>
            </div>
            <p class="tool-share-hint ${shareAllowed ? '' : 'tool-share-hint--protected'}">${shareAllowed ? t.hint : t.sensitiveHint}</p>
            <div class="tool-actions tool-share-actions">
                <button type="button" class="tool-btn tool-btn--primary" data-share-native ${shareAllowed ? '' : 'disabled aria-disabled="true"'}>${t.share}</button>
                <button type="button" class="tool-btn tool-btn--secondary" data-share-copy ${shareAllowed ? '' : 'disabled aria-disabled="true"'}>${t.copy}</button>
                <button type="button" class="tool-btn tool-btn--secondary" data-share-export>${t.export}</button>
            </div>
        `;
        wrapper.insertAdjacentElement('afterend', panel);

        const notify = (type, message) => {
            windowObject.CodeGlimpseToast?.show({ type, message, document });
        };
        const buildLink = () => {
            const url = new windowObject.URL(windowObject.location.href);
            url.hash = buildShareHash(collectShareState(wrapper));
            return url.toString();
        };
        const copyLink = async () => {
            try {
                const link = buildLink();
                const copied = await windowObject.CodeGlimpseToolUi.copy({
                    button: panel.querySelector('[data-share-copy]'),
                    value: link,
                    status: null,
                    messages: { empty: t.failed, copied: t.copied, copyFailed: t.failed }
                });
                notify(copied ? 'success' : 'error', copied ? t.copied : t.failed);
            } catch (error) {
                notify('error', error.message === 'Share state is too large' ? t.tooLarge : t.failed);
            }
        };

        if (shareAllowed) {
            panel.querySelector('[data-share-copy]').addEventListener('click', copyLink);
            panel.querySelector('[data-share-native]').addEventListener('click', async () => {
                try {
                    const link = buildLink();
                    if (typeof windowObject.navigator?.share === 'function') {
                        await windowObject.navigator.share({ title: document.title, url: link });
                        notify('success', t.shared);
                    } else {
                        await copyLink();
                    }
                } catch (error) {
                    if (error.name !== 'AbortError') await copyLink();
                }
            });
        }
        panel.querySelector('[data-share-export]').addEventListener('click', () => {
            try {
                const snapshot = JSON.stringify(collectSnapshot(wrapper, document), null, 2);
                windowObject.CodeGlimpseToolUi.download(
                    `codeglimpse-${wrapper.id.replace(/^tool-/, '')}-snapshot.json`,
                    snapshot,
                    'application/json;charset=utf-8'
                );
                notify('success', t.exported);
            } catch (error) {
                notify('error', t.failed);
            }
        });

        const restoreFromHash = () => {
            try {
                const privateHash = windowObject.__codeglimpsePrivateShareHash;
                const state = parseShareHash(privateHash || windowObject.location.hash);
                if (!state || state.tool !== toolId) return;
                restoreFields(wrapper, state.fields);
                // Let the tool finish its own event wiring before invoking a
                // button-based calculation (for example JSON or CSV).
                triggerRestoreWhenReady(wrapper, windowObject);
                notify('success', t.restored);
            } catch (error) {
                notify('error', error.message === 'Share state is too large' ? t.tooLarge : t.invalid);
            } finally {
                if (windowObject.__codeglimpsePrivateShareHash) {
                    windowObject.__codeglimpsePrivateShareHash = '';
                }
            }
        };
        restoreFromHash();
        windowObject.addEventListener?.('hashchange', restoreFromHash);

        return panel;
    }

    function mountAll(document, windowObject = root) {
        return [...document.querySelectorAll('.tool-wrapper[id^="tool-"]')]
            .map((wrapper) => mount(wrapper, document, windowObject));
    }

    return {
        MAX_HASH_LENGTH,
        SENSITIVE_TOOLS,
        buildShareHash,
        collectFields,
        collectShareState,
        collectSnapshot,
        decodeState,
        encodeState,
        mount,
        mountAll,
        parseShareHash,
        restoreFields
    };
});
