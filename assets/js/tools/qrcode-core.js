const qrcode = require('qrcode-generator');
const jsQR = require('jsqr');
qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

function encode(text, level = 'M') {
    if (typeof text !== 'string' || !text.length) throw new Error('empty');
    for (let index = 0; index < text.length; index++) {
        const code = text.charCodeAt(index);
        if (code >= 0xd800 && code <= 0xdbff) {
            const next = text.charCodeAt(++index);
            if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error('text');
        } else if (code >= 0xdc00 && code <= 0xdfff) throw new Error('text');
    }
    if (new TextEncoder().encode(text).length > 2000) throw new Error('length');
    if (!['L', 'M', 'Q', 'H'].includes(level)) throw new Error('level');
    const qr = qrcode(0, level);
    qr.addData(text, 'Byte');
    try { qr.make(); } catch { throw new Error('capacity'); }
    const size = qr.getModuleCount();
    const cells = new Uint8Array(size * size);
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) cells[row * size + col] = qr.isDark(row, col) ? 1 : 0;
    return { size, cells };
}
function decode(data, width, height) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 4000000
        || !(data instanceof Uint8ClampedArray) || data.length !== width * height * 4) throw new Error('pixels');
    return jsQR(data, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}
module.exports = { encode, decode };
