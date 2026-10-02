(()=>{(function(){let d=document.getElementById("tool-color");if(!d)return;let $=d.getAttribute("data-lang")||"zh-cn",f={"zh-cn":{labelPreview:"\u989C\u8272\u9884\u89C8",labelPicker:"\u989C\u8272\u9009\u62E9\u5668",labelHex:"HEX \u5341\u516D\u8FDB\u5236",labelRgb:"RGB (\u7EA2, \u7EFF, \u84DD)",labelHsl:"HSL (\u8272\u76F8, \u9971\u548C\u5EA6, \u4EAE\u5EA6)",placeholderHex:"#000000",btnReset:"\u6062\u590D\u9ED8\u8BA4",invalidHex:"\u8BF7\u8F93\u5165\u6709\u6548\u7684 6 \u4F4D HEX \u989C\u8272\u503C",reset:"\u5DF2\u6062\u590D\u9ED8\u8BA4\u989C\u8272",copyBtn:"\u590D\u5236",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236"},en:{labelPreview:"Color Preview",labelPicker:"Color Picker",labelHex:"HEX",labelRgb:"RGB (Red, Green, Blue)",labelHsl:"HSL (Hue, Saturation, Lightness)",placeholderHex:"#000000",btnReset:"Reset",invalidHex:"Enter a valid 6-digit HEX color",reset:"Default color restored",copyBtn:"Copy",copied:"Copied",copyFailed:"Copy failed; please copy manually"}},o=f[$]||f.en;d.innerHTML=`
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
                        <span class="tool-label">${o.labelPreview}</span>
                        <div id="color-preview" class="color-preview" style="background-color: #3b82f6;" role="img" aria-label="${o.labelPreview}: #3B82F6"></div>
                    </div>
                    <div class="input-group" style="width: 100%;">
                        <label class="tool-label" for="color-picker">${o.labelPicker}</label>
                        <input type="color" id="color-picker" value="#3b82f6">
                    </div>
                </div>
                <div class="inputs-card">
                    <div class="input-group tool-field">
                        <label class="tool-label" for="hex-input">${o.labelHex}</label>
                        <div class="copy-wrapper">
                            <input class="tool-input" type="text" id="hex-input" value="#3b82f6" placeholder="${o.placeholderHex}" autocomplete="off">
                            <button type="button" class="btn-copy tool-btn tool-btn--copy" data-target="hex-input" aria-label="${o.copyBtn}: ${o.labelHex}">${o.copyBtn}</button>
                        </div>
                    </div>
                    <div class="input-group">
                        <span class="tool-label">${o.labelRgb}</span>
                        <div class="rgb-inputs">
                            <input class="tool-input" type="number" id="rgb-r" min="0" max="255" value="59" aria-label="R">
                            <input class="tool-input" type="number" id="rgb-g" min="0" max="255" value="130" aria-label="G">
                            <input class="tool-input" type="number" id="rgb-b" min="0" max="255" value="246" aria-label="B">
                        </div>
                        <div class="copy-wrapper" style="margin-top: 0.5rem;">
                            <input class="tool-input" type="text" id="rgb-string" aria-label="${o.labelRgb}" readonly value="rgb(59, 130, 246)">
                            <button type="button" class="btn-copy tool-btn tool-btn--copy" data-target="rgb-string" aria-label="${o.copyBtn}: ${o.labelRgb}">${o.copyBtn}</button>
                        </div>
                    </div>
                    <div class="input-group">
                        <span class="tool-label">${o.labelHsl}</span>
                        <div class="hsl-inputs">
                            <input class="tool-input" type="number" id="hsl-h" min="0" max="360" value="217" aria-label="H">
                            <input class="tool-input" type="number" id="hsl-s" min="0" max="100" value="91" aria-label="S">
                            <input class="tool-input" type="number" id="hsl-l" min="0" max="100" value="60" aria-label="L">
                        </div>
                        <div class="copy-wrapper" style="margin-top: 0.5rem;">
                            <input class="tool-input" type="text" id="hsl-string" aria-label="${o.labelHsl}" readonly value="hsl(217, 91%, 60%)">
                            <button type="button" class="btn-copy tool-btn tool-btn--copy" data-target="hsl-string" aria-label="${o.copyBtn}: ${o.labelHsl}">${o.copyBtn}</button>
                        </div>
                    </div>
                    <div class="tool-actions">
                        <button type="button" class="tool-btn tool-btn--secondary" id="color-reset">${o.btnReset}</button>
                    </div>
                    <div class="tool-status" id="color-status" role="status" aria-live="polite"></div>
                </div>
            </div>
        </div>
    `;let u=document.getElementById("color-picker"),w=document.getElementById("color-preview"),p=document.getElementById("hex-input"),b=document.getElementById("rgb-r"),g=document.getElementById("rgb-g"),m=document.getElementById("rgb-b"),I=document.getElementById("rgb-string"),v=document.getElementById("hsl-h"),y=document.getElementById("hsl-s"),h=document.getElementById("hsl-l"),k=document.getElementById("hsl-string"),C=document.getElementById("color-reset"),i=document.getElementById("color-status"),s=window.CodeGlimpseToolUi;function B(l){return window.CodeGlimpseColor.hexToRgb(l)}function H(l,t,e){return window.CodeGlimpseColor.rgbToHex(l,t,e)}function x(l,t,e){return window.CodeGlimpseColor.rgbToHsl(l,t,e)}function R(l,t,e){return window.CodeGlimpseColor.hslToRgb(l,t,e)}function c(l,t,e,r,a,n,E){w.style.backgroundColor=l,u.value=l,p.value=l,b.value=t,g.value=e,m.value=r,I.value=`rgb(${t}, ${e}, ${r})`,v.value=a,y.value=n,h.value=E,k.value=`hsl(${a}, ${n}%, ${E}%)`,w.setAttribute("aria-label",`${o.labelPreview}: ${l}`),p.setAttribute("aria-invalid","false")}u.addEventListener("input",l=>{let t=l.target.value.toUpperCase(),e=B(t),r=x(e.r,e.g,e.b);c(t,e.r,e.g,e.b,r.h,r.s,r.l),s.setStatus(i,"","")}),p.addEventListener("input",l=>{let t=l.target.value;if(/^#?[0-9A-F]{6}$/i.test(t)){t.startsWith("#")||(t="#"+t),t=t.toUpperCase();let e=B(t),r=x(e.r,e.g,e.b);c(t,e.r,e.g,e.b,r.h,r.s,r.l),s.setStatus(i,"","")}else p.setAttribute("aria-invalid","true"),s.setStatus(i,"error",o.invalidHex)}),[b,g,m].forEach(l=>{l.addEventListener("input",()=>{let t=parseInt(b.value)||0,e=parseInt(g.value)||0,r=parseInt(m.value)||0;t=Math.min(255,Math.max(0,t)),e=Math.min(255,Math.max(0,e)),r=Math.min(255,Math.max(0,r));let a=H(t,e,r),n=x(t,e,r);c(a,t,e,r,n.h,n.s,n.l),s.setStatus(i,"","")})}),[v,y,h].forEach(l=>{l.addEventListener("input",()=>{let t=parseInt(v.value)||0,e=parseInt(y.value)||0,r=parseInt(h.value)||0;t=Math.min(360,Math.max(0,t)),e=Math.min(100,Math.max(0,e)),r=Math.min(100,Math.max(0,r));let a=R(t,e,r),n=H(a.r,a.g,a.b);c(n,a.r,a.g,a.b,t,e,r),s.setStatus(i,"","")})}),d.querySelectorAll(".btn-copy").forEach(l=>{l.onclick=()=>{let t=l.getAttribute("data-target"),e=document.getElementById(t);s.copy({button:l,value:e.value,status:i,messages:{empty:o.invalidHex,copied:o.copied,copyFailed:o.copyFailed}})}}),C.addEventListener("click",()=>{c("#3B82F6",59,130,246,217,91,60),s.setStatus(i,"success",o.reset),u.focus()})})();})();
