(()=>{(function(){let n=document.getElementById("tool-base64");if(!n)return;let p=n.getAttribute("data-lang")||"zh-cn",d={"zh-cn":{labelInput:"\u8F93\u5165\u5185\u5BB9",labelOutput:"\u8F6C\u6362\u7ED3\u679C",placeholderInput:"\u5728\u6B64\u8F93\u5165\u9700\u8981\u7F16\u7801\u6216\u89E3\u7801\u7684\u6587\u672C...",btnEncode:"\u7F16\u7801 (Encode)",btnDecode:"\u89E3\u7801 (Decode)",btnClear:"\u6E05\u7A7A\u5185\u5BB9",errorInvalid:"\u9519\u8BEF\uFF1A\u65E0\u6548\u7684 Base64 \u7F16\u7801",required:"\u8BF7\u8F93\u5165\u9700\u8981\u5904\u7406\u7684\u5185\u5BB9",encoded:"\u7F16\u7801\u5B8C\u6210",decoded:"\u89E3\u7801\u5B8C\u6210",copyBtn:"\u590D\u5236\u7ED3\u679C",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236"},en:{labelInput:"Input Content",labelOutput:"Result",placeholderInput:"Enter text to encode or Base64 to decode...",btnEncode:"Encode",btnDecode:"Decode",btnClear:"Clear",errorInvalid:"Error: Invalid Base64 string",required:"Enter content to process",encoded:"Encoding complete",decoded:"Decoding complete",copyBtn:"Copy Result",copied:"Copied",copyFailed:"Copy failed; please copy manually"}},e=d[p]||d.en;n.innerHTML=`
        <style>
            #tool-base64 .tool-container { max-width: 100%; }
            #tool-base64 .input-group { margin-bottom: 1.5rem; }
            #tool-base64 label { font-weight: bold; font-size: 1.8rem; color: var(--card-text-color-main); display: block; margin-bottom: 0.5rem; }
            #tool-base64 textarea {
                width: 100%;
                padding: 1.2rem;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-family: 'Fira Code', monospace;
                font-size: 1.4rem;
                line-height: 1.6;
                resize: vertical;
                outline: none;
                transition: border-color 0.2s;
            }
            #tool-base64 textarea:focus { border-color: var(--accent-color); }
            #tool-base64 .button-group { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1.5rem 0 2rem 0; }
            #tool-base64 .btn {
                padding: 1rem 2rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 1.4rem;
                transition: all 0.2s;
            }
            #tool-base64 .btn-primary { background: var(--accent-color); color: #fff; }
            #tool-base64 .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
            #tool-base64 .btn-secondary { background: var(--body-background); border: 1px solid var(--border-color); color: var(--card-text-color-main); }
            #tool-base64 .btn-secondary:hover { border-color: var(--accent-color); color: var(--accent-color); }
            #tool-base64 .result-group { position: relative; margin-top: 2rem; }
            #tool-base64 .btn-copy {
                position: absolute;
                right: 1rem;
                top: 3.5rem;
                padding: 0.4rem 1rem;
                font-size: 1.2rem;
                background: var(--accent-color);
                color: #fff;
                border-radius: 4px;
                border: none;
                cursor: pointer;
            }
        </style>
        <div class="tool-container tool-text-tool" data-output-state="empty">
            <div class="input-group tool-field tool-input-panel">
                <label class="tool-label" for="base64-input">${e.labelInput}</label>
                <textarea id="base64-input" rows="8" placeholder="${e.placeholderInput}"></textarea>
            </div>
            <div class="button-group tool-actions tool-action-panel">
                <button type="button" class="btn btn-primary tool-btn tool-btn--primary" id="base64-encode">${e.btnEncode}</button>
                <button type="button" class="btn btn-primary tool-btn tool-btn--primary" id="base64-decode">${e.btnDecode}</button>
                <button type="button" class="btn btn-secondary tool-btn tool-btn--secondary" id="base64-clear">${e.btnClear}</button>
            </div>
            <div class="tool-status" id="base64-status" role="status" aria-live="polite"></div>
            <div class="input-group result-group tool-field tool-output-panel" id="base64-result-group" hidden aria-hidden="true">
                <label class="tool-label" for="base64-output">${e.labelOutput}</label>
                <textarea id="base64-output" rows="8" readonly></textarea>
                <button type="button" class="btn-copy tool-btn tool-btn--copy" id="base64-copy" aria-label="${e.copyBtn}">${e.copyBtn}</button>
            </div>
        </div>
    `;let l=document.getElementById("base64-input"),c=document.getElementById("base64-output"),a=document.getElementById("base64-result-group"),s=document.getElementById("base64-encode"),m=document.getElementById("base64-decode"),y=document.getElementById("base64-clear"),i=document.getElementById("base64-copy"),o=document.getElementById("base64-status"),t=window.CodeGlimpseToolUi,u=r=>{c.value=r,a.hidden=!1,a.setAttribute("aria-hidden","false"),t.setOutputState(n.querySelector(".tool-text-tool"),"ready"),setTimeout(()=>{c.scrollIntoView({behavior:"smooth",block:"nearest"})},50)};s.onclick=()=>{let r=l.value;if(!r){t.setStatus(o,"error",e.required);return}try{u(window.CodeGlimpseBase64.encode(r)),t.setStatus(o,"success",e.encoded)}catch(b){console.error(b)}},m.onclick=()=>{let r=l.value.trim();if(!r){t.setStatus(o,"error",e.required);return}try{u(window.CodeGlimpseBase64.decode(r)),t.setStatus(o,"success",e.decoded)}catch{c.value="",a.hidden=!0,a.setAttribute("aria-hidden","true"),t.setOutputState(n.querySelector(".tool-text-tool"),"empty"),t.setStatus(o,"error",e.errorInvalid)}},y.onclick=()=>{l.value="",c.value="",a.hidden=!0,a.setAttribute("aria-hidden","true"),t.setOutputState(n.querySelector(".tool-text-tool"),"empty"),t.setStatus(o,"",""),l.focus()},i.onclick=()=>{t.copy({button:i,value:c.value,status:o,messages:{empty:e.required,copied:e.copied,copyFailed:e.copyFailed}})},t.bindShortcut(l,()=>s.click())})();})();
