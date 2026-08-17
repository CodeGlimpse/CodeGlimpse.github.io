(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseUuid = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    const NIL_UUID = '00000000-0000-0000-0000-000000000000';
    const MAX_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const RFC_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    function randomBytes(source) {
        const bytes = new Uint8Array(16);
        if (typeof source === 'function') {
            const supplied = source(bytes.length);
            if (!supplied || supplied.length !== bytes.length) {
                throw new TypeError('Random source must return 16 bytes');
            }
            bytes.set(supplied);
            return bytes;
        }

        const cryptoApi = source?.getRandomValues ? source : root?.crypto;
        if (!cryptoApi?.getRandomValues) {
            throw new Error('Secure random generation is unavailable');
        }
        cryptoApi.getRandomValues(bytes);
        return bytes;
    }

    function format(bytes) {
        if (!bytes || bytes.length !== 16) throw new TypeError('UUID requires 16 bytes');
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    function generate(source) {
        const bytes = randomBytes(source);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        return format(bytes);
    }

    function parseCount(value) {
        const count = Number(value);
        if (!Number.isInteger(count) || count < 1 || count > 100) {
            throw new RangeError('UUID count must be an integer between 1 and 100');
        }
        return count;
    }

    function generateMany(count, source) {
        return Array.from({ length: parseCount(count) }, () => generate(source));
    }

    function validate(input) {
        const value = String(input).trim().toLowerCase();
        return value === NIL_UUID || value === MAX_UUID || RFC_UUID.test(value);
    }

    function inspect(input) {
        const value = String(input).trim().toLowerCase();
        if (!validate(value)) throw new SyntaxError('Invalid RFC 9562 UUID');
        if (value === NIL_UUID) return { type: 'nil', value, variant: null, version: null };
        if (value === MAX_UUID) return { type: 'max', value, variant: null, version: null };
        return {
            type: 'uuid',
            value,
            variant: 'rfc9562',
            version: Number.parseInt(value[14], 16)
        };
    }

    return { MAX_UUID, NIL_UUID, format, generate, generateMany, inspect, validate };
});
