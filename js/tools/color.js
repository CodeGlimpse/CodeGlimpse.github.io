(() => {
  // <stdin>
  (function() {
    const container = document.getElementById("tool-color");
    if (!container) return;
    const lang = container.getAttribute("data-lang") || "zh-cn";
    const i18n = {
      "zh-cn": {
        labelPreview: "\u989C\u8272\u9884\u89C8",
        labelPicker: "\u989C\u8272\u9009\u62E9\u5668",
        labelHex: "HEX \u5341\u516D\u8FDB\u5236",
        labelRgb: "RGB (\u7EA2, \u7EFF, \u84DD)",
        labelHsl: "HSL (\u8272\u76F8, \u9971\u548C\u5EA6, \u4EAE\u5EA6)",
        placeholderHex: "#000000",
        copyBtn: "\u590D\u5236",
        copied: "\u5DF2\u590D\u5236"
      },
      "en": {
        labelPreview: "Color Preview",
        labelPicker: "Color Picker",
        labelHex: "HEX",
        labelRgb: "RGB (Red, Green, Blue)",
        labelHsl: "HSL (Hue, Saturation, Lightness)",
        placeholderHex: "#000000",
        copyBtn: "Copy",
        copied: "Copied"
      }
    };
    const t = i18n[lang] || i18n["en"];
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
                        <label>${t.labelPreview}</label>
                        <div id="color-preview" class="color-preview" style="background-color: #3b82f6;"></div>
                    </div>
                    <div class="input-group" style="width: 100%;">
                        <label>${t.labelPicker}</label>
                        <input type="color" id="color-picker" value="#3b82f6">
                    </div>
                </div>
                <div class="inputs-card">
                    <div class="input-group">
                        <label>${t.labelHex}</label>
                        <div class="copy-wrapper">
                            <input type="text" id="hex-input" value="#3b82f6" placeholder="${t.placeholderHex}">
                            <button class="btn-copy" data-target="hex-input">${t.copyBtn}</button>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>${t.labelRgb}</label>
                        <div class="rgb-inputs">
                            <input type="number" id="rgb-r" min="0" max="255" value="59">
                            <input type="number" id="rgb-g" min="0" max="255" value="130">
                            <input type="number" id="rgb-b" min="0" max="255" value="246">
                        </div>
                        <div class="copy-wrapper" style="margin-top: 0.5rem;">
                            <input type="text" id="rgb-string" readonly value="rgb(59, 130, 246)">
                            <button class="btn-copy" data-target="rgb-string">${t.copyBtn}</button>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>${t.labelHsl}</label>
                        <div class="hsl-inputs">
                            <input type="number" id="hsl-h" min="0" max="360" value="217">
                            <input type="number" id="hsl-s" min="0" max="100" value="91">
                            <input type="number" id="hsl-l" min="0" max="100" value="60">
                        </div>
                        <div class="copy-wrapper" style="margin-top: 0.5rem;">
                            <input type="text" id="hsl-string" readonly value="hsl(217, 91%, 60%)">
                            <button class="btn-copy" data-target="hsl-string">${t.copyBtn}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    const picker = document.getElementById("color-picker");
    const preview = document.getElementById("color-preview");
    const hexInput = document.getElementById("hex-input");
    const rgbR = document.getElementById("rgb-r");
    const rgbG = document.getElementById("rgb-g");
    const rgbB = document.getElementById("rgb-b");
    const rgbString = document.getElementById("rgb-string");
    const hslH = document.getElementById("hsl-h");
    const hslS = document.getElementById("hsl-s");
    const hslL = document.getElementById("hsl-l");
    const hslString = document.getElementById("hsl-string");
    function hexToRgb(hex) {
      hex = hex.replace(/^#/, "");
      if (hex.length === 3) {
        hex = hex.split("").map((c) => c + c).join("");
      }
      const bigint = parseInt(hex, 16);
      return {
        r: bigint >> 16 & 255,
        g: bigint >> 8 & 255,
        b: bigint & 255
      };
    }
    function rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }
    function rgbToHsl(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }
      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
    }
    function hslToRgb(h, s, l) {
      h /= 360;
      s /= 100;
      l /= 100;
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p2, q2, t2) => {
          if (t2 < 0) t2 += 1;
          if (t2 > 1) t2 -= 1;
          if (t2 < 1 / 6) return p2 + (q2 - p2) * 6 * t2;
          if (t2 < 1 / 2) return q2;
          if (t2 < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t2) * 6;
          return p2;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
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
    }
    picker.addEventListener("input", (e) => {
      const hex = e.target.value.toUpperCase();
      const rgb = hexToRgb(hex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      updateUI(hex, rgb.r, rgb.g, rgb.b, hsl.h, hsl.s, hsl.l);
    });
    hexInput.addEventListener("input", (e) => {
      let hex = e.target.value;
      if (/^#?[0-9A-F]{6}$/i.test(hex)) {
        if (!hex.startsWith("#")) hex = "#" + hex;
        hex = hex.toUpperCase();
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        updateUI(hex, rgb.r, rgb.g, rgb.b, hsl.h, hsl.s, hsl.l);
      }
    });
    [rgbR, rgbG, rgbB].forEach((el) => {
      el.addEventListener("input", () => {
        let r = parseInt(rgbR.value) || 0;
        let g = parseInt(rgbG.value) || 0;
        let b = parseInt(rgbB.value) || 0;
        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));
        const hex = rgbToHex(r, g, b);
        const hsl = rgbToHsl(r, g, b);
        updateUI(hex, r, g, b, hsl.h, hsl.s, hsl.l);
      });
    });
    [hslH, hslS, hslL].forEach((el) => {
      el.addEventListener("input", () => {
        let h = parseInt(hslH.value) || 0;
        let s = parseInt(hslS.value) || 0;
        let l = parseInt(hslL.value) || 0;
        h = Math.min(360, Math.max(0, h));
        s = Math.min(100, Math.max(0, s));
        l = Math.min(100, Math.max(0, l));
        const rgb = hslToRgb(h, s, l);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        updateUI(hex, rgb.r, rgb.g, rgb.b, h, s, l);
      });
    });
    container.querySelectorAll(".btn-copy").forEach((btn) => {
      btn.onclick = () => {
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);
        input.select();
        document.execCommand("copy");
        const originalText = btn.innerText;
        btn.innerText = t.copied;
        setTimeout(() => {
          btn.innerText = originalText;
        }, 2e3);
      };
    });
  })();
})();
