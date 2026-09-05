(()=>{var q=(s,i)=>()=>(i||s((i={exports:{}}).exports,i),i.exports);var C=q(($,m)=>{(function(s,i){let u=i();if(typeof m=="object"&&m.exports&&(m.exports=u),s&&(s.CodeGlimpseJsonTool=u),s&&s.document){let d=()=>u.mount(s.document);s.document.readyState==="loading"?s.document.addEventListener("DOMContentLoaded",d,{once:!0}):d()}})(typeof globalThis<"u"?globalThis:$,function(){let s={2:"  ",4:"    ",tab:"	"};function i(e){return JSON.parse(String(e))}function u(e){return s[e]||s[2]}function d(e,o){return JSON.stringify(i(e),null,u(o))}function j(e){return JSON.stringify(i(e))}function g(e){return i(e),!0}function x(e){return JSON.stringify(String(e)).slice(1,-1)}function h(e){let o=String(e);if(o.length>=2&&o[0]==='"'&&o[o.length-1]==='"'){let r=JSON.parse(o);if(typeof r!="string")throw new SyntaxError("Expected a JSON string literal");return r}return JSON.parse(`"${o}"`)}function E(e){let r=(e&&e.message?e.message:"").match(/position\s+(\d+)/i);return r?Number(r[1]):null}function N(e,o,r){let t=E(e);if(t==null||t>o.length)return`${r.invalid}: ${e.message}`;let a=o.slice(0,t).split(/\r\n|\r|\n/),y=a.length,p=a[a.length-1].length+1;return`${r.invalid}: ${e.message} (${r.position} ${y}, ${p})`}function O(e){let o=e.getElementById("tool-json");if(!o||o.dataset.mounted==="true")return;o.dataset.mounted="true";let t=(o.getAttribute("data-lang")||"en")==="zh-cn"?{inputLabel:"\u8F93\u5165 JSON",outputLabel:"\u5904\u7406\u7ED3\u679C",indentLabel:"\u7F29\u8FDB",indent2:"2 \u4E2A\u7A7A\u683C",indent4:"4 \u4E2A\u7A7A\u683C",indentTab:"Tab",format:"\u683C\u5F0F\u5316",minify:"\u538B\u7F29",validate:"\u6821\u9A8C",escape:"\u8F6C\u4E49",unescape:"\u53CD\u8F6C\u4E49",example:"\u793A\u4F8B",clear:"\u6E05\u7A7A",copy:"\u590D\u5236\u7ED3\u679C",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236",valid:"JSON \u683C\u5F0F\u6709\u6548",escaped:"\u8F6C\u4E49\u5B8C\u6210",unescaped:"\u53CD\u8F6C\u4E49\u5B8C\u6210",required:"\u8BF7\u8F93\u5165 JSON \u5185\u5BB9",invalid:"JSON \u65E0\u6548",invalidEscaped:"\u8F6C\u4E49\u6587\u672C\u65E0\u6548",position:"\u4F4D\u7F6E",exampleLoaded:"\u793A\u4F8B\u5DF2\u52A0\u8F7D",cleared:"\u5185\u5BB9\u5DF2\u6E05\u7A7A"}:{inputLabel:"Input JSON",outputLabel:"Result",indentLabel:"Indentation",indent2:"2 spaces",indent4:"4 spaces",indentTab:"Tab",format:"Format",minify:"Minify",validate:"Validate",escape:"Escape",unescape:"Unescape",example:"Example",clear:"Clear",copy:"Copy Result",copied:"Copied",copyFailed:"Copy failed; please copy manually",valid:"Valid JSON",escaped:"Escaping complete",unescaped:"Unescaping complete",required:"Please enter JSON content",invalid:"Invalid JSON",invalidEscaped:"Invalid escaped text",position:"position",exampleLoaded:"Example loaded",cleared:"Content cleared"};o.innerHTML=`
            <style>
                #tool-json .json-tool-container { display: flex; flex-direction: column; gap: 1.5rem; }
                #tool-json .json-field { display: flex; flex-direction: column; gap: 0.6rem; }
                #tool-json .json-label { color: var(--card-text-color-main); font-size: 1.4rem; font-weight: bold; }
                #tool-json .json-textarea {
                    width: 100%;
                    min-height: 220px;
                    padding: 1.2rem;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--body-background);
                    color: var(--card-text-color-main);
                    font-family: 'Fira Code', Consolas, monospace;
                    font-size: 1.35rem;
                    line-height: 1.6;
                    resize: vertical;
                    outline: none;
                    box-sizing: border-box;
                }
                #tool-json .json-textarea:focus,
                #tool-json select:focus { border-color: var(--accent-color); }
                #tool-json .json-toolbar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
                #tool-json .json-indent { display: flex; align-items: center; gap: 0.6rem; }
                #tool-json .json-indent label { color: var(--card-text-color-main); font-size: 1.3rem; }
                #tool-json select {
                    padding: 0.75rem 1rem;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    background: var(--body-background);
                    color: var(--card-text-color-main);
                    font-size: 1.3rem;
                }
                #tool-json .json-buttons { display: flex; gap: 0.8rem; flex-wrap: wrap; }
                #tool-json .json-button {
                    padding: 0.8rem 1.2rem;
                    border: 1px solid var(--accent-color);
                    border-radius: 6px;
                    background: var(--accent-color);
                    color: #fff;
                    cursor: pointer;
                    font-size: 1.3rem;
                    font-weight: bold;
                    transition: opacity 0.2s, transform 0.2s;
                }
                #tool-json .json-button:hover { opacity: 0.9; transform: translateY(-1px); }
                #tool-json .json-button.secondary {
                    background: var(--body-background);
                    color: var(--card-text-color-main);
                }
                #tool-json .json-status { min-height: 2rem; font-size: 1.3rem; line-height: 1.5; }
                #tool-json .json-status.success { color: #198754; }
                #tool-json .json-status.error { color: #dc3545; }
                #tool-json .json-output-wrapper { position: relative; }
                #tool-json .json-copy-button { position: absolute; right: 1rem; top: 3.3rem; }
                @media (max-width: 600px) {
                    #tool-json .json-textarea { min-height: 180px; font-size: 1.2rem; }
                    #tool-json .json-button { flex: 1 1 calc(50% - 0.8rem); }
                }
            </style>
            <div class="json-tool-container tool-text-tool" data-output-state="ready">
                <div class="json-field tool-field tool-input-panel">
                    <label class="json-label tool-label" for="json-input">${t.inputLabel}</label>
                    <textarea id="json-input" class="json-textarea" spellcheck="false" placeholder="{
  &quot;name&quot;: &quot;Fernweh&quot;
}"></textarea>
                </div>
                <div class="json-toolbar tool-actions tool-action-panel">
                    <div class="json-indent">
                        <label for="json-indent-select">${t.indentLabel}</label>
                        <select id="json-indent-select">
                            <option value="2">${t.indent2}</option>
                            <option value="4">${t.indent4}</option>
                            <option value="tab">${t.indentTab}</option>
                        </select>
                    </div>
                    <div class="json-buttons">
                        <button class="json-button tool-btn tool-btn--primary" type="button" data-action="format">${t.format}</button>
                        <button class="json-button tool-btn tool-btn--primary" type="button" data-action="minify">${t.minify}</button>
                        <button class="json-button tool-btn tool-btn--primary" type="button" data-action="validate">${t.validate}</button>
                        <button class="json-button tool-btn tool-btn--primary" type="button" data-action="escape">${t.escape}</button>
                        <button class="json-button tool-btn tool-btn--primary" type="button" data-action="unescape">${t.unescape}</button>
                        <button class="json-button secondary tool-btn tool-btn--secondary" type="button" data-action="example">${t.example}</button>
                        <button class="json-button secondary tool-btn tool-btn--secondary" type="button" data-action="clear">${t.clear}</button>
                    </div>
                </div>
                <div id="json-status" class="json-status tool-status" role="status" aria-live="polite"></div>
                <div class="json-field json-output-wrapper tool-field tool-output-panel">
                    <label class="json-label tool-label" for="json-output">${t.outputLabel}</label>
                    <textarea id="json-output" class="json-textarea" spellcheck="false" readonly></textarea>
                    <button class="json-button json-copy-button tool-btn tool-btn--copy" type="button" data-action="copy" disabled>${t.copy}</button>
                </div>
            </div>
        `;let l=e.getElementById("json-input"),a=e.getElementById("json-output"),y=e.getElementById("json-indent-select"),p=e.getElementById("json-status"),w=o.querySelectorAll("[data-action]"),S=o.querySelector('[data-action="copy"]'),v=window.CodeGlimpseToolUi;function c(n,f){v.setStatus(p,n,f)}function b(){S.disabled=!a.value}function L(){return l.value.trim()?!0:(c("error",t.required),!1)}function J(n){if(n==="example"){l.value=JSON.stringify({name:"Fernweh",description:"A digital garden",tools:["JSON","Base64"],enabled:!0,metadata:{version:1}},null,2),a.value="",c("success",t.exampleLoaded),b();return}if(n==="clear"){l.value="",a.value="",c("success",t.cleared),b(),l.focus();return}if(n==="copy"){T();return}if(L())try{n==="format"?(a.value=d(l.value,y.value),c("success",t.valid)):n==="minify"?(a.value=j(l.value),c("success",t.valid)):n==="validate"?(g(l.value),c("success",t.valid)):n==="escape"?(a.value=x(l.value),c("success",t.escaped)):n==="unescape"&&(a.value=h(l.value),c("success",t.unescaped)),b()}catch(f){let I=n==="unescape"?`${t.invalidEscaped}: ${f.message}`:N(f,l.value,t);c("error",I),a.value="",b()}}async function T(){await v.copy({button:S,value:a.value,status:p,messages:{empty:t.required,copied:t.copied,copyFailed:t.copyFailed}})}w.forEach(n=>{n.addEventListener("click",()=>J(n.dataset.action))}),v.bindShortcut(l,()=>J("format"))}return{escapeJsonText:x,formatJson:d,minifyJson:j,parseJson:i,unescapeJsonText:h,validateJson:g,mount:O}})});C();})();
