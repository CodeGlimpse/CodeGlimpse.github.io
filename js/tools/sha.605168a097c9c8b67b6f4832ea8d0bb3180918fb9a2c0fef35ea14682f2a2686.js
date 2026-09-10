(()=>{(function(){let a=document.getElementById("tool-sha");if(!a)return;let f=a.getAttribute("data-lang")||"zh-cn",m={"zh-cn":{labelInput:"\u8F93\u5165\u5185\u5BB9",labelOutput:"SHA \u54C8\u5E0C\u503C",placeholderInput:"\u5728\u6B64\u8F93\u5165\u9700\u8981\u52A0\u5BC6\u7684\u6587\u672C...",btnHash:"\u751F\u6210 (Generate)",btnClear:"\u6E05\u7A7A\u5185\u5BB9",copyBtn:"\u590D\u5236\u7ED3\u679C",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236",required:"\u8BF7\u8F93\u5165\u9700\u8981\u5904\u7406\u7684\u5185\u5BB9",processing:"\u6B63\u5728\u751F\u6210\u54C8\u5E0C\u503C\u2026",generated:"SHA \u54C8\u5E0C\u503C\u5DF2\u751F\u6210",algoLabel:"\u7B97\u6CD5\u9009\u62E9",caseLabel:"\u8F93\u51FA\u683C\u5F0F",caseLower:"\u5C0F\u5199",caseUpper:"\u5927\u5199",errorCrypto:"\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 Web Crypto API",errorAlgo:"\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u8BE5\u7B97\u6CD5"},en:{labelInput:"Input Content",labelOutput:"SHA Hash",placeholderInput:"Enter text to hash...",btnHash:"Generate",btnClear:"Clear",copyBtn:"Copy Result",copied:"Copied",copyFailed:"Copy failed; please copy manually",required:"Enter content to process",processing:"Generating hash\u2026",generated:"SHA hash generated",algoLabel:"Algorithm",caseLabel:"Output Case",caseLower:"Lowercase",caseUpper:"Uppercase",errorCrypto:"Browser does not support Web Crypto API",errorAlgo:"Algorithm not supported by your browser"}},e=m[f]||m.en;a.innerHTML=`
        <style>
            #tool-sha .tool-container { max-width: 100%; }
            #tool-sha .input-group { margin-bottom: 1.5rem; }
            #tool-sha label { font-weight: bold; font-size: 1.8rem; color: var(--card-text-color-main); display: block; margin-bottom: 0.5rem; }
            #tool-sha textarea {
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
            #tool-sha textarea:focus { border-color: var(--accent-color); }
            #tool-sha .button-group { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; margin: 1.5rem 0 2rem 0; }
            #tool-sha .btn {
                padding: 1rem 2rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 1.4rem;
                transition: all 0.2s;
            }
            #tool-sha .btn-primary { background: var(--accent-color); color: #fff; }
            #tool-sha .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
            #tool-sha .btn-secondary { background: var(--body-background); border: 1px solid var(--border-color); color: var(--card-text-color-main); }
            #tool-sha .btn-secondary:hover { border-color: var(--accent-color); color: var(--accent-color); }
            
            #tool-sha .options-group { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; font-size: 1.4rem; color: var(--card-text-color-main); }
            #tool-sha .options-group select {
                padding: 0.5rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-size: 1.4rem;
                outline: none;
            }
            #tool-sha .options-group select:focus { border-color: var(--accent-color); }
            
            #tool-sha .result-group { position: relative; margin-top: 2rem; }
            #tool-sha .btn-copy {
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
                <label class="tool-label" for="sha-input">${e.labelInput}</label>
                <textarea id="sha-input" rows="8" placeholder="${e.placeholderInput}"></textarea>
            </div>
            <div class="button-group tool-actions tool-action-panel">
                <button type="button" class="btn btn-primary tool-btn tool-btn--primary" id="sha-generate">${e.btnHash}</button>
                <button type="button" class="btn btn-secondary tool-btn tool-btn--secondary" id="sha-clear">${e.btnClear}</button>
                <div class="options-group" role="group" aria-label="${e.caseLabel}">
                    <label for="sha-algo">${e.algoLabel}:</label>
                    <select id="sha-algo">
                        <option value="SHA-1">SHA-1</option>
                        <option value="SHA-256" selected>SHA-256</option>
                        <option value="SHA-384">SHA-384</option>
                        <option value="SHA-512">SHA-512</option>
                    </select>
                    <span>${e.caseLabel}:</span>
                    <input type="radio" id="sha-case-lower" name="sha-case" value="lower" checked>
                    <label for="sha-case-lower" style="display:inline; font-size: 1.4rem; margin-right: 0.5rem; font-weight: normal;">${e.caseLower}</label>
                    <input type="radio" id="sha-case-upper" name="sha-case" value="upper">
                    <label for="sha-case-upper" style="display:inline; font-size: 1.4rem; font-weight: normal;">${e.caseUpper}</label>
                </div>
            </div>
            <div class="tool-status" id="sha-status" role="status" aria-live="polite"></div>
            <div class="input-group result-group tool-field tool-output-panel" id="sha-result-group" hidden aria-hidden="true">
                <label class="tool-label" for="sha-output">${e.labelOutput}</label>
                <textarea id="sha-output" rows="4" readonly></textarea>
                <button type="button" class="btn-copy tool-btn tool-btn--copy" id="sha-copy" aria-label="${e.copyBtn}" disabled>${e.copyBtn}</button>
            </div>
        </div>
    `;let i=document.getElementById("sha-input"),c=document.getElementById("sha-output"),o=document.getElementById("sha-result-group"),p=document.getElementById("sha-generate"),v=document.getElementById("sha-clear"),r=document.getElementById("sha-copy"),g=document.getElementById("sha-algo"),x=document.getElementsByName("sha-case"),l=document.getElementById("sha-status"),b=a.querySelector(".tool-text-tool"),t=window.CodeGlimpseToolUi,n=0;async function d(s=!1){let y=i.value;if(!y){n+=1,c.value="",o.hidden=!0,o.setAttribute("aria-hidden","true"),r.disabled=!0,t.setOutputState(b,"empty"),s&&t.setStatus(l,"error",e.required);return}let A=g.value,h=++n;p.disabled=!0,a.setAttribute("aria-busy","true"),s&&t.setStatus(l,"info",e.processing);try{let u=await window.CodeGlimpseSha.digest(y,A);if(h!==n)return;document.getElementById("sha-case-upper").checked&&(u=u.toUpperCase()),c.value=u,o.hidden=!1,o.setAttribute("aria-hidden","false"),r.disabled=!1,t.setOutputState(b,"ready"),t.setStatus(l,s?"success":"",s?e.generated:"")}catch(u){if(h!==n)return;console.error(u),c.value="",o.hidden=!0,o.setAttribute("aria-hidden","true"),r.disabled=!0,t.setOutputState(b,"empty"),t.setStatus(l,"error",e.errorAlgo)}finally{h===n&&(p.disabled=!1,a.removeAttribute("aria-busy"))}}p.onclick=()=>d(!0),i.oninput=()=>d(!1),g.onchange=()=>d(!1),x.forEach(s=>{s.onchange=()=>d(!1)}),v.onclick=()=>{i.value="",c.value="",n+=1,o.hidden=!0,o.setAttribute("aria-hidden","true"),p.disabled=!1,r.disabled=!0,a.removeAttribute("aria-busy"),t.setOutputState(b,"empty"),t.setStatus(l,"",""),i.focus()},r.onclick=()=>{t.copy({button:r,value:c.value,status:l,messages:{empty:e.required,copied:e.copied,copyFailed:e.copyFailed}})},t.bindShortcut(i,()=>d(!0))})();})();
