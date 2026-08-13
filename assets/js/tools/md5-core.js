(function (root, factory) {
    const api = factory(root);

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) root.CodeGlimpseMd5 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    function utf8Bytes(value) {
        const text = String(value).replace(/\r\n/g, '\n');
        if (root?.TextEncoder) return new root.TextEncoder().encode(text);
        return Uint8Array.from(unescape(encodeURIComponent(text)), char => char.charCodeAt(0));
    }

    function leftRotate(value, amount) {
        return (value << amount) | (value >>> (32 - amount));
    }

    function hash(value) {
        const bytes = utf8Bytes(value);
        const bitLength = bytes.length * 8;
        const paddedLength = ((bytes.length + 9 + 63) >> 6) << 6;
        const padded = new Uint8Array(paddedLength);
        padded.set(bytes);
        padded[bytes.length] = 0x80;
        const view = new DataView(padded.buffer);
        view.setUint32(paddedLength - 8, bitLength >>> 0, true);
        view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);

        const shifts = [
            7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
            5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
            4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
            6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
        ];
        const constants = Array.from({ length: 64 }, (_, index) =>
            Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0
        );
        let a0 = 0x67452301;
        let b0 = 0xefcdab89;
        let c0 = 0x98badcfe;
        let d0 = 0x10325476;

        for (let offset = 0; offset < padded.length; offset += 64) {
            const words = Array.from({ length: 16 }, (_, index) => view.getUint32(offset + index * 4, true));
            let a = a0;
            let b = b0;
            let c = c0;
            let d = d0;

            for (let index = 0; index < 64; index += 1) {
                let f;
                let g;
                if (index < 16) {
                    f = (b & c) | (~b & d);
                    g = index;
                } else if (index < 32) {
                    f = (d & b) | (~d & c);
                    g = (5 * index + 1) % 16;
                } else if (index < 48) {
                    f = b ^ c ^ d;
                    g = (3 * index + 5) % 16;
                } else {
                    f = c ^ (b | ~d);
                    g = (7 * index) % 16;
                }
                const next = d;
                const sum = (a + f + constants[index] + words[g]) >>> 0;
                d = c;
                c = b;
                b = (b + leftRotate(sum, shifts[index])) >>> 0;
                a = next;
            }

            a0 = (a0 + a) >>> 0;
            b0 = (b0 + b) >>> 0;
            c0 = (c0 + c) >>> 0;
            d0 = (d0 + d) >>> 0;
        }

        return [a0, b0, c0, d0].map(word => {
            let output = '';
            for (let index = 0; index < 4; index += 1) {
                output += ((word >>> (index * 8)) & 0xff).toString(16).padStart(2, '0');
            }
            return output;
        }).join('');
    }

    return { hash };
});
