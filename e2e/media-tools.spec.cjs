const { test, expect } = require('@playwright/test');
const imageCore = require('../assets/js/tools/image-core.js');

test.beforeEach(async ({ page }) => {
    await page.route(/^https:\/\/(?:www\.googletagmanager\.com|www\.clarity\.ms|hm\.baidu\.com)\//i,
        route => route.fulfill({ body: '', contentType: 'application/javascript' }));
});
async function open(page, path) {
    await page.goto(path);
    const dismiss = page.locator('[data-privacy-dismiss]');
    if (await dismiss.isVisible()) await dismiss.click();
}
async function fixture(page, mime = 'image/png', width = 80, height = 40) {
    const bytes = await page.evaluate(async ({ mime, width, height }) => {
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = '#ff0000'; context.fillRect(width / 4, height / 4, width / 2, height / 2);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, mime, .9));
        return Array.from(new Uint8Array(await blob.arrayBuffer()));
    }, { mime, width, height });
    return Buffer.from(bytes);
}
async function download(page, selector) {
    const event = page.waitForEvent('download');
    await page.locator(selector).click();
    const item = await event;
    const stream = await item.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return { buffer: Buffer.concat(chunks), name: item.suggestedFilename() };
}
async function corner(page, buffer, mime) {
    return page.evaluate(async ({ data, mime }) => {
        const image = await createImageBitmap(new Blob([new Uint8Array(data)], { type: mime }));
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
        const pixel = Array.from(context.getImageData(0, 0, 1, 1).data); image.close();
        return pixel;
    }, { data: Array.from(buffer), mime });
}

for (const language of ['zh-cn', 'en']) {
    const prefix = language === 'en' ? '/en' : '';
    test(`QR codes round-trip Unicode through a downloaded PNG in ${language}`, async ({ page }) => {
        await open(page, prefix + '/tools/qrcode/');
        const text = '你好，Fernweh 👋 https://example.com/?a=1&b=2';
        await page.locator('#qr-input').fill(text);
        await page.locator('#qr-level').selectOption('H');
        await page.locator('#qr-generate').click();
        await expect(page.locator('#qr-preview')).toBeVisible();
        const png = await download(page, '#qr-download');
        expect(imageCore.inspect(png.buffer)).toMatchObject({ format: 'png', width: 512, height: 512 });
        await page.locator('#qr-file').setInputFiles({ name: 'code.png', mimeType: 'image/png', buffer: png.buffer });
        await expect(page.locator('#qr-output')).toHaveValue(text);
        await expect(page).toHaveURL(new RegExp(prefix + '/tools/qrcode/$'));
        await expect(page.locator('.tool-share-panel')).toHaveCount(0);
        await expect(page.locator('#tool-qrcode')).toHaveAttribute('data-clarity-mask', 'true');
        await page.locator('#qr-input').fill('changed');
        await expect(page.locator('#qr-download')).toBeDisabled();
        await page.locator('#qr-clear').click();
        await expect(page.locator('#qr-output')).toHaveValue('');
        await expect(page.locator('#qr-preview')).toBeHidden();
    });

    test(`image resizing exports actual JPEG and WebP pixels in ${language}`, async ({ page }) => {
        await open(page, prefix + '/tools/image/');
        const input = await fixture(page);
        await page.locator('#image-file').setInputFiles({ name: 'transparent.png', mimeType: 'image/png', buffer: input });
        await expect(page.locator('#image-width')).toBeEnabled();
        await page.locator('#image-width').fill('40');
        await expect(page.locator('#image-height')).toHaveValue('20');
        await page.locator('#image-background').evaluate(input => { input.value = '#00ff00'; input.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.locator('#image-convert').click();
        await expect(page.locator('#image-download')).toBeEnabled();
        const jpeg = await download(page, '#image-download');
        expect(imageCore.inspect(jpeg.buffer)).toMatchObject({ format: 'jpeg', width: 40, height: 20 });
        expect(jpeg.name).toMatch(/40x20\.jpg$/);
        const rgb = await corner(page, jpeg.buffer, 'image/jpeg');
        expect(rgb[1]).toBeGreaterThan(220); expect(rgb[0]).toBeLessThan(40); expect(rgb[3]).toBe(255);
        await page.locator('#image-format').selectOption('image/webp');
        await expect(page.locator('#image-download')).toBeDisabled();
        await page.locator('#image-convert').click();
        await expect(page.locator('#image-download')).toBeEnabled();
        const webp = await download(page, '#image-download');
        expect(imageCore.inspect(webp.buffer)).toMatchObject({ format: 'webp', width: 40, height: 20 });
        expect((await corner(page, webp.buffer, 'image/webp'))[3]).toBe(0);
        await expect(page.locator('.tool-share-panel')).toHaveCount(0);
        await page.locator('#image-clear').click();
        await expect(page.locator('#image-original')).toBeHidden();
        await expect(page.locator('#image-download')).toBeDisabled();
    });
}

test('image output respects JPEG orientation and drops original EXIF metadata', async ({ page }) => {
    await open(page, '/tools/image/');
    const original = await fixture(page, 'image/jpeg', 40, 20);
    const exif = Buffer.alloc(32); exif.write('Exif\0\0'); exif.write('II', 6); exif.writeUInt16LE(42, 8); exif.writeUInt32LE(8, 10); exif.writeUInt16LE(1, 14);
    exif.writeUInt16LE(0x112, 16); exif.writeUInt16LE(3, 18); exif.writeUInt32LE(1, 20); exif.writeUInt16LE(6, 24);
    const segment = Buffer.alloc(4); segment[0] = 255; segment[1] = 225; segment.writeUInt16BE(exif.length + 2, 2);
    const input = Buffer.concat([original.subarray(0, 2), segment, exif, original.subarray(2)]);
    await page.locator('#image-file').setInputFiles({ name: 'rotated.jpg', mimeType: 'image/jpeg', buffer: input });
    await expect(page.locator('#image-original-info')).toContainText('20 × 40');
    await page.locator('#image-width').fill('10');
    await page.locator('#image-convert').click();
    await expect(page.locator('#image-download')).toBeEnabled();
    const result = await download(page, '#image-download');
    expect(imageCore.inspect(result.buffer)).toMatchObject({ width: 10, height: 20 });
    expect(result.buffer.includes(Buffer.from('Exif\0\0'))).toBe(false);
});

test('media tools report invalid images and stay usable on a narrow dark screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.emulateMedia({ colorScheme: 'dark' });
    for (const id of ['qrcode', 'image']) {
        await open(page, '/tools/' + id + '/');
        const selector = id === 'qrcode' ? '#qr-file' : '#image-file';
        await page.locator(selector).setInputFiles({ name: 'not-an-image.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg><script>alert(1)</script></svg>') });
        await expect(page.locator(id === 'qrcode' ? '#qr-decode-status' : '#image-status')).toContainText('PNG');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.locator('[data-tool-focus-toggle]').click();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
});

test('cached QR generation and reading work without a network connection', async ({ page, context }) => {
    await open(page, '/tools/qrcode/');
    await page.locator('#qr-input').fill('cache warmup');
    await page.locator('#qr-generate').click();
    await expect(page.locator('#qr-download')).toBeEnabled();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await page.locator('#qr-input').fill('offline 二维码');
    await page.locator('#qr-generate').click();
    await expect(page.locator('#qr-download')).toBeEnabled();
    await context.setOffline(true);
    await page.reload();
    await page.locator('#qr-input').fill('offline 二维码');
    await page.locator('#qr-generate').click();
    await expect(page.locator('#qr-download')).toBeEnabled();
    const png = await download(page, '#qr-download');
    await page.locator('#qr-file').setInputFiles({ name: 'offline.png', mimeType: 'image/png', buffer: png.buffer });
    await expect(page.locator('#qr-output')).toHaveValue('offline 二维码');
});

test.describe('isolated QR work', () => {
    test.use({ serviceWorkers: 'block' });
    test('an unresponsive QR operation times out and leaves a usable retry button', async ({ page }) => {
        await page.clock.install();
        await page.route('**/qrcode-worker.*.js', route => route.fulfill({ contentType: 'application/javascript', body: 'self.onmessage=()=>{};' }));
        await open(page, '/tools/qrcode/');
        await page.locator('#qr-input').fill('timeout');
        await page.locator('#qr-generate').click();
        await expect(page.locator('#qr-generate')).toBeDisabled();
        await page.clock.runFor(6001);
        await expect(page.locator('#qr-encode-status')).toContainText('超时');
        await expect(page.locator('#qr-generate')).toBeEnabled();
    });
    test('clearing a pending operation prevents a stale QR result', async ({ page }) => {
        await page.route('**/qrcode-worker.*.js', route => route.fulfill({ contentType: 'application/javascript', body: 'self.onmessage=()=>{ setTimeout(()=>self.postMessage({error:"capacity"}),250); };' }));
        await open(page, '/tools/qrcode/');
        await page.locator('#qr-input').fill('cancel');
        await page.locator('#qr-generate').click();
        await page.locator('#qr-clear').click();
        await expect(page.locator('#qr-input')).toBeFocused();
        await expect(page.locator('#qr-download')).toBeDisabled();
        await expect(page.locator('#qr-encode-status')).toBeEmpty();
        await page.waitForTimeout(350);
        await expect(page.locator('#qr-encode-status')).toBeEmpty();
    });
});
