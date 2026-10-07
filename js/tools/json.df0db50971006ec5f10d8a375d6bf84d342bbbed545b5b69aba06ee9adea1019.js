(()=>{var C=(r,c)=>()=>(c||r((c={exports:{}}).exports,c),c.exports);var z=C((w,v)=>{(function(r,c){let b=c();if(typeof v=="object"&&v.exports&&(v.exports=b),r&&(r.CodeGlimpseJsonTool=b),r&&r.document){let f=()=>b.mount(r.document);r.document.readyState==="loading"?r.document.addEventListener("DOMContentLoaded",f,{once:!0}):f()}})(typeof globalThis<"u"?globalThis:w,function(){let r={2:"  ",4:"    ",tab:"	"};function c(e){return JSON.parse(String(e))}function b(e){return r[e]||r[2]}function f(e){let o=String(e);return c(o),o.match(/"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\],:]/g)}function g(e,o){let s=f(e),t=b(o),n=[],a=0,d=()=>n.push(`
`,t.repeat(a));return s.forEach((l,p)=>{l==="{"||l==="["?(n.push(l),a+=1,s[p+1]!=="}"&&s[p+1]!=="]"&&d()):l==="}"||l==="]"?(a-=1,s[p-1]!=="{"&&s[p-1]!=="["&&d(),n.push(l)):l===","?(n.push(l),d()):n.push(l===":"?": ":l)}),n.join("")}function x(e){return f(e).join("")}function h(e){return c(e),!0}function S(e){return JSON.stringify(String(e)).slice(1,-1)}function E(e){let o=String(e);if(o.length>=2&&o[0]==='"'&&o[o.length-1]==='"'){let s=JSON.parse(o);if(typeof s!="string")throw new SyntaxError("Expected a JSON string literal");return s}return JSON.parse(`"${o}"`)}function N(e){let s=(e&&e.message?e.message:"").match(/position\s+(\d+)/i);return s?Number(s[1]):null}function L(e,o,s){let t=N(e);if(t==null||t>o.length)return`${s.invalid}: ${e.message}`;let a=o.slice(0,t).split(/\r\n|\r|\n/),d=a.length,l=a[a.length-1].length+1;return`${s.invalid}: ${e.message} (${s.position} ${d}, ${l})`}function O(e){let o=e.getElementById("tool-json");if(!o||o.dataset.mounted==="true")return;o.dataset.mounted="true";let t=(o.getAttribute("data-lang")||"en")==="zh-cn"?{inputLabel:"\u8F93\u5165 JSON",outputLabel:"\u5904\u7406\u7ED3\u679C",indentLabel:"\u7F29\u8FDB",indent2:"2 \u4E2A\u7A7A\u683C",indent4:"4 \u4E2A\u7A7A\u683C",indentTab:"Tab",format:"\u683C\u5F0F\u5316",minify:"\u538B\u7F29",validate:"\u6821\u9A8C",escape:"\u8F6C\u4E49",unescape:"\u53CD\u8F6C\u4E49",example:"\u793A\u4F8B",clear:"\u6E05\u7A7A",copy:"\u590D\u5236\u7ED3\u679C",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236",valid:"JSON \u683C\u5F0F\u6709\u6548",escaped:"\u8F6C\u4E49\u5B8C\u6210",unescaped:"\u53CD\u8F6C\u4E49\u5B8C\u6210",required:"\u8BF7\u8F93\u5165 JSON \u5185\u5BB9",invalid:"JSON \u65E0\u6548",invalidEscaped:"\u8F6C\u4E49\u6587\u672C\u65E0\u6548",position:"\u4F4D\u7F6E",exampleLoaded:"\u793A\u4F8B\u5DF2\u52A0\u8F7D",cleared:"\u5185\u5BB9\u5DF2\u6E05\u7A7A"}:{inputLabel:"Input JSON",outputLabel:"Result",indentLabel:"Indentation",indent2:"2 spaces",indent4:"4 spaces",indentTab:"Tab",format:"Format",minify:"Minify",validate:"Validate",escape:"Escape",unescape:"Unescape",example:"Example",clear:"Clear",copy:"Copy Result",copied:"Copied",copyFailed:"Copy failed; please copy manually",valid:"Valid JSON",escaped:"Escaping complete",unescaped:"Unescaping complete",required:"Please enter JSON content",invalid:"Invalid JSON",invalidEscaped:"Invalid escaped text",position:"position",exampleLoaded:"Example loaded",cleared:"Content cleared"};o.innerHTML=`
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
        `;let n=e.getElementById("json-input"),a=e.getElementById("json-output"),d=e.getElementById("json-indent-select"),l=e.getElementById("json-status"),p=o.querySelectorAll("[data-action]"),$=o.querySelector('[data-action="copy"]'),j=window.CodeGlimpseToolUi;function u(i,y){j.setStatus(l,i,y)}function m(){$.disabled=!a.value}function T(){return n.value.trim()?!0:(u("error",t.required),!1)}function J(i){if(i==="example"){n.value=JSON.stringify({name:"Fernweh",description:"A digital garden",tools:["JSON","Base64"],enabled:!0,metadata:{version:1}},null,2),a.value="",u("success",t.exampleLoaded),m();return}if(i==="clear"){n.value="",a.value="",u("success",t.cleared),m(),n.focus();return}if(i==="copy"){I();return}if(T())try{i==="format"?(a.value=g(n.value,d.value),u("success",t.valid)):i==="minify"?(a.value=x(n.value),u("success",t.valid)):i==="validate"?(h(n.value),u("success",t.valid)):i==="escape"?(a.value=S(n.value),u("success",t.escaped)):i==="unescape"&&(a.value=E(n.value),u("success",t.unescaped)),m()}catch(y){let q=i==="unescape"?`${t.invalidEscaped}: ${y.message}`:L(y,n.value,t);u("error",q),a.value="",m()}}async function I(){await j.copy({button:$,value:a.value,status:l,messages:{empty:t.required,copied:t.copied,copyFailed:t.copyFailed}})}p.forEach(i=>{i.addEventListener("click",()=>J(i.dataset.action))}),j.bindShortcut(n,()=>J("format"))}return{escapeJsonText:S,formatJson:g,minifyJson:x,parseJson:c,unescapeJsonText:E,validateJson:h,mount:O}})});z();})();
