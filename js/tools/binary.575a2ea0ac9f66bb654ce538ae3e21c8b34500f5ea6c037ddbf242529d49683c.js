(()=>{(function(){let r=document.getElementById("tool-binary");if(!r)return;let g=r.getAttribute("data-lang")||"zh-cn",b={"zh-cn":{labelInput:"\u8F93\u5165\u6570\u503C",labelBase:"\u6E90\u8FDB\u5236",labelBinary:"\u4E8C\u8FDB\u5236 (2)",labelOctal:"\u516B\u8FDB\u5236 (8)",labelDecimal:"\u5341\u8FDB\u5236 (10)",labelHex:"\u5341\u516D\u8FDB\u5236 (16)",labelCustom:"\u81EA\u5B9A\u4E49\u8FDB\u5236 (2-36)",placeholderInput:"\u5728\u8FD9\u91CC\u8F93\u5165\u6570\u503C...",placeholderCustom:"\u4F8B\u5982: 32",invalidInput:"\u65E0\u6548\u8F93\u5165",btnClear:"\u6E05\u7A7A",copyBtn:"\u590D\u5236",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236"},en:{labelInput:"Input Value",labelBase:"Source Base",labelBinary:"Binary (2)",labelOctal:"Octal (8)",labelDecimal:"Decimal (10)",labelHex:"Hexadecimal (16)",labelCustom:"Custom Base (2-36)",placeholderInput:"Enter value here...",placeholderCustom:"e.g., 32",invalidInput:"Invalid Input",btnClear:"Clear",copyBtn:"Copy",copied:"Copied",copyFailed:"Copy failed; please copy manually"}},t=b[g]||b.en;r.innerHTML=`
        <style>
            #tool-binary .tool-container { display: flex; flex-direction: column; gap: 1.5rem; max-width: 600px; margin: 0 auto; }
            #tool-binary .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
            #tool-binary .input-group label { font-weight: bold; font-size: 1.1rem; color: var(--card-text-color-main); }
            #tool-binary select, #tool-binary input {
                padding: 0.8rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-size: 1rem;
                outline: none;
                transition: border-color 0.2s;
            }
            #tool-binary select:focus, #tool-binary input:focus { border-color: var(--accent-color); }
            #tool-binary .results-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 1rem; }
            #tool-binary .result-item { display: flex; flex-direction: column; gap: 0.3rem; }
            #tool-binary .result-item label { font-size: 0.9rem; color: var(--card-text-color-secondary); }
            #tool-binary .result-row { display: flex; gap: 0.5rem; }
            #tool-binary .result-row input { flex: 1; }
            #tool-binary .copy-btn {
                padding: 0 1rem;
                background: var(--accent-color);
                color: #fff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: opacity 0.2s;
            }
            #tool-binary .copy-btn:hover { opacity: 0.8; }
            #tool-binary .custom-base-group { display: flex; gap: 1rem; }
            #tool-binary .custom-base-group .input-group { flex: 1; }
        </style>
        <div class="tool-container">
            <div class="custom-base-group">
                <div class="input-group tool-field">
                    <label class="tool-label" for="source-base">${t.labelBase}</label>
                    <select class="tool-input" id="source-base">
                        <option value="2">2 (${t.labelBinary})</option>
                        <option value="8">8 (${t.labelOctal})</option>
                        <option value="10" selected>10 (${t.labelDecimal})</option>
                        <option value="16">16 (${t.labelHex})</option>
                        <option value="custom">${t.labelCustom}</option>
                    </select>
                </div>
                <div class="input-group tool-field" id="custom-source-group" hidden>
                    <label class="tool-label" for="custom-source-base">${t.labelCustom}</label>
                    <input class="tool-input" type="number" id="custom-source-base" min="2" max="36" value="32">
                </div>
            </div>
            
            <div class="input-group tool-field">
                <label class="tool-label" for="binary-input">${t.labelInput}</label>
                <input class="tool-input" type="text" id="binary-input" placeholder="${t.placeholderInput}" inputmode="text" autocomplete="off">
            </div>

            <div class="tool-actions">
                <button type="button" class="tool-btn tool-btn--secondary" id="binary-clear">${t.btnClear}</button>
            </div>

            <div class="tool-status" id="binary-status" role="status" aria-live="polite"></div>

            <div class="results-grid">
                <div class="result-item">
                    <label for="res-2">${t.labelBinary}</label>
                    <div class="result-row">
                        <input class="tool-input" type="text" id="res-2" readonly>
                        <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="res-2" aria-label="${t.copyBtn}: ${t.labelBinary}" disabled>${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <label for="res-8">${t.labelOctal}</label>
                    <div class="result-row">
                        <input class="tool-input" type="text" id="res-8" readonly>
                        <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="res-8" aria-label="${t.copyBtn}: ${t.labelOctal}" disabled>${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <label for="res-10">${t.labelDecimal}</label>
                    <div class="result-row">
                        <input class="tool-input" type="text" id="res-10" readonly>
                        <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="res-10" aria-label="${t.copyBtn}: ${t.labelDecimal}" disabled>${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <label for="res-16">${t.labelHex}</label>
                    <div class="result-row">
                        <input class="tool-input" type="text" id="res-16" readonly>
                        <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="res-16" aria-label="${t.copyBtn}: ${t.labelHex}" disabled>${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label for="target-custom-base">${t.labelCustom}</label>
                        <input class="tool-input" type="number" id="target-custom-base" min="2" max="36" value="32" style="width: 7rem;">
                    </div>
                    <div class="result-row">
                        <input class="tool-input" type="text" id="res-custom" aria-label="${t.labelCustom}" readonly>
                        <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="res-custom" aria-label="${t.copyBtn}: ${t.labelCustom}" disabled>${t.copyBtn}</button>
                    </div>
                </div>
            </div>
        </div>
    `;let i=document.getElementById("source-base"),f=document.getElementById("custom-source-group"),m=document.getElementById("custom-source-base"),c=document.getElementById("binary-input"),y=document.getElementById("target-custom-base"),B=document.getElementById("binary-clear"),l=document.getElementById("binary-status"),a=window.CodeGlimpseToolUi,n={2:document.getElementById("res-2"),8:document.getElementById("res-8"),10:document.getElementById("res-10"),16:document.getElementById("res-16"),custom:document.getElementById("res-custom")},p=[...r.querySelectorAll(".copy-btn")];function u(){Object.values(n).forEach(e=>{e.value=""}),p.forEach(e=>{e.disabled=!0})}function v(){let e=c.value.trim();if(!e){u(),a.setStatus(l,"","");return}let s=i.value==="custom"?parseInt(m.value,10):parseInt(i.value,10);if(isNaN(s)||s<2||s>36){u(),a.setStatus(l,"error",t.invalidInput);return}try{let o=window.CodeGlimpseBinary.parseInteger(e,s);n[2].value=window.CodeGlimpseBinary.formatInteger(o,2),n[8].value=window.CodeGlimpseBinary.formatInteger(o,8),n[10].value=window.CodeGlimpseBinary.formatInteger(o,10),n[16].value=window.CodeGlimpseBinary.formatInteger(o,16);let d=parseInt(y.value,10);if(isNaN(d)||d<2||d>36)throw new RangeError(t.invalidInput);n.custom.value=window.CodeGlimpseBinary.formatInteger(o,d),p.forEach(I=>{I.disabled=!1}),a.setStatus(l,"","")}catch{u(),a.setStatus(l,"error",t.invalidInput)}}i.addEventListener("change",()=>{f.hidden=i.value!=="custom",v()}),[m,c,y].forEach(e=>{e.addEventListener("input",v)}),p.forEach(e=>{e.addEventListener("click",()=>{let s=e.getAttribute("data-target"),o=document.getElementById(s);a.copy({button:e,value:o?.value,status:l,messages:{empty:t.invalidInput,copied:t.copied,copyFailed:t.copyFailed}})})}),B.addEventListener("click",()=>{c.value="",u(),a.setStatus(l,"",""),c.focus()})})();})();
