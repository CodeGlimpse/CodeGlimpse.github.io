const test = require('node:test');
const assert = require('node:assert/strict');
const qr = require('../assets/js/tools/qrcode-core.js');

function pixels(matrix, scale = 4) {
    const width = (matrix.size + 8) * scale;
    const data = new Uint8ClampedArray(width * width * 4).fill(255);
    for (let row = 0; row < matrix.size; row++) for (let col = 0; col < matrix.size; col++) {
        if (!matrix.cells[row * matrix.size + col]) continue;
        for (let y = 0; y < scale; y++) for (let x = 0; x < scale; x++) {
            const index = (((row + 4) * scale + y) * width + (col + 4) * scale + x) * 4;
            data[index] = data[index + 1] = data[index + 2] = 0;
        }
    }
    return { data, width };
}
test('QR encoding and independent decoding preserve Unicode at all correction levels', () => {
    for (const level of ['L', 'M', 'Q', 'H']) for (const text of ['https://example.com/?a=1&b=2', '你好，Fernweh 👋\n日本語', '  ']) {
        const input = pixels(qr.encode(text, level));
        assert.equal(qr.decode(input.data, input.width, input.width), text);
    }
});
test('QR encoding rejects invalid Unicode, excessive bytes and insufficient capacity', () => {
    assert.throws(() => qr.encode(''), /empty/);
    assert.throws(() => qr.encode('\ud800'), /text/);
    assert.throws(() => qr.encode('\udc00'), /text/);
    assert.throws(() => qr.encode('汉'.repeat(667)), /length/);
    assert.throws(() => qr.encode('hello', 'unknown'), /level/);
    assert.throws(() => qr.encode('x'.repeat(2000), 'H'), /capacity/);
});
test('QR decoding returns no result for a blank image and enforces pixel limits', () => {
    assert.equal(qr.decode(new Uint8ClampedArray(40 * 40 * 4).fill(255), 40, 40), null);
    assert.throws(() => qr.decode(new Uint8ClampedArray(4), 3000, 3000), /pixels/);
    assert.throws(() => qr.decode(new Uint8ClampedArray(4), 2, 2), /pixels/);
});
