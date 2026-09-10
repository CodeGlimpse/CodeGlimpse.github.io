(function () {
    const root = document.getElementById('tool-qrcode');
    if (!root) return;
    const file = require('./image-file.js');
    const worker = require('./worker-task.js');
    const errors = require('./media-errors.js');
    const en = root.dataset.lang === 'en';
    const t = en ? {
        encode: 'Generate a QR code', input: 'Text or URL', level: 'Error correction', size: 'PNG size', generate: 'Generate', download: 'Download PNG', clear: 'Clear',
        decode: 'Read a QR image', file: 'Choose QR image', output: 'Decoded content', copy: 'Copy content', processing: 'Processing…', ready: 'QR code ready.', noCode: 'No QR code found. Crop closer to the code and try a sharper image.', decoded: 'QR content decoded. Links are not opened automatically.',
        hint: 'Up to 2000 UTF-8 bytes. Higher correction needs more space.', fileHint: 'Static PNG, JPEG, WebP; up to 20 MiB and 16 million pixels. Reads one QR code per image.', copied: 'Copied', failed: 'Copy failed; copy the text manually.',
    } : {
        encode: '生成二维码', input: '文字或网址', level: '纠错等级', size: 'PNG 尺寸', generate: '生成', download: '下载 PNG', clear: '清空',
        decode: '解析二维码图片', file: '选择二维码图片', output: '识别内容', copy: '复制内容', processing: '正在处理…', ready: '二维码已生成。', noCode: '未找到二维码，请裁剪到二维码附近并换用更清晰的图片。', decoded: '识别完成，不会自动打开其中的网址。',
        hint: '最多 2000 个 UTF-8 字节；纠错等级越高，可容纳的内容越少。', fileHint: '支持静态 PNG、JPEG、WebP，最大 20 MiB、1600 万像素，每张图片识别一个二维码。', copied: '已复制', failed: '复制失败，请手动复制文本。',
    };
    root.innerHTML = `<div class="tool-container media-tool media-columns">
        <section><h3>${t.encode}</h3><label class="tool-label" for="qr-input">${t.input}</label><textarea class="tool-input" id="qr-input" rows="5" maxlength="2000" spellcheck="false"></textarea><p class="media-hint">${t.hint}</p>
        <div class="media-options"><label>${t.level}<select class="tool-input" id="qr-level"><option>L</option><option selected>M</option><option>Q</option><option>H</option></select></label><label>${t.size}<select class="tool-input" id="qr-size"><option>256</option><option selected>512</option><option>1024</option><option>1536</option></select></label></div>
        <div class="tool-actions"><button class="tool-btn tool-btn--primary" id="qr-generate" type="button">${t.generate}</button><button class="tool-btn" id="qr-clear" type="button">${t.clear}</button></div>
        <p class="tool-status" id="qr-encode-status" role="status" aria-live="polite"></p><canvas id="qr-preview" class="qr-preview" role="img" aria-label="${t.encode}" hidden></canvas><button class="tool-btn tool-btn--primary" id="qr-download" type="button" disabled>${t.download}</button></section>
        <section><h3>${t.decode}</h3><label class="tool-label" for="qr-file">${t.file}</label><input class="tool-input" id="qr-file" type="file" accept="image/png,image/jpeg,image/webp"><p class="media-hint">${t.fileHint}</p>
        <p class="tool-status" id="qr-decode-status" role="status" aria-live="polite"></p><label class="tool-label" for="qr-output">${t.output}</label><textarea class="tool-input" id="qr-output" rows="7" readonly></textarea><button class="tool-btn" id="qr-copy" type="button" disabled>${t.copy}</button></section></div>`;
    const get = id => root.querySelector('#qr-' + id);
    let encodeRevision = 0, decodeRevision = 0, encodeJob = null, decodeJob = null, png = null;
    function invalidate() { encodeRevision += 1; encodeJob?.cancel(); png = null; get('download').disabled = true; get('preview').hidden = true; get('generate').disabled = false; get('encode-status').textContent = ''; }
    for (const id of ['input', 'level', 'size']) get(id).addEventListener('input', invalidate);
    get('generate').addEventListener('click', async () => {
        invalidate(); const token = encodeRevision;
        get('generate').disabled = true; get('encode-status').textContent = t.processing;
        try {
            encodeJob = worker.run(root.dataset.toolWorker, { kind: 'encode', text: get('input').value, level: get('level').value });
            const matrix = await encodeJob.promise;
            if (token !== encodeRevision) return;
            const side = Number(get('size').value);
            if (![256, 512, 1024, 1536].includes(side)) throw new Error('size');
            const scale = Math.floor(side / (matrix.size + 8));
            if (scale < 2) throw new Error('size');
            const canvas = get('preview'); canvas.width = canvas.height = side;
            const context = canvas.getContext('2d');
            context.fillStyle = '#ffffff'; context.fillRect(0, 0, side, side);
            context.fillStyle = '#000000';
            const margin = Math.floor((side - matrix.size * scale) / 2);
            for (let row = 0; row < matrix.size; row++) for (let col = 0; col < matrix.size; col++) {
                if (matrix.cells[row * matrix.size + col]) context.fillRect(margin + col * scale, margin + row * scale, scale, scale);
            }
            const data = await file.blob(canvas, 'image/png');
            if (token !== encodeRevision) return;
            png = data; canvas.hidden = false; get('download').disabled = false; get('encode-status').textContent = t.ready;
        } catch (error) { if (token === encodeRevision) get('encode-status').textContent = errors.message(error, en); }
        finally { if (token === encodeRevision) get('generate').disabled = false; }
    });
    get('file').addEventListener('change', async () => {
        decodeRevision += 1; const token = decodeRevision;
        decodeJob?.cancel(); get('output').value = ''; get('copy').disabled = true; get('decode-status').textContent = '';
        const selected = get('file').files[0];
        if (!selected) return;
        get('decode-status').textContent = t.processing;
        let source, canvas;
        try {
            source = await file.load(selected);
            if (token !== decodeRevision) return;
            const ratio = Math.min(1, 1536 / Math.max(source.width, source.height));
            canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(source.width * ratio)); canvas.height = Math.max(1, Math.round(source.height * ratio));
            const context = canvas.getContext('2d', { willReadFrequently: true });
            context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(source.image, 0, 0, canvas.width, canvas.height);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
            decodeJob = worker.run(root.dataset.toolWorker, { kind: 'decode', pixels, width: canvas.width, height: canvas.height }, [pixels.buffer]);
            const decoded = await decodeJob.promise;
            if (token !== decodeRevision) return;
            get('output').value = decoded ?? '';
            get('copy').disabled = !decoded;
            get('decode-status').textContent = decoded === null ? t.noCode : t.decoded;
        } catch (error) { if (token === decodeRevision) get('decode-status').textContent = errors.message(error, en); }
        finally { source?.close(); if (canvas) canvas.width = canvas.height = 0; }
    });
    get('download').addEventListener('click', () => { if (png) file.download(png, 'qr-code.png'); });
    get('copy').addEventListener('click', event => window.CodeGlimpseToolUi.copy({ button: event.currentTarget, value: get('output').value, status: get('decode-status'), messages: { empty: t.noCode, copied: t.copied, copyFailed: t.failed } }));
    get('clear').addEventListener('click', () => {
        invalidate(); decodeRevision += 1; decodeJob?.cancel(); get('input').value = ''; get('file').value = ''; get('output').value = ''; get('copy').disabled = true; get('decode-status').textContent = '';
        get('preview').width = get('preview').height = 0; get('input').focus();
    });
    window.addEventListener('pagehide', event => { if (!event.persisted) { invalidate(); decodeRevision += 1; decodeJob?.cancel(); } });
})();
