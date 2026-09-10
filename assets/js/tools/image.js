(function () {
    const root = document.getElementById('tool-image');
    if (!root) return;
    const core = require('./image-core.js');
    const file = require('./image-file.js');
    const errors = require('./media-errors.js');
    const en = root.dataset.lang === 'en';
    const t = en ? {
        file: 'Choose image', width: 'Output width', height: 'Output height', format: 'Output format', quality: 'Quality', background: 'JPEG background',
        generate: 'Process image', download: 'Download image', clear: 'Clear', original: 'Original', result: 'Result', loading: 'Reading image…', processing: 'Processing image…', ready: 'Image ready to download.',
        limits: 'Static PNG, JPEG, WebP. Up to 20 MiB and 16 million pixels. Aspect ratio is preserved; no upscaling.',
    } : {
        file: '选择图片', width: '输出宽度', height: '输出高度', format: '输出格式', quality: '质量', background: 'JPEG 背景颜色',
        generate: '处理图片', download: '下载图片', clear: '清空', original: '原图', result: '处理结果', loading: '正在读取图片…', processing: '正在处理图片…', ready: '处理完成，可以下载。',
        limits: '支持静态 PNG、JPEG、WebP，最大 20 MiB、1600 万像素。保持宽高比，不放大图片。',
    };
    root.innerHTML = `<div class="tool-container media-tool">
        <label class="tool-label" for="image-file">${t.file}</label><input class="tool-input" id="image-file" type="file" accept="image/png,image/jpeg,image/webp">
        <p class="media-hint">${t.limits}</p>
        <div class="media-options">
            <label>${t.width}<input class="tool-input" id="image-width" type="number" min="1" step="1" disabled></label>
            <label>${t.height}<input class="tool-input" id="image-height" type="text" readonly></label>
            <label>${t.format}<select class="tool-input" id="image-format"><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label>
            <label>${t.quality} <output id="image-quality-value">85%</output><input id="image-quality" type="range" min="0.1" max="1" step="0.05" value="0.85"></label>
            <label>${t.background}<input id="image-background" type="color" value="#ffffff"></label>
        </div>
        <div class="tool-actions"><button class="tool-btn tool-btn--primary" id="image-convert" type="button" disabled>${t.generate}</button><button class="tool-btn" id="image-clear" type="button">${t.clear}</button></div>
        <p class="tool-status" id="image-status" role="status" aria-live="polite"></p>
        <div class="media-columns"><section id="image-original" hidden><h3>${t.original}</h3><p id="image-original-info"></p><canvas id="image-original-preview" role="img" aria-label="${t.original}"></canvas></section>
        <section id="image-result" hidden><h3>${t.result}</h3><p id="image-result-info"></p><canvas id="image-result-preview" role="img" aria-label="${t.result}"></canvas><button class="tool-btn tool-btn--primary" id="image-download" type="button" disabled>${t.download}</button></section></div>
        </div>`;
    const get = id => root.querySelector('#image-' + id);
    const input = get('file'), width = get('width'), height = get('height'), mime = get('format'), quality = get('quality'), background = get('background');
    let source = null, result = null, revision = 0, loadRevision = 0, busy = false;
    const status = text => { get('status').textContent = text; };
    function invalidate() {
        revision += 1; result = null;
        get('download').disabled = true; get('result').hidden = true;
        get('convert').disabled = !source || busy;
    }
    function dimensions() {
        height.value = '';
        if (source) { try { height.value = core.resize(source.width, source.height, width.value).height; } catch { /* conversion explains invalid input */ } }
    }
    input.addEventListener('change', async () => {
        invalidate(); const token = ++loadRevision;
        source?.close(); source = null; width.disabled = true; width.value = ''; height.value = '';
        get('convert').disabled = true; get('original').hidden = true;
        if (!input.files[0]) { status(''); return; }
        status(t.loading);
        try {
            const loaded = await file.load(input.files[0]);
            if (token !== loadRevision) { loaded.close(); return; }
            source = loaded;
            width.max = core.maxWidth(source.width, source.height);
            width.value = Math.min(1920, Number(width.max)); width.disabled = false; dimensions();
            get('original-info').textContent = source.name + ' · ' + source.width + ' × ' + source.height + ' · ' + file.size(source.bytes);
            file.thumbnail(get('original-preview'), source.image, source.width, source.height);
            get('original').hidden = false; get('convert').disabled = busy; status('');
        } catch (error) { if (token === loadRevision) status(errors.message(error, en)); }
    });
    for (const control of [width, mime, quality, background]) control.addEventListener('input', () => {
        invalidate(); dimensions(); status('');
        get('quality-value').textContent = Math.round(Number(quality.value) * 100) + '%';
        background.disabled = mime.value !== 'image/jpeg';
    });
    get('convert').addEventListener('click', async () => {
        if (!source || busy) return;
        invalidate(); const token = revision;
        const original = source;
        let canvas;
        try {
            const size = core.resize(original.width, original.height, width.value);
            const settings = core.options(mime.value, quality.value, background.value);
            busy = true; get('convert').disabled = true; status(t.processing);
            canvas = document.createElement('canvas'); canvas.width = size.width; canvas.height = size.height;
            const context = canvas.getContext('2d');
            if (settings.mime === 'image/jpeg') { context.fillStyle = settings.background; context.fillRect(0, 0, size.width, size.height); }
            context.drawImage(original.image, 0, 0, size.width, size.height);
            const data = await file.blob(canvas, settings.mime, settings.quality);
            if (token !== revision) return;
            const change = Math.round((1 - data.size / original.bytes) * 100);
            const changeText = change >= 0 ? (en ? `${change}% smaller` : `减少 ${change}%`) : (en ? `${-change}% larger` : `增加 ${-change}%`);
            get('result-info').textContent = size.width + ' × ' + size.height + ' · ' + file.size(data.size) + ' · ' + changeText;
            file.thumbnail(get('result-preview'), canvas, size.width, size.height);
            result = { data, name: original.name.replace(/\.[^.]*$/, '').replace(/[\\/:*?"<>|]/g, '_') + '-' + size.width + 'x' + size.height + (settings.mime === 'image/jpeg' ? '.jpg' : '.webp') };
            get('result').hidden = false; get('download').disabled = false; status(t.ready);
        } catch (error) { if (token === revision) status(errors.message(error, en)); }
        finally { if (canvas) canvas.width = canvas.height = 0; busy = false; get('convert').disabled = !source; }
    });
    get('download').addEventListener('click', () => { if (result) file.download(result.data, result.name); });
    get('clear').addEventListener('click', () => {
        invalidate(); loadRevision += 1; source?.close(); source = null; input.value = ''; width.value = ''; width.disabled = true; height.value = '';
        mime.value = 'image/jpeg'; quality.value = '.85'; background.value = '#ffffff'; background.disabled = false;
        get('quality-value').textContent = '85%'; get('original').hidden = true; get('convert').disabled = true; status(''); input.focus();
        get('original-preview').width = get('result-preview').width = 0;
    });
    window.addEventListener('pagehide', event => { if (!event.persisted) { revision += 1; loadRevision += 1; source?.close(); } });
})();
