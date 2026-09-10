(()=>{(function(){let a=document.getElementById("tool-text");if(!a)return;let c=a.getAttribute("data-lang")||"en",r=c==="zh-cn"?"zh-CN":"en",t=c==="zh-cn"?{input:"\u8F93\u5165\u6587\u672C",placeholder:"\u8F93\u5165\u9700\u8981\u7EDF\u8BA1\u6216\u8F6C\u6362\u7684\u6587\u672C...",output:"\u8F6C\u6362\u7ED3\u679C",characters:"\u5B57\u7B26",noSpaces:"\u4E0D\u542B\u7A7A\u767D",words:"\u8BCD\u6570",lines:"\u884C\u6570",bytes:"UTF-8 \u5B57\u8282",upper:"\u8F6C\u5927\u5199",lower:"\u8F6C\u5C0F\u5199",title:"\u6807\u9898\u683C\u5F0F",sentence:"\u53E5\u9996\u5927\u5199",trimLines:"\u6E05\u7406\u884C\u9996\u5C3E",collapse:"\u5408\u5E76\u591A\u4F59\u7A7A\u767D",clear:"\u6E05\u7A7A",copy:"\u590D\u5236\u7ED3\u679C",transformed:"\u6587\u672C\u8F6C\u6362\u5B8C\u6210",required:"\u8BF7\u8F93\u5165\u6587\u672C",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236"}:{input:"Input Text",placeholder:"Enter text to analyze or transform...",output:"Transformed Text",characters:"Characters",noSpaces:"No Whitespace",words:"Words",lines:"Lines",bytes:"UTF-8 Bytes",upper:"UPPERCASE",lower:"lowercase",title:"Title Case",sentence:"Sentence case",trimLines:"Trim Lines",collapse:"Collapse Whitespace",clear:"Clear",copy:"Copy Result",transformed:"Text transformation complete",required:"Enter text",copied:"Copied",copyFailed:"Copy failed; please copy manually"};a.innerHTML=`
        <div class="tool-container tool-text-tool" data-output-state="empty">
            <div class="tool-field tool-input-panel">
                <label class="tool-label" for="text-input">${t.input}</label>
                <textarea class="tool-input tool-code-input" id="text-input" rows="10" placeholder="${t.placeholder}"></textarea>
                <dl class="tool-metrics" aria-live="polite">
                    <div><dt>${t.characters}</dt><dd id="text-characters">0</dd></div>
                    <div><dt>${t.noSpaces}</dt><dd id="text-no-spaces">0</dd></div>
                    <div><dt>${t.words}</dt><dd id="text-words">0</dd></div>
                    <div><dt>${t.lines}</dt><dd id="text-lines">0</dd></div>
                    <div><dt>${t.bytes}</dt><dd id="text-bytes">0</dd></div>
                </dl>
            </div>
            <div class="tool-actions tool-action-panel">
                <button type="button" class="tool-btn tool-btn--primary" data-text-mode="upper">${t.upper}</button>
                <button type="button" class="tool-btn tool-btn--primary" data-text-mode="lower">${t.lower}</button>
                <button type="button" class="tool-btn tool-btn--primary" data-text-mode="title">${t.title}</button>
                <button type="button" class="tool-btn tool-btn--primary" data-text-mode="sentence">${t.sentence}</button>
                <button type="button" class="tool-btn tool-btn--secondary" data-text-mode="trim-lines">${t.trimLines}</button>
                <button type="button" class="tool-btn tool-btn--secondary" data-text-mode="collapse-whitespace">${t.collapse}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="text-clear">${t.clear}</button>
            </div>
            <div class="tool-status" id="text-status" role="status" aria-live="polite"></div>
            <div class="tool-field tool-output-panel" id="text-output-panel" hidden aria-hidden="true">
                <label class="tool-label" for="text-output">${t.output}</label>
                <textarea class="tool-input tool-code-input" id="text-output" rows="10" readonly></textarea>
                <button type="button" class="tool-btn tool-btn--copy" id="text-copy">${t.copy}</button>
            </div>
        </div>
    `;let o=document.getElementById("text-input"),s=document.getElementById("text-output"),l=document.getElementById("text-output-panel"),d=document.getElementById("text-status"),u=a.querySelector(".tool-text-tool"),n=window.CodeGlimpseToolUi,p={bytes:document.getElementById("text-bytes"),characters:document.getElementById("text-characters"),charactersNoSpaces:document.getElementById("text-no-spaces"),lines:document.getElementById("text-lines"),words:document.getElementById("text-words")};function i(){let e=window.CodeGlimpseText.analyze(o.value,r);for(let[y,b]of Object.entries(p))b.textContent=e[y]}function m(e){if(!o.value){n.setStatus(d,"error",t.required);return}s.value=window.CodeGlimpseText.transform(o.value,e,r),l.hidden=!1,l.setAttribute("aria-hidden","false"),n.setOutputState(u,"ready"),n.setStatus(d,"success",t.transformed)}o.addEventListener("input",i),a.querySelectorAll("[data-text-mode]").forEach(e=>{e.addEventListener("click",()=>m(e.getAttribute("data-text-mode")))}),document.getElementById("text-clear").addEventListener("click",()=>{o.value="",s.value="",l.hidden=!0,l.setAttribute("aria-hidden","true"),n.setOutputState(u,"empty"),n.setStatus(d,"",""),i(),o.focus()}),document.getElementById("text-copy").addEventListener("click",e=>n.copy({button:e.currentTarget,value:s.value,status:d,messages:{empty:t.required,copied:t.copied,copyFailed:t.copyFailed}})),i()})();})();
