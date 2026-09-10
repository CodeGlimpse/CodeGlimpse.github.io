(()=>{(function(){let n=document.getElementById("tool-csv");if(!n)return;let t=(n.getAttribute("data-lang")||"en")==="zh-cn"?{csvToJson:"CSV \u8F6C JSON",jsonToCsv:"JSON \u8F6C CSV",delimiter:"\u5206\u9694\u7B26",comma:"\u9017\u53F7",semicolon:"\u5206\u53F7",tab:"Tab",pipe:"\u7AD6\u7EBF",header:"\u4F7F\u7528\u6807\u9898\u884C",inputCsv:"\u8F93\u5165 CSV",inputJson:"\u8F93\u5165 JSON \u6570\u7EC4",csvPlaceholder:`name,age
Alice,30`,jsonPlaceholder:`[
  {"name": "Alice", "age": 30}
]`,outputJson:"JSON \u7ED3\u679C",outputCsv:"CSV \u7ED3\u679C",convert:"\u8F6C\u6362",clear:"\u6E05\u7A7A",copy:"\u590D\u5236\u7ED3\u679C",required:"\u8BF7\u8F93\u5165\u9700\u8981\u8F6C\u6362\u7684\u5185\u5BB9",complete:"\u8F6C\u6362\u5B8C\u6210",failed:"\u8F6C\u6362\u5931\u8D25",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236"}:{csvToJson:"CSV to JSON",jsonToCsv:"JSON to CSV",delimiter:"Delimiter",comma:"Comma",semicolon:"Semicolon",tab:"Tab",pipe:"Pipe",header:"Use Header Row",inputCsv:"Input CSV",inputJson:"Input JSON Array",csvPlaceholder:`name,age
Alice,30`,jsonPlaceholder:`[
  {"name": "Alice", "age": 30}
]`,outputJson:"JSON Result",outputCsv:"CSV Result",convert:"Convert",clear:"Clear",copy:"Copy Result",required:"Enter content to convert",complete:"Conversion complete",failed:"Conversion failed",copied:"Copied",copyFailed:"Copy failed; please copy manually"};n.innerHTML=`
        <div class="tool-container tool-text-tool" data-output-state="empty" data-mode="csv-to-json">
            <div class="tool-field tool-input-panel">
                <div class="tool-segmented" role="group" aria-label="${t.convert}">
                    <button type="button" class="tool-segmented__button" id="csv-mode-csv" data-csv-mode="csv-to-json" aria-pressed="true">${t.csvToJson}</button>
                    <button type="button" class="tool-segmented__button" id="csv-mode-json" data-csv-mode="json-to-csv" aria-pressed="false">${t.jsonToCsv}</button>
                </div>
                <div class="tool-inline-controls">
                    <div class="tool-field tool-field--compact">
                        <label class="tool-label" for="csv-delimiter">${t.delimiter}</label>
                        <select class="tool-input" id="csv-delimiter">
                            <option value="comma">${t.comma}</option><option value="semicolon">${t.semicolon}</option>
                            <option value="tab">${t.tab}</option><option value="pipe">${t.pipe}</option>
                        </select>
                    </div>
                    <label class="tool-check tool-check--bottom" for="csv-header">
                        <input type="checkbox" id="csv-header" checked>
                        <span>${t.header}</span>
                    </label>
                </div>
                <label class="tool-label" for="csv-input" id="csv-input-label">${t.inputCsv}</label>
                <textarea class="tool-input tool-code-input" id="csv-input" rows="11" spellcheck="false" placeholder="${t.csvPlaceholder}"></textarea>
            </div>
            <div class="tool-actions tool-action-panel">
                <button type="button" class="tool-btn tool-btn--primary" id="csv-convert">${t.convert}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="csv-clear">${t.clear}</button>
            </div>
            <div class="tool-status" id="csv-status" role="status" aria-live="polite"></div>
            <div class="tool-field tool-output-panel" id="csv-output-panel" hidden aria-hidden="true">
                <label class="tool-label" for="csv-output" id="csv-output-label">${t.outputJson}</label>
                <textarea class="tool-input tool-code-input" id="csv-output" rows="11" readonly></textarea>
                <button type="button" class="tool-btn tool-btn--copy" id="csv-copy">${t.copy}</button>
            </div>
        </div>
    `;let a=n.querySelector(".tool-text-tool"),l=document.getElementById("csv-input"),d=document.getElementById("csv-output"),s=document.getElementById("csv-output-panel"),c=document.getElementById("csv-status"),e=window.CodeGlimpseToolUi,p={comma:",",semicolon:";",tab:"	",pipe:"|"};function v(o){a.dataset.mode=o,n.querySelectorAll("[data-csv-mode]").forEach(r=>{r.setAttribute("aria-pressed",String(r.getAttribute("data-csv-mode")===o))});let i=o==="csv-to-json";document.getElementById("csv-input-label").textContent=i?t.inputCsv:t.inputJson,document.getElementById("csv-output-label").textContent=i?t.outputJson:t.outputCsv,l.placeholder=i?t.csvPlaceholder:t.jsonPlaceholder,d.value="",s.hidden=!0,s.setAttribute("aria-hidden","true"),e.setOutputState(a,"empty"),e.setStatus(c,"","")}function u(){if(!l.value.trim()){e.setStatus(c,"error",t.required);return}let o={delimiter:p[document.getElementById("csv-delimiter").value],header:document.getElementById("csv-header").checked};try{d.value=a.dataset.mode==="csv-to-json"?JSON.stringify(window.CodeGlimpseCsv.csvToJson(l.value,o),null,2):window.CodeGlimpseCsv.jsonToCsv(l.value,o),s.hidden=!1,s.setAttribute("aria-hidden","false"),e.setOutputState(a,"ready"),e.setStatus(c,"success",t.complete)}catch(i){s.hidden=!0,s.setAttribute("aria-hidden","true"),e.setOutputState(a,"empty"),e.setStatus(c,"error",`${t.failed}: ${i.message}`)}}n.querySelectorAll("[data-csv-mode]").forEach(o=>{o.addEventListener("click",()=>v(o.getAttribute("data-csv-mode")))}),document.getElementById("csv-convert").addEventListener("click",u),document.getElementById("csv-clear").addEventListener("click",()=>{l.value="",d.value="",s.hidden=!0,s.setAttribute("aria-hidden","true"),e.setOutputState(a,"empty"),e.setStatus(c,"",""),l.focus()}),document.getElementById("csv-copy").addEventListener("click",o=>e.copy({button:o.currentTarget,value:d.value,status:c,messages:{empty:t.required,copied:t.copied,copyFailed:t.copyFailed}})),e.bindShortcut(l,u)})();})();
