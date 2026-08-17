(function() {
    const container = document.getElementById('tool-color');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'zh-cn';
    
    const i18n = {
        'zh-cn': {
            labelPreview: '颜色预览',
            labelPicker: '颜色选择器',
            labelHex: 'HEX 十六进制',
            labelRgb: 'RGB (红, 绿, 蓝)',
            labelHsl: 'HSL (色相, 饱和度, 亮度)',
            placeholderHex: '#000000',
            btnReset: '恢复默认',
            invalidHex: '请输入有效的 6 位 HEX 颜色值',
            reset: '已恢复默认颜色',
            copyBtn: '复制',
            copied: '已复制',
            copyFailed: '复制失败，请手动复制'
        },
        'en': {
            labelPreview: 'Color Preview',
            labelPicker: 'Color Picker',
            labelHex: 'HEX',
            labelRgb: 'RGB (Red, Green, Blue)',
            labelHsl: 'HSL (Hue, Saturation, Lightness)',
            placeholderHex: '#000000',
            btnReset: 'Reset',
            invalidHex: 'Enter a valid 6-digit HEX color',
            reset: 'Default color restored',
            copyBtn: 'Copy',
            copied: 'Copied',
            copyFailed: 'Copy failed; please copy manually'
        }
    };

    const t = i18n[lang] || i18n['en'];

    container.innerHTML = `
        <style>
            #tool-color .tool-container { max-width: 100%; }
            #tool-color .color-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; margin-top: 1.5rem; }
            @media (max-width: 768px) { #tool-color .color-grid { grid-template-columns: 1fr; } }
            #tool-color .preview-card { 
                background: var(--card-background); 
                border: 1px solid var(--border-color); 
                border-radius: 12px; 
                padding: 1.5rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
            }
            #tool-color .color-preview {
                width: 100%;
                height: 150px;
                border-radius: 8px;
                border: 1px solid var(--border-color);
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            }
            #tool-color .input-group { margin-bottom: 1.5rem; }
            #tool-color label { font-weight: bold; font-size: 1.4rem; color: var(--card-text-color-main); display: block; margin-bottom: 0.5rem; }
            #tool-color input[type="text"], #tool-color input[type="number"] {
                width: 100%;
                padding: 1rem;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-family: 'Fira Code', monospace;
                font-size: 1.4rem;
                outline: none;
                transition: border-color 0.2s;
            }
            #tool-color input:focus { border-color: var(--accent-color); }
            #tool-color .rgb-inputs, #tool-color .hsl-inputs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.8rem; }
            #tool-color input[type="color"] {
                width: 100%;
                height: 50px;
                padding: 0;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                background: none;
            }
            #tool-color .copy-wrapper { position: relative; display: flex; gap: 0.5rem; }
            #tool-color .btn-copy {
                padding: 0.4rem 1rem;
                font-size: 1.2rem;
                background: var(--accent-color);
                color: #fff;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                white-space: nowrap;
            }
        </style>
        <div class="tool-container">
            <div class="color-grid">
                <div class="preview-card">
                    <div class="input-group" style="width: 100%;">
                        <span class="tool-label">${t.labelPreview}</span>
                        <div id="color-preview" class="color-preview" style="background-color: #3b82f6;" role="img" aria-label="${t.labelPreview}: #3B82F6"></div>
                    </div>
                    <div class="input-group" style="width: 100%;">
                        <label class="tool-label" for="color-picker">${t.labelPicker}</label>
                        <input type="color" id="color-picker" value="#3b82f6">
                    </div>
                </div>
                <div class="inputs-card">
                    <div class="input-group tool-field">
                        <label class="tool-label" for="hex-input">${t.labelHex}</label>
                        <div class="copy-wrapper">
                            <input class="tool-input" type="text" id="hex-input" value="#3b82f6" placeholder="${t.placeholderHex}" autocomplete="off">
                            <button type="button" class="btn-copy tool-btn tool-btn--copy" data-target="hex-input" aria-label="${t.copyBtn}: ${t.labelHex}">${t.copyBtn}</button>
                        </div>
                    </div>
                    <div class="input-group">
                        <span class="tool-label">${t.labelRgb}</span>
                        <div class="rgb-inputs">
                            <input class="tool-input" type="number" id="rgb-r" min="0" max="255" value="59" aria-label="R">
                            <input class="tool-input" type="number" id="rgb-g" min="0" max="255" value="130" aria-label="G">
                            <input class="tool-input" type="number" id="rgb-b" min="0" max="255" value="246" aria-label="B">
                        </div>
                        <div class="copy-wrapper" style="margin-top: 0.5rem;">
                            <input class="tool-input" type="text" id="rgb-string" aria-label="${t.labelRgb}" readonly value="rgb(59, 130, 246)">
                            <button type="button" class="btn-copy tool-btn tool-btn--copy" data-target="rgb-string" aria-label="${t.copyBtn}: ${t.labelRgb}">${t.copyBtn}</button>
                        </div>
                    </div>
                    <div class="input-group">
                        <span class="tool-label">${t.labelHsl}</span>
                        <div class="hsl-inputs">
                            <input class="tool-input" type="number" id="hsl-h" min="0" max="360" value="217" aria-label="H">
                            <input class="tool-input" type="number" id="hsl-s" min="0" max="100" value="91" aria-label="S">
                            <input class="tool-input" type="number" id="hsl-l" min="0" max="100" value="60" aria-label="L">
                        </div>
                        <div class="copy-wrapper" style="margin-top: 0.5rem;">
                            <input class="tool-input" type="text" id="hsl-string" aria-label="${t.labelHsl}" readonly value="hsl(217, 91%, 60%)">
                            <button type="button" class="btn-copy tool-btn tool-btn--copy" data-target="hsl-string" aria-label="${t.copyBtn}: ${t.labelHsl}">${t.copyBtn}</button>
                        </div>
                    </div>
                    <div class="tool-actions">
                        <button type="button" class="tool-btn tool-btn--secondary" id="color-reset">${t.btnReset}</button>
                    </div>
                    <div class="tool-status" id="color-status" role="status" aria-live="polite"></div>
                </div>
            </div>
        </div>
    `;

    const picker = document.getElementById('color-picker');
    const preview = document.getElementById('color-preview');
    const hexInput = document.getElementById('hex-input');
    const rgbR = document.getElementById('rgb-r');
    const rgbG = document.getElementById('rgb-g');
    const rgbB = document.getElementById('rgb-b');
    const rgbString = document.getElementById('rgb-string');
    const hslH = document.getElementById('hsl-h');
    const hslS = document.getElementById('hsl-s');
    const hslL = document.getElementById('hsl-l');
    const hslString = document.getElementById('hsl-string');
    const resetButton = document.getElementById('color-reset');
    const status = document.getElementById('color-status');
    const ui = window.CodeGlimpseToolUi;

    // Helper: Hex to RGB
    function hexToRgb(hex) {
        return window.CodeGlimpseColor.hexToRgb(hex);
    }

    // Helper: RGB to Hex
    function rgbToHex(r, g, b) {
        return window.CodeGlimpseColor.rgbToHex(r, g, b);
    }

    // Helper: RGB to HSL
    function rgbToHsl(r, g, b) {
        return window.CodeGlimpseColor.rgbToHsl(r, g, b);
    }

    // Helper: HSL to RGB
    function hslToRgb(h, s, l) {
        return window.CodeGlimpseColor.hslToRgb(h, s, l);
    }

    function updateUI(hex, r, g, b, h, s, l) {
        preview.style.backgroundColor = hex;
        picker.value = hex;
        hexInput.value = hex;
        rgbR.value = r;
        rgbG.value = g;
        rgbB.value = b;
        rgbString.value = `rgb(${r}, ${g}, ${b})`;
        hslH.value = h;
        hslS.value = s;
        hslL.value = l;
        hslString.value = `hsl(${h}, ${s}%, ${l}%)`;
        preview.setAttribute('aria-label', `${t.labelPreview}: ${hex}`);
        hexInput.setAttribute('aria-invalid', 'false');
    }

    picker.addEventListener('input', (e) => {
        const hex = e.target.value.toUpperCase();
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        updateUI(hex, rgb.r, rgb.g, rgb.b, hsl.h, hsl.s, hsl.l);
        ui.setStatus(status, '', '');
    });

    hexInput.addEventListener('input', (e) => {
        let hex = e.target.value;
        if (/^#?[0-9A-F]{6}$/i.test(hex)) {
            if (!hex.startsWith('#')) hex = '#' + hex;
            hex = hex.toUpperCase();
            const rgb = hexToRgb(hex);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            updateUI(hex, rgb.r, rgb.g, rgb.b, hsl.h, hsl.s, hsl.l);
            ui.setStatus(status, '', '');
        } else {
            hexInput.setAttribute('aria-invalid', 'true');
            ui.setStatus(status, 'error', t.invalidHex);
        }
    });

    [rgbR, rgbG, rgbB].forEach(el => {
        el.addEventListener('input', () => {
            let r = parseInt(rgbR.value) || 0;
            let g = parseInt(rgbG.value) || 0;
            let b = parseInt(rgbB.value) || 0;
            r = Math.min(255, Math.max(0, r));
            g = Math.min(255, Math.max(0, g));
            b = Math.min(255, Math.max(0, b));
            const hex = rgbToHex(r, g, b);
            const hsl = rgbToHsl(r, g, b);
            updateUI(hex, r, g, b, hsl.h, hsl.s, hsl.l);
            ui.setStatus(status, '', '');
        });
    });

    [hslH, hslS, hslL].forEach(el => {
        el.addEventListener('input', () => {
            let h = parseInt(hslH.value) || 0;
            let s = parseInt(hslS.value) || 0;
            let l = parseInt(hslL.value) || 0;
            h = Math.min(360, Math.max(0, h));
            s = Math.min(100, Math.max(0, s));
            l = Math.min(100, Math.max(0, l));
            const rgb = hslToRgb(h, s, l);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            updateUI(hex, rgb.r, rgb.g, rgb.b, h, s, l);
            ui.setStatus(status, '', '');
        });
    });

    // Copy buttons logic
    container.querySelectorAll('.btn-copy').forEach(btn => {
        btn.onclick = () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            ui.copy({
                button: btn,
                value: input.value,
                status,
                messages: { empty: t.invalidHex, copied: t.copied, copyFailed: t.copyFailed }
            });
        };
    });

    resetButton.addEventListener('click', () => {
        updateUI('#3B82F6', 59, 130, 246, 217, 91, 60);
        ui.setStatus(status, 'success', t.reset);
        picker.focus();
    });
})();
