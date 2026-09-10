(()=>{(function(){let d=document.getElementById("tool-uuid");if(!d)return;let t=(d.getAttribute("data-lang")||"en")==="zh-cn"?{generateTitle:"\u751F\u6210 UUID v4",count:"\u751F\u6210\u6570\u91CF",generate:"\u751F\u6210",clear:"\u6E05\u7A7A",output:"\u751F\u6210\u7ED3\u679C",copy:"\u590D\u5236\u5168\u90E8",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236",generated:"UUID \u751F\u6210\u5B8C\u6210",validateTitle:"\u6821\u9A8C UUID",validateInput:"UUID \u5B57\u7B26\u4E32",validate:"\u6821\u9A8C",valid:"\u6709\u6548\u7684 RFC 9562 UUID",invalid:"UUID \u683C\u5F0F\u65E0\u6548",version:"\u7248\u672C",nil:"Nil UUID\uFF08\u5168\u96F6\uFF09",max:"Max UUID\uFF08\u5168 F\uFF09",required:"\u8BF7\u8F93\u5165 UUID"}:{generateTitle:"Generate UUID v4",count:"Quantity",generate:"Generate",clear:"Clear",output:"Generated UUIDs",copy:"Copy All",copied:"Copied",copyFailed:"Copy failed; please copy manually",generated:"UUID generation complete",validateTitle:"Validate UUID",validateInput:"UUID String",validate:"Validate",valid:"Valid RFC 9562 UUID",invalid:"Invalid UUID format",version:"Version",nil:"Nil UUID (all zeros)",max:"Max UUID (all Fs)",required:"Enter a UUID"};d.innerHTML=`
        <div class="tool-container tool-section-stack">
            <section class="tool-section-stack" aria-labelledby="uuid-generate-title">
                <h2 class="tool-subheading" id="uuid-generate-title">${t.generateTitle}</h2>
                <div class="tool-inline-controls">
                    <div class="tool-field tool-field--compact">
                        <label class="tool-label" for="uuid-count">${t.count}</label>
                        <select class="tool-input" id="uuid-count">
                            <option value="1">1</option><option value="5" selected>5</option><option value="10">10</option>
                            <option value="25">25</option><option value="100">100</option>
                        </select>
                    </div>
                    <div class="tool-actions tool-actions--bottom">
                        <button type="button" class="tool-btn tool-btn--primary" id="uuid-generate">${t.generate}</button>
                        <button type="button" class="tool-btn tool-btn--secondary" id="uuid-clear">${t.clear}</button>
                    </div>
                </div>
                <div class="tool-status" id="uuid-status" role="status" aria-live="polite"></div>
                <div class="tool-field" id="uuid-output-panel" hidden aria-hidden="true">
                    <label class="tool-label" for="uuid-output">${t.output}</label>
                    <textarea class="tool-input tool-code-input" id="uuid-output" rows="7" readonly></textarea>
                    <button type="button" class="tool-btn tool-btn--copy tool-align-end" id="uuid-copy">${t.copy}</button>
                </div>
            </section>
            <section class="tool-section-stack tool-section-divider" aria-labelledby="uuid-validate-title">
                <h2 class="tool-subheading" id="uuid-validate-title">${t.validateTitle}</h2>
                <div class="tool-field">
                    <label class="tool-label" for="uuid-validate-input">${t.validateInput}</label>
                    <input class="tool-input tool-code-input" type="text" id="uuid-validate-input" autocomplete="off" spellcheck="false">
                </div>
                <div class="tool-actions">
                    <button type="button" class="tool-btn tool-btn--primary" id="uuid-validate">${t.validate}</button>
                </div>
                <div class="tool-status" id="uuid-validation-status" role="status" aria-live="polite"></div>
            </section>
        </div>
    `;let u=document.getElementById("uuid-output"),a=document.getElementById("uuid-output-panel"),l=document.getElementById("uuid-status"),o=document.getElementById("uuid-validate-input"),n=document.getElementById("uuid-validation-status"),i=window.CodeGlimpseToolUi;document.getElementById("uuid-generate").addEventListener("click",()=>{try{u.value=window.CodeGlimpseUuid.generateMany(document.getElementById("uuid-count").value).join(`
`),a.hidden=!1,a.setAttribute("aria-hidden","false"),i.setStatus(l,"success",t.generated)}catch(e){i.setStatus(l,"error",e.message)}}),document.getElementById("uuid-clear").addEventListener("click",()=>{u.value="",a.hidden=!0,a.setAttribute("aria-hidden","true"),i.setStatus(l,"","")}),document.getElementById("uuid-copy").addEventListener("click",e=>i.copy({button:e.currentTarget,value:u.value,status:l,messages:{empty:t.required,copied:t.copied,copyFailed:t.copyFailed}}));function s(){if(!o.value.trim()){i.setStatus(n,"error",t.required);return}try{let e=window.CodeGlimpseUuid.inspect(o.value),c=e.type==="nil"?t.nil:e.type==="max"?t.max:`${t.version} ${e.version}`;i.setStatus(n,"success",`${t.valid}: ${c}`)}catch{i.setStatus(n,"error",t.invalid)}}document.getElementById("uuid-validate").addEventListener("click",s),o.addEventListener("input",()=>{o.value||i.setStatus(n,"","")}),o.addEventListener("keydown",e=>{e.key==="Enter"&&(e.preventDefault(),s())})})();})();
