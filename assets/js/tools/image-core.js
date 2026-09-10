(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.CodeGlimpseImage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const MAX_BYTES = 20 * 1024 * 1024;
    const MAX_PIXELS = 16000000;
    const MAX_SIDE = 8192;
    const MAX_OUTPUT = 4096;
    const fail = code => { throw new Error(code); };
    function dimensions(width, height) {
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) fail('invalid');
        if (width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS) fail('pixels');
    }
    function inspect(bytes) {
        if (!(bytes instanceof Uint8Array) || bytes.length < 12) fail('invalid');
        if (bytes.length > MAX_BYTES) fail('bytes');
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const text = (offset, length = 4) => String.fromCharCode(...bytes.subarray(offset, offset + length));
        let width, height, format, animated = false;
        if (bytes[0] === 137 && text(1, 3) === 'PNG' && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) {
            if (bytes.length < 33 || text(12) !== 'IHDR' || view.getUint32(8) !== 13) fail('invalid');
            width = view.getUint32(16); height = view.getUint32(20); format = 'png';
            let ended = false;
            for (let offset = 8; offset + 12 <= bytes.length;) {
                const length = view.getUint32(offset);
                if (offset + length + 12 > bytes.length) fail('invalid');
                if (text(offset + 4) === 'acTL') animated = true;
                const last = text(offset + 4) === 'IEND';
                offset += length + 12;
                if (last) { if (length !== 0) fail('invalid'); ended = true; break; }
            }
            if (!ended) fail('invalid');
        } else if (bytes[0] === 255 && bytes[1] === 216) {
            format = 'jpeg';
            let offset = 2;
            while (offset < bytes.length) {
                if (bytes[offset++] !== 255) fail('invalid');
                while (bytes[offset] === 255) offset += 1;
                const marker = bytes[offset++];
                if (marker === 0xd9 || marker === 0xda) break;
                if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
                if (offset + 2 > bytes.length) fail('invalid');
                const length = view.getUint16(offset);
                if (length < 2 || offset + length > bytes.length) fail('invalid');
                if ([0xc0, 0xc1, 0xc2].includes(marker)) {
                    if (length < 8) fail('invalid');
                    height = view.getUint16(offset + 3); width = view.getUint16(offset + 5); break;
                }
                offset += length;
            }
            if (!width || !height) fail('invalid');
        } else if (text(0) === 'RIFF' && text(8) === 'WEBP') {
            format = 'webp';
            const end = view.getUint32(4, true) + 8;
            if (end > bytes.length || end < 20) fail('invalid');
            const u24 = offset => bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16);
            for (let offset = 12; offset + 8 <= end;) {
                const kind = text(offset), length = view.getUint32(offset + 4, true), start = offset + 8;
                if (start + length > end) fail('invalid');
                if (kind === 'VP8X') {
                    if (length < 10) fail('invalid');
                    animated ||= Boolean(bytes[start] & 2);
                    width = 1 + u24(start + 4); height = 1 + u24(start + 7);
                } else if (kind === 'ANIM' || kind === 'ANMF') animated = true;
                else if (!width && kind === 'VP8 ' && length >= 10) {
                    if (bytes[start + 3] !== 0x9d || bytes[start + 4] !== 1 || bytes[start + 5] !== 0x2a) fail('invalid');
                    width = view.getUint16(start + 6, true) & 0x3fff; height = view.getUint16(start + 8, true) & 0x3fff;
                } else if (!width && kind === 'VP8L' && length >= 5 && bytes[start] === 0x2f) {
                    const bits = view.getUint32(start + 1, true);
                    width = 1 + (bits & 0x3fff); height = 1 + ((bits >>> 14) & 0x3fff);
                }
                offset = start + length + (length % 2);
            }
        } else fail('format');
        if (animated) fail('animated');
        dimensions(width, height);
        return { width, height, format, mime: 'image/' + format };
    }
    function maxWidth(width, height) {
        dimensions(width, height);
        return Math.max(1, Math.floor(width * Math.min(1, MAX_OUTPUT / Math.max(width, height))));
    }
    function resize(width, height, requestedWidth) {
        dimensions(width, height);
        const target = Number(requestedWidth);
        if (!Number.isInteger(target) || target < 1 || target > maxWidth(width, height)) fail('width');
        return { width: target, height: Math.min(MAX_OUTPUT, Math.max(1, Math.round(height * target / width))) };
    }
    function options(mime, quality, background) {
        if (!['image/jpeg', 'image/webp'].includes(mime)) fail('format');
        const q = Number(quality);
        if (!Number.isFinite(q) || q < .1 || q > 1 || !/^#[0-9a-f]{6}$/i.test(background)) fail('options');
        return { mime, quality: q, background };
    }
    return { MAX_BYTES, MAX_PIXELS, MAX_SIDE, MAX_OUTPUT, inspect, dimensions, maxWidth, resize, options };
});
