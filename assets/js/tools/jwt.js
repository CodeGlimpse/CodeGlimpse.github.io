(function () {
    const container = document.getElementById('tool-jwt');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'en';
    const t = lang === 'zh-cn' ? {
        input: 'JWT 字符串', placeholder: '粘贴由三段组成的 JWT...', decode: '解析', example: '加载示例', clear: '清空',
        warning: '本工具仅解析令牌内容，不验证签名，也不能证明令牌可信。', header: 'Header', payload: 'Payload',
        claims: '时间声明', issuedAt: '签发时间 (iat)', notBefore: '生效时间 (nbf)', expiresAt: '过期时间 (exp)',
        noValue: '未设置', copyHeader: '复制 Header', copyPayload: '复制 Payload', copied: '已复制',
        copyFailed: '复制失败，请手动复制', required: '请输入 JWT', invalid: 'JWT 解析失败',
        decoded: 'JWT 已解析，签名未验证', expired: 'JWT 已过期，签名仍未验证',
        pending: 'JWT 尚未生效，签名仍未验证', noExpiry: 'JWT 已解析且未设置过期时间，签名未验证'
    } : {
        input: 'JWT String', placeholder: 'Paste a three-segment JWT...', decode: 'Decode', example: 'Load Example', clear: 'Clear',
        warning: 'This tool only decodes token content. It does not verify the signature or establish trust.', header: 'Header', payload: 'Payload',
        claims: 'Time Claims', issuedAt: 'Issued at (iat)', notBefore: 'Not before (nbf)', expiresAt: 'Expires at (exp)',
        noValue: 'Not set', copyHeader: 'Copy Header', copyPayload: 'Copy Payload', copied: 'Copied',
        copyFailed: 'Copy failed; please copy manually', required: 'Enter a JWT', invalid: 'JWT decoding failed',
        decoded: 'JWT decoded; signature not verified', expired: 'JWT is expired; signature not verified',
        pending: 'JWT is not active yet; signature not verified', noExpiry: 'JWT decoded with no expiration; signature not verified'
    };

    container.innerHTML = `
        <div class="tool-container tool-section-stack">
            <div class="tool-notice tool-notice--warning" role="note">${t.warning}</div>
            <div class="tool-field">
                <label class="tool-label" for="jwt-input">${t.input}</label>
                <textarea class="tool-input tool-code-input" id="jwt-input" rows="7" spellcheck="false" placeholder="${t.placeholder}"></textarea>
            </div>
            <div class="tool-actions">
                <button type="button" class="tool-btn tool-btn--primary" id="jwt-decode">${t.decode}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="jwt-example">${t.example}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="jwt-clear">${t.clear}</button>
            </div>
            <div class="tool-status" id="jwt-status" role="status" aria-live="polite"></div>
            <div class="tool-section-stack" id="jwt-output" hidden aria-hidden="true">
                <div class="tool-split">
                    <div class="tool-field">
                        <label class="tool-label" for="jwt-header">${t.header}</label>
                        <textarea class="tool-input tool-code-input" id="jwt-header" rows="8" readonly></textarea>
                        <button type="button" class="tool-btn tool-btn--copy" id="jwt-copy-header">${t.copyHeader}</button>
                    </div>
                    <div class="tool-field">
                        <label class="tool-label" for="jwt-payload">${t.payload}</label>
                        <textarea class="tool-input tool-code-input" id="jwt-payload" rows="8" readonly></textarea>
                        <button type="button" class="tool-btn tool-btn--copy" id="jwt-copy-payload">${t.copyPayload}</button>
                    </div>
                </div>
                <fieldset class="tool-fieldset">
                    <legend>${t.claims}</legend>
                    <dl class="tool-definition-grid">
                        <div><dt>${t.issuedAt}</dt><dd id="jwt-iat">${t.noValue}</dd></div>
                        <div><dt>${t.notBefore}</dt><dd id="jwt-nbf">${t.noValue}</dd></div>
                        <div><dt>${t.expiresAt}</dt><dd id="jwt-exp">${t.noValue}</dd></div>
                    </dl>
                </fieldset>
            </div>
        </div>
    `;

    const input = document.getElementById('jwt-input');
    const header = document.getElementById('jwt-header');
    const payload = document.getElementById('jwt-payload');
    const output = document.getElementById('jwt-output');
    const status = document.getElementById('jwt-status');
    const ui = window.CodeGlimpseToolUi;

    function formatClaim(value) {
        if (value === null) return t.noValue;
        const date = new Date(value * 1000);
        return Number.isNaN(date.getTime()) ? String(value) : `${date.toLocaleString()} (${value})`;
    }

    function decodeToken() {
        if (!input.value.trim()) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        try {
            const result = window.CodeGlimpseJwt.decode(input.value);
            header.value = JSON.stringify(result.header, null, 2);
            payload.value = JSON.stringify(result.payload, null, 2);
            document.getElementById('jwt-iat').textContent = formatClaim(result.claims.issuedAt);
            document.getElementById('jwt-nbf').textContent = formatClaim(result.claims.notBefore);
            document.getElementById('jwt-exp').textContent = formatClaim(result.claims.expiresAt);
            output.hidden = false;
            output.setAttribute('aria-hidden', 'false');

            if (result.status.expired) ui.setStatus(status, 'error', t.expired);
            else if (result.status.notActive) ui.setStatus(status, 'info', t.pending);
            else if (result.claims.expiresAt === null) ui.setStatus(status, 'info', t.noExpiry);
            else ui.setStatus(status, 'success', t.decoded);
        } catch (error) {
            output.hidden = true;
            output.setAttribute('aria-hidden', 'true');
            ui.setStatus(status, 'error', `${t.invalid}: ${error.message}`);
        }
    }

    function encodeSegment(value) {
        return btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }

    document.getElementById('jwt-decode').addEventListener('click', decodeToken);
    document.getElementById('jwt-example').addEventListener('click', () => {
        input.value = `${encodeSegment({ alg: 'none', typ: 'JWT' })}.${encodeSegment({ sub: '123', name: 'CodeGlimpse', iat: Math.floor(Date.now() / 1000) })}.`;
        decodeToken();
    });
    document.getElementById('jwt-clear').addEventListener('click', () => {
        input.value = '';
        header.value = '';
        payload.value = '';
        output.hidden = true;
        output.setAttribute('aria-hidden', 'true');
        ui.setStatus(status, '', '');
        input.focus();
    });
    document.getElementById('jwt-copy-header').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget,
        value: header.value,
        status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));
    document.getElementById('jwt-copy-payload').addEventListener('click', (event) => ui.copy({
        button: event.currentTarget,
        value: payload.value,
        status,
        messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
    }));
    ui.bindShortcut(input, decodeToken);
})();
