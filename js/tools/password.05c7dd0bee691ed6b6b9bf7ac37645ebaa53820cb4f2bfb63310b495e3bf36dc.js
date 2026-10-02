(()=>{(function(){let n=document.getElementById("tool-password");if(!n)return;let e=(n.getAttribute("data-lang")||"en")==="zh-cn"?{length:"\u5BC6\u7801\u957F\u5EA6",count:"\u751F\u6210\u6570\u91CF",lower:"\u5C0F\u5199\u5B57\u6BCD",upper:"\u5927\u5199\u5B57\u6BCD",numbers:"\u6570\u5B57",symbols:"\u7B26\u53F7",ambiguous:"\u6392\u9664\u6613\u6DF7\u6DC6\u5B57\u7B26\uFF08I\u3001l\u30011\u3001O\u30010\u3001o\uFF09",entropy:"\u4F30\u7B97\u71B5",bits:"\u4F4D",generate:"\u751F\u6210\u5BC6\u7801",clear:"\u6E05\u7A7A",output:"\u751F\u6210\u7ED3\u679C",copy:"\u590D\u5236\u5168\u90E8",generated:"\u5BC6\u7801\u5DF2\u5728\u6D4F\u89C8\u5668\u672C\u5730\u751F\u6210",failed:"\u65E0\u6CD5\u751F\u6210\u5BC6\u7801",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236",empty:"\u8BF7\u5148\u751F\u6210\u5BC6\u7801"}:{length:"Password Length",count:"Quantity",lower:"Lowercase",upper:"Uppercase",numbers:"Numbers",symbols:"Symbols",ambiguous:"Exclude ambiguous characters (I, l, 1, O, 0, o)",entropy:"Estimated Entropy",bits:"bits",generate:"Generate Passwords",clear:"Clear",output:"Generated Passwords",copy:"Copy All",generated:"Passwords generated locally in your browser",failed:"Unable to generate passwords",copied:"Copied",copyFailed:"Copy failed; please copy manually",empty:"Generate a password first"};n.innerHTML=`
        <div class="tool-container tool-section-stack">
            <div class="tool-form-grid">
                <div class="tool-field tool-field--wide">
                    <label class="tool-label" for="password-length">${e.length}</label>
                    <div class="tool-range-row">
                        <input class="tool-range" type="range" id="password-length" min="8" max="128" value="20">
                        <input class="tool-input tool-number-input" type="number" id="password-length-number" min="8" max="128" value="20" aria-label="${e.length}">
                    </div>
                </div>
                <div class="tool-field tool-field--compact">
                    <label class="tool-label" for="password-count">${e.count}</label>
                    <select class="tool-input" id="password-count">
                        <option value="1">1</option><option value="5" selected>5</option><option value="10">10</option><option value="20">20</option>
                    </select>
                </div>
            </div>
            <fieldset class="tool-fieldset">
                <legend>${e.generate}</legend>
                <div class="tool-check-grid tool-check-grid--options">
                    <label class="tool-check"><input type="checkbox" id="password-lower" checked><span>${e.lower}</span></label>
                    <label class="tool-check"><input type="checkbox" id="password-upper" checked><span>${e.upper}</span></label>
                    <label class="tool-check"><input type="checkbox" id="password-numbers" checked><span>${e.numbers}</span></label>
                    <label class="tool-check"><input type="checkbox" id="password-symbols" checked><span>${e.symbols}</span></label>
                    <label class="tool-check tool-check--wide"><input type="checkbox" id="password-ambiguous"><span>${e.ambiguous}</span></label>
                </div>
            </fieldset>
            <div class="tool-inline-summary"><strong>${e.entropy}:</strong> <span id="password-entropy">0</span> ${e.bits}</div>
            <div class="tool-actions">
                <button type="button" class="tool-btn tool-btn--primary" id="password-generate">${e.generate}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="password-clear">${e.clear}</button>
            </div>
            <div class="tool-status" id="password-status" role="status" aria-live="polite"></div>
            <div class="tool-field" id="password-output-panel" hidden aria-hidden="true">
                <label class="tool-label" for="password-output">${e.output}</label>
                <textarea class="tool-input tool-code-input" id="password-output" rows="8" readonly></textarea>
                <button type="button" class="tool-btn tool-btn--copy tool-align-end" id="password-copy">${e.copy}</button>
            </div>
        </div>
    `;let d=document.getElementById("password-length"),l=document.getElementById("password-length-number"),r=document.getElementById("password-output"),o=document.getElementById("password-output-panel"),s=document.getElementById("password-status"),i=document.getElementById("password-entropy"),a=window.CodeGlimpseToolUi;function u(){return{excludeAmbiguous:document.getElementById("password-ambiguous").checked,length:Number(l.value),lower:document.getElementById("password-lower").checked,numbers:document.getElementById("password-numbers").checked,symbols:document.getElementById("password-symbols").checked,upper:document.getElementById("password-upper").checked}}function c(){try{i.textContent=window.CodeGlimpsePassword.estimateEntropy(u()).toFixed(1),a.setStatus(s,"","")}catch{i.textContent="0"}}function p(t,b){let m=Math.min(128,Math.max(8,Number(t.value)||8));t.value=m,b.value=m,c()}d.addEventListener("input",()=>p(d,l)),l.addEventListener("input",()=>p(l,d)),n.querySelectorAll('input[type="checkbox"]').forEach(t=>t.addEventListener("change",c)),document.getElementById("password-generate").addEventListener("click",()=>{try{r.value=window.CodeGlimpsePassword.generateMany(u(),Number(document.getElementById("password-count").value)).join(`
`),o.hidden=!1,o.setAttribute("aria-hidden","false"),a.setStatus(s,"success",e.generated)}catch(t){o.hidden=!0,o.setAttribute("aria-hidden","true"),a.setStatus(s,"error",`${e.failed}: ${t.message}`)}}),document.getElementById("password-clear").addEventListener("click",()=>{r.value="",o.hidden=!0,o.setAttribute("aria-hidden","true"),a.setStatus(s,"","")}),document.getElementById("password-copy").addEventListener("click",t=>a.copy({button:t.currentTarget,value:r.value,status:s,messages:{empty:e.empty,copied:e.copied,copyFailed:e.copyFailed}})),c()})();})();
