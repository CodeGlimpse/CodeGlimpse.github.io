const core = require('./image-core.js');

async function load(file) {
    if (!file || file.size === 0) throw new Error('invalid');
    if (file.size > core.MAX_BYTES) throw new Error('bytes');
    core.inspect(new Uint8Array(await file.arrayBuffer()));
    let image, close;
    try {
        if (typeof createImageBitmap === 'function') {
            image = await createImageBitmap(file, { imageOrientation: 'from-image' });
            close = () => image.close();
        } else {
            const url = URL.createObjectURL(file);
            image = new Image();
            try { await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; }); }
            finally { URL.revokeObjectURL(url); image.onload = null; image.onerror = null; }
            close = () => { image.src = ''; };
        }
        const width = image.width, height = image.height;
        core.dimensions(width, height);
        return { image, width, height, close, name: file.name, bytes: file.size };
    } catch {
        close?.();
        throw new Error('invalid');
    }
}
function thumbnail(canvas, source, width, height) {
    const ratio = Math.min(1, 360 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
}
function blob(canvas, mime, quality) {
    return new Promise((resolve, reject) => canvas.toBlob(result => {
        if (!result || result.type !== mime) reject(new Error('unsupported'));
        else resolve(result);
    }, mime, quality));
}
function download(data, name) {
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url; link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function size(bytes) { return bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KiB' : (bytes / 1024 / 1024).toFixed(2) + ' MiB'; }
module.exports = { load, thumbnail, blob, download, size };
