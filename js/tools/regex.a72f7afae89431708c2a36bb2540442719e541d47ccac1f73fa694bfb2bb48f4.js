(()=>{(function(){let i=document.getElementById("tool-regex");if(!i)return;let e=(i.getAttribute("data-lang")||"en")==="zh-cn"?{pattern:"\u6B63\u5219\u8868\u8FBE\u5F0F",patternPlaceholder:"\u4F8B\u5982\uFF1A(\\w+)=(\\d+)",flags:"\u6807\u5FD7",input:"\u6D4B\u8BD5\u6587\u672C",inputPlaceholder:"\u8F93\u5165\u8981\u5339\u914D\u7684\u6587\u672C...",replacement:"\u66FF\u6362\u8868\u8FBE\u5F0F",replacementPlaceholder:"\u4F8B\u5982\uFF1A$1: $2",run:"\u6D4B\u8BD5\u5E76\u66FF\u6362",clear:"\u6E05\u7A7A",matches:"\u5339\u914D\u7ED3\u679C",replacementOutput:"\u66FF\u6362\u9884\u89C8",copy:"\u590D\u5236\u66FF\u6362\u7ED3\u679C",required:"\u8BF7\u8F93\u5165\u6B63\u5219\u8868\u8FBE\u5F0F",running:"\u6B63\u5728\u5B89\u5168\u6267\u884C\u6B63\u5219\u8868\u8FBE\u5F0F...",noMatches:"\u6CA1\u6709\u627E\u5230\u5339\u914D\u9879",complete:"\u6267\u884C\u5B8C\u6210\uFF0C\u5339\u914D {count} \u9879",truncated:"\u6267\u884C\u5B8C\u6210\uFF0C\u4EC5\u663E\u793A\u524D {count} \u9879",timeout:"\u6267\u884C\u8D85\u8FC7 800 \u6BEB\u79D2\uFF0C\u5DF2\u7EC8\u6B62\u4EE5\u907F\u514D\u9875\u9762\u5361\u6B7B",failed:"\u6B63\u5219\u8868\u8FBE\u5F0F\u6267\u884C\u5931\u8D25",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236",empty:"\u6CA1\u6709\u53EF\u590D\u5236\u7684\u7ED3\u679C",workerUnavailable:"\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u9694\u79BB\u6267\u884C\u6B63\u5219\u8868\u8FBE\u5F0F"}:{pattern:"Regular Expression",patternPlaceholder:"Example: (\\w+)=(\\d+)",flags:"Flags",input:"Test Text",inputPlaceholder:"Enter text to match...",replacement:"Replacement",replacementPlaceholder:"Example: $1: $2",run:"Test and Replace",clear:"Clear",matches:"Matches",replacementOutput:"Replacement Preview",copy:"Copy Replacement",required:"Enter a regular expression",running:"Running the expression in an isolated worker...",noMatches:"No matches found",complete:"Completed with {count} matches",truncated:"Completed; showing the first {count} matches",timeout:"Execution exceeded 800 ms and was stopped to keep the page responsive",failed:"Regular expression execution failed",copied:"Copied",copyFailed:"Copy failed; please copy manually",empty:"There is no result to copy",workerUnavailable:"This browser cannot run the expression in an isolated worker"};i.innerHTML=`
        <div class="tool-container tool-section-stack">
            <div class="tool-field">
                <label class="tool-label" for="regex-pattern">${e.pattern}</label>
                <input class="tool-input tool-code-input" type="text" id="regex-pattern" spellcheck="false" autocomplete="off" placeholder="${e.patternPlaceholder}">
            </div>
            <fieldset class="tool-fieldset tool-fieldset--inline">
                <legend>${e.flags}</legend>
                <div class="tool-check-grid">
                    ${["g","i","m","s","u","y"].map(t=>`<label class="tool-check"><input type="checkbox" data-regex-flag="${t}"${t==="g"?" checked":""}><span>${t}</span></label>`).join("")}
                </div>
            </fieldset>
            <div class="tool-field">
                <label class="tool-label" for="regex-input">${e.input}</label>
                <textarea class="tool-input tool-code-input" id="regex-input" rows="8" spellcheck="false" placeholder="${e.inputPlaceholder}"></textarea>
            </div>
            <div class="tool-field">
                <label class="tool-label" for="regex-replacement">${e.replacement}</label>
                <input class="tool-input tool-code-input" type="text" id="regex-replacement" spellcheck="false" autocomplete="off" placeholder="${e.replacementPlaceholder}">
            </div>
            <div class="tool-actions">
                <button type="button" class="tool-btn tool-btn--primary" id="regex-run">${e.run}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="regex-clear">${e.clear}</button>
            </div>
            <div class="tool-status" id="regex-status" role="status" aria-live="polite"></div>
            <div class="tool-split" id="regex-output" hidden aria-hidden="true">
                <div class="tool-field">
                    <label class="tool-label" for="regex-match-output">${e.matches}</label>
                    <textarea class="tool-input tool-code-input" id="regex-match-output" rows="10" readonly></textarea>
                </div>
                <div class="tool-field">
                    <label class="tool-label" for="regex-replacement-output">${e.replacementOutput}</label>
                    <textarea class="tool-input tool-code-input" id="regex-replacement-output" rows="10" readonly></textarea>
                    <button type="button" class="tool-btn tool-btn--copy" id="regex-copy">${e.copy}</button>
                </div>
            </div>
        </div>
    `;let u=document.getElementById("regex-pattern"),p=document.getElementById("regex-input"),x=document.getElementById("regex-replacement"),m=document.getElementById("regex-run"),l=document.getElementById("regex-output"),y=document.getElementById("regex-match-output"),g=document.getElementById("regex-replacement-output"),r=document.getElementById("regex-status"),a=window.CodeGlimpseToolUi;function k(){return Array.from(i.querySelectorAll("[data-regex-flag]:checked")).map(t=>t.getAttribute("data-regex-flag")).join("")}function E(t){let o=Array.from(document.scripts).find(s=>/\/js\/tools\/regex-core\.[a-f0-9]{64}\.js$/i.test(s.src));return!window.Worker||!o?Promise.reject(new Error(e.workerUnavailable)):new Promise((s,c)=>{let f=`
                importScripts(${JSON.stringify(o.src)});
                self.onmessage = function (event) {
                    try {
                        self.postMessage({ ok: true, result: self.CodeGlimpseRegex.execute(
                            event.data.pattern,
                            event.data.flags,
                            event.data.input,
                            event.data.replacement
                        ) });
                    } catch (error) {
                        self.postMessage({ ok: false, message: error.message });
                    }
                };
            `,v=URL.createObjectURL(new Blob([f],{type:"text/javascript"})),d=new Worker(v),w=!1,h=()=>w?!1:(w=!0,d.terminate(),URL.revokeObjectURL(v),!0),$=window.setTimeout(()=>{if(!h())return;let n=new Error(e.timeout);n.code="TIMEOUT",c(n)},800);d.onmessage=n=>{h()&&(window.clearTimeout($),n.data.ok?s(n.data.result):c(new Error(n.data.message)))},d.onerror=()=>{h()&&(window.clearTimeout($),c(new Error(e.failed)))},d.postMessage(t)})}function S(t){return t.map((o,s)=>{let c=o.captures.length?` | captures: ${JSON.stringify(o.captures)}`:"",f=o.groups?` | groups: ${JSON.stringify(o.groups)}`:"";return`#${s+1} @ ${o.index}: ${JSON.stringify(o.match)}${c}${f}`}).join(`
`)}async function b(){if(!u.value){a.setStatus(r,"error",e.required);return}m.disabled=!0,a.setStatus(r,"info",e.running);try{let t=await E({flags:k(),input:p.value,pattern:u.value,replacement:x.value});y.value=S(t.matches),g.value=t.replacement,l.hidden=!1,l.setAttribute("aria-hidden","false"),t.matches.length===0?a.setStatus(r,"info",e.noMatches):a.setStatus(r,"success",(t.truncated?e.truncated:e.complete).replace("{count}",t.matches.length))}catch(t){l.hidden=!0,l.setAttribute("aria-hidden","true"),a.setStatus(r,"error",t.code==="TIMEOUT"?e.timeout:`${e.failed}: ${t.message}`)}finally{m.disabled=!1}}m.addEventListener("click",b),document.getElementById("regex-clear").addEventListener("click",()=>{u.value="",p.value="",x.value="",y.value="",g.value="",l.hidden=!0,l.setAttribute("aria-hidden","true"),a.setStatus(r,"",""),u.focus()}),document.getElementById("regex-copy").addEventListener("click",t=>a.copy({button:t.currentTarget,value:g.value,status:r,messages:{empty:e.empty,copied:e.copied,copyFailed:e.copyFailed}})),a.bindShortcut(p,b)})();})();
