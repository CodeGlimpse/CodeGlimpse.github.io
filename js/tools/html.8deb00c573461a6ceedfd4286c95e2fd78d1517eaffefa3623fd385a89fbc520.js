(()=>{(function(){let l=document.getElementById("tool-html");if(!l)return;let t=(l.getAttribute("data-lang")||"en")==="zh-cn"?{input:"\u8F93\u5165\u5185\u5BB9",output:"\u5904\u7406\u7ED3\u679C",placeholder:"\u8F93\u5165 HTML \u6216\u5B9E\u4F53\u6587\u672C...",nonAscii:"\u7F16\u7801\u6240\u6709\u975E ASCII \u5B57\u7B26",encode:"\u7F16\u7801\u5B9E\u4F53",decode:"\u89E3\u7801\u5B9E\u4F53",clear:"\u6E05\u7A7A",copy:"\u590D\u5236\u7ED3\u679C",required:"\u8BF7\u8F93\u5165\u9700\u8981\u5904\u7406\u7684\u5185\u5BB9",encoded:"HTML \u5B9E\u4F53\u7F16\u7801\u5B8C\u6210",decoded:"HTML \u5B9E\u4F53\u89E3\u7801\u5B8C\u6210",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236"}:{input:"Input",output:"Result",placeholder:"Enter HTML or entity text...",nonAscii:"Encode all non-ASCII characters",encode:"Encode Entities",decode:"Decode Entities",clear:"Clear",copy:"Copy Result",required:"Enter content to process",encoded:"HTML entity encoding complete",decoded:"HTML entity decoding complete",copied:"Copied",copyFailed:"Copy failed; please copy manually"};l.innerHTML=`
        <div class="tool-container tool-text-tool" data-output-state="empty">
            <div class="tool-field tool-input-panel">
                <label class="tool-label" for="html-input">${t.input}</label>
                <textarea class="tool-input tool-code-input" id="html-input" rows="9" spellcheck="false" placeholder="${t.placeholder}"></textarea>
                <label class="tool-check" for="html-non-ascii">
                    <input type="checkbox" id="html-non-ascii">
                    <span>${t.nonAscii}</span>
                </label>
            </div>
            <div class="tool-actions tool-action-panel">
                <button type="button" class="tool-btn tool-btn--primary" id="html-encode">${t.encode}</button>
                <button type="button" class="tool-btn tool-btn--primary" id="html-decode">${t.decode}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="html-clear">${t.clear}</button>
            </div>
            <div class="tool-status" id="html-status" role="status" aria-live="polite"></div>
            <div class="tool-field tool-output-panel" id="html-output-panel" hidden aria-hidden="true">
                <label class="tool-label" for="html-output">${t.output}</label>
                <textarea class="tool-input tool-code-input" id="html-output" rows="9" readonly></textarea>
                <button type="button" class="tool-btn tool-btn--copy" id="html-copy">${t.copy}</button>
            </div>
        </div>
    `;let o=document.getElementById("html-input"),a=document.getElementById("html-output"),n=document.getElementById("html-output-panel"),d=document.getElementById("html-status"),u=l.querySelector(".tool-text-tool"),e=window.CodeGlimpseToolUi;function i(c){if(!o.value){e.setStatus(d,"error",t.required);return}a.value=c==="encode"?window.CodeGlimpseHtml.encode(o.value,document.getElementById("html-non-ascii").checked):window.CodeGlimpseHtml.decode(o.value),n.hidden=!1,n.setAttribute("aria-hidden","false"),e.setOutputState(u,"ready"),e.setStatus(d,"success",c==="encode"?t.encoded:t.decoded)}document.getElementById("html-encode").addEventListener("click",()=>i("encode")),document.getElementById("html-decode").addEventListener("click",()=>i("decode")),document.getElementById("html-clear").addEventListener("click",()=>{o.value="",a.value="",n.hidden=!0,n.setAttribute("aria-hidden","true"),e.setOutputState(u,"empty"),e.setStatus(d,"",""),o.focus()}),document.getElementById("html-copy").addEventListener("click",c=>e.copy({button:c.currentTarget,value:a.value,status:d,messages:{empty:t.required,copied:t.copied,copyFailed:t.copyFailed}})),e.bindShortcut(o,()=>i("encode"))})();})();
