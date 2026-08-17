(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseJwt = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function decodeUtf8(binary) {
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        if (typeof TextDecoder === 'function') {
            return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        }

        return decodeURIComponent(Array.from(bytes, (byte) => (
            `%${byte.toString(16).padStart(2, '0')}`
        )).join(''));
    }

    function decodeBase64Url(segment) {
        const value = String(segment);
        if (!value || !/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
            throw new SyntaxError('Invalid Base64URL segment');
        }

        const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
            .padEnd(Math.ceil(value.length / 4) * 4, '=');
        try {
            return decodeUtf8(atob(base64));
        } catch (error) {
            throw new SyntaxError(`Invalid Base64URL segment: ${error.message}`);
        }
    }

    function decodeJsonSegment(segment, name) {
        let value;
        try {
            value = JSON.parse(decodeBase64Url(segment));
        } catch (error) {
            throw new SyntaxError(`Invalid JWT ${name}: ${error.message}`);
        }

        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new SyntaxError(`JWT ${name} must be a JSON object`);
        }
        return value;
    }

    function numericDate(value) {
        return typeof value === 'number' && Number.isFinite(value) ? value : null;
    }

    function decode(token, nowMilliseconds = Date.now()) {
        const parts = String(token).trim().split('.');
        if (parts.length !== 3 || !parts[0] || !parts[1]) {
            throw new SyntaxError('JWT must contain three dot-separated segments');
        }

        const now = Number(nowMilliseconds);
        if (!Number.isFinite(now)) throw new TypeError('Current time must be a finite number');

        const header = decodeJsonSegment(parts[0], 'header');
        const payload = decodeJsonSegment(parts[1], 'payload');
        const issuedAt = numericDate(payload.iat);
        const expiresAt = numericDate(payload.exp);
        const notBefore = numericDate(payload.nbf);
        const nowSeconds = Math.floor(now / 1000);

        return {
            header,
            payload,
            signature: parts[2],
            claims: { expiresAt, issuedAt, notBefore },
            status: {
                expired: expiresAt !== null && nowSeconds >= expiresAt,
                notActive: notBefore !== null && nowSeconds < notBefore
            }
        };
    }

    return { decode, decodeBase64Url };
});
