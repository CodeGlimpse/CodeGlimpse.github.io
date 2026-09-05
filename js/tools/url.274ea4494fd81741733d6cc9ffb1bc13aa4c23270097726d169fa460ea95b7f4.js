(()=>{(function(){let n=document.getElementById("tool-url");if(!n)return;let e=(n.getAttribute("data-lang")||"en")==="zh-cn"?{input:"\u8F93\u5165\u5185\u5BB9",output:"\u5904\u7406\u7ED3\u679C",placeholder:"\u8F93\u5165\u9700\u8981\u7F16\u7801\u6216\u89E3\u7801\u7684 URL \u7EC4\u4EF6...",formMode:"\u8868\u5355\u6A21\u5F0F\uFF1A\u7A7A\u683C\u4E0E + \u4E92\u8F6C",encode:"\u7F16\u7801",decode:"\u89E3\u7801",clear:"\u6E05\u7A7A",copy:"\u590D\u5236\u7ED3\u679C",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236",required:"\u8BF7\u8F93\u5165\u9700\u8981\u5904\u7406\u7684\u5185\u5BB9",encoded:"URL \u7F16\u7801\u5B8C\u6210",decoded:"URL \u89E3\u7801\u5B8C\u6210",encodeFailed:"\u65E0\u6CD5\u7F16\u7801\uFF1A\u8F93\u5165\u5305\u542B\u65E0\u6548\u7684 Unicode \u5B57\u7B26",decodeFailed:"\u65E0\u6CD5\u89E3\u7801\uFF1A\u8F93\u5165\u5305\u542B\u65E0\u6548\u7684\u767E\u5206\u53F7\u8F6C\u4E49"}:{input:"Input",output:"Result",placeholder:"Enter a URL component to encode or decode...",formMode:"Form mode: convert spaces and +",encode:"Encode",decode:"Decode",clear:"Clear",copy:"Copy Result",copied:"Copied",copyFailed:"Copy failed; please copy manually",required:"Enter content to process",encoded:"URL encoding complete",decoded:"URL decoding complete",encodeFailed:"Unable to encode: the input contains an invalid Unicode character",decodeFailed:"Unable to decode: the input contains an invalid percent escape"};n.innerHTML=`
        <div class="tool-container tool-text-tool" data-output-state="empty">
            <div class="tool-field tool-input-panel">
                <label class="tool-label" for="url-input">${e.input}</label>
                <textarea class="tool-input tool-code-input" id="url-input" rows="9" spellcheck="false" placeholder="${e.placeholder}"></textarea>
                <label class="tool-check" for="url-form-mode">
                    <input type="checkbox" id="url-form-mode">
                    <span>${e.formMode}</span>
                </label>
            </div>
            <div class="tool-actions tool-action-panel">
                <button type="button" class="tool-btn tool-btn--primary" id="url-encode">${e.encode}</button>
                <button type="button" class="tool-btn tool-btn--primary" id="url-decode">${e.decode}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="url-clear">${e.clear}</button>
            </div>
            <div class="tool-status" id="url-status" role="status" aria-live="polite"></div>
            <div class="tool-field tool-output-panel" id="url-output-panel" hidden aria-hidden="true">
                <label class="tool-label" for="url-output">${e.output}</label>
                <textarea class="tool-input tool-code-input" id="url-output" rows="9" readonly></textarea>
                <button type="button" class="tool-btn tool-btn--copy" id="url-copy">${e.copy}</button>
            </div>
        </div>
    `;let d=document.getElementById("url-input"),u=document.getElementById("url-output"),s=document.getElementById("url-form-mode"),c=document.getElementById("url-output-panel"),l=document.getElementById("url-status"),r=n.querySelector(".tool-text-tool"),t=window.CodeGlimpseToolUi;function p(o,i){u.value=o,c.hidden=!1,c.setAttribute("aria-hidden","false"),t.setOutputState(r,"ready"),t.setStatus(l,"success",i)}function a(o){if(!d.value){t.setStatus(l,"error",e.required);return}try{p(window.CodeGlimpseUrl[o](d.value,s.checked),o==="encode"?e.encoded:e.decoded)}catch{t.setStatus(l,"error",o==="encode"?e.encodeFailed:e.decodeFailed)}}document.getElementById("url-encode").addEventListener("click",()=>a("encode")),document.getElementById("url-decode").addEventListener("click",()=>a("decode")),document.getElementById("url-clear").addEventListener("click",()=>{d.value="",u.value="",c.hidden=!0,c.setAttribute("aria-hidden","true"),t.setOutputState(r,"empty"),t.setStatus(l,"",""),d.focus()}),document.getElementById("url-copy").addEventListener("click",o=>{t.copy({button:o.currentTarget,value:u.value,status:l,messages:{empty:e.required,copied:e.copied,copyFailed:e.copyFailed}})}),t.bindShortcut(d,()=>a("encode"))})();})();
