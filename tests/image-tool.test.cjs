const test = require('node:test');
const assert = require('node:assert/strict');
const image = require('../assets/js/tools/image-core.js');
function chunk(kind, payload) {
    const out = Buffer.alloc(payload.length + 12);
    out.writeUInt32BE(payload.length); out.write(kind, 4); payload.copy(out, 8);
    return out;
}
function png(width, height, animated = false) {
    const data = Buffer.alloc(13); data.writeUInt32BE(width); data.writeUInt32BE(height, 4);
    return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', data), ...(animated ? [chunk('acTL', Buffer.alloc(8))] : []), chunk('IEND', Buffer.alloc(0))]);
}
test('image inspection checks dimensions before a browser decodes the file', () => {
    assert.deepEqual(image.inspect(png(1200, 800)), { width: 1200, height: 800, format: 'png', mime: 'image/png' });
    assert.throws(() => image.inspect(png(20000, 1)), /pixels/);
    assert.throws(() => image.inspect(png(5000, 5000)), /pixels/);
    assert.throws(() => image.inspect(png(0, 50)), /invalid/);
    assert.throws(() => image.inspect(png(10, 10, true)), /animated/);
    assert.throws(() => image.inspect(Buffer.alloc(image.MAX_BYTES + 1)), /bytes/);
    assert.throws(() => image.inspect(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')), /format/);
    assert.throws(() => image.inspect(png(40, 30).subarray(0, 35)), /invalid/);
});
test('image inspection reads JPEG frame sizes and WebP animation flags', () => {
    const jpeg = Buffer.from([255,216,255,224,0,4,0,0,255,192,0,8,8,0,20,0,40,3,255,217]);
    assert.equal(image.inspect(jpeg).width, 40);
    assert.equal(image.inspect(jpeg).height, 20);
    const webp = Buffer.alloc(30); webp.write('RIFF'); webp.writeUInt32LE(22, 4); webp.write('WEBPVP8X', 8); webp.writeUInt32LE(10, 16); webp[24] = 39; webp[27] = 19;
    assert.equal(image.inspect(webp).width, 40);
    webp[20] = 2; assert.throws(() => image.inspect(webp), /animated/);
});
test('resizing preserves aspect ratio, prevents upscaling and caps portrait output', () => {
    assert.deepEqual(image.resize(1200, 800, 600), { width: 600, height: 400 });
    assert.equal(image.maxWidth(1000, 8000), 512);
    assert.deepEqual(image.resize(1000, 8000, 512), { width: 512, height: 4096 });
    assert.deepEqual(image.resize(1, 8000, 1), { width: 1, height: 4096 });
    for (const value of [0, 1201, 20.5, NaN]) assert.throws(() => image.resize(1200, 800, value), /width/);
    assert.throws(() => image.options('image/png', .85, '#ffffff'), /format/);
    assert.throws(() => image.options('image/jpeg', 2, '#ffffff'), /options/);
    assert.throws(() => image.options('image/jpeg', .8, 'red'), /options/);
});
