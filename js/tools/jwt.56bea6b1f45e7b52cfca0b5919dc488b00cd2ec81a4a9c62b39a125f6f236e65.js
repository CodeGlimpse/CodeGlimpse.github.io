(()=>{(function(){let i=document.getElementById("tool-jwt");if(!i)return;let e=(i.getAttribute("data-lang")||"en")==="zh-cn"?{input:"JWT \u5B57\u7B26\u4E32",placeholder:"\u7C98\u8D34\u7531\u4E09\u6BB5\u7EC4\u6210\u7684 JWT...",decode:"\u89E3\u6790",example:"\u52A0\u8F7D\u793A\u4F8B",clear:"\u6E05\u7A7A",warning:"\u672C\u5DE5\u5177\u4EC5\u89E3\u6790\u4EE4\u724C\u5185\u5BB9\uFF0C\u4E0D\u9A8C\u8BC1\u7B7E\u540D\uFF0C\u4E5F\u4E0D\u80FD\u8BC1\u660E\u4EE4\u724C\u53EF\u4FE1\u3002",header:"Header",payload:"Payload",claims:"\u65F6\u95F4\u58F0\u660E",issuedAt:"\u7B7E\u53D1\u65F6\u95F4 (iat)",notBefore:"\u751F\u6548\u65F6\u95F4 (nbf)",expiresAt:"\u8FC7\u671F\u65F6\u95F4 (exp)",noValue:"\u672A\u8BBE\u7F6E",copyHeader:"\u590D\u5236 Header",copyPayload:"\u590D\u5236 Payload",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236",required:"\u8BF7\u8F93\u5165 JWT",invalid:"JWT \u89E3\u6790\u5931\u8D25",decoded:"JWT \u5DF2\u89E3\u6790\uFF0C\u7B7E\u540D\u672A\u9A8C\u8BC1",expired:"JWT \u5DF2\u8FC7\u671F\uFF0C\u7B7E\u540D\u4ECD\u672A\u9A8C\u8BC1",pending:"JWT \u5C1A\u672A\u751F\u6548\uFF0C\u7B7E\u540D\u4ECD\u672A\u9A8C\u8BC1",noExpiry:"JWT \u5DF2\u89E3\u6790\u4E14\u672A\u8BBE\u7F6E\u8FC7\u671F\u65F6\u95F4\uFF0C\u7B7E\u540D\u672A\u9A8C\u8BC1"}:{input:"JWT String",placeholder:"Paste a three-segment JWT...",decode:"Decode",example:"Load Example",clear:"Clear",warning:"This tool only decodes token content. It does not verify the signature or establish trust.",header:"Header",payload:"Payload",claims:"Time Claims",issuedAt:"Issued at (iat)",notBefore:"Not before (nbf)",expiresAt:"Expires at (exp)",noValue:"Not set",copyHeader:"Copy Header",copyPayload:"Copy Payload",copied:"Copied",copyFailed:"Copy failed; please copy manually",required:"Enter a JWT",invalid:"JWT decoding failed",decoded:"JWT decoded; signature not verified",expired:"JWT is expired; signature not verified",pending:"JWT is not active yet; signature not verified",noExpiry:"JWT decoded with no expiration; signature not verified"};i.innerHTML=`
        <div class="tool-container tool-section-stack">
            <div class="tool-notice tool-notice--warning" role="note">${e.warning}</div>
            <div class="tool-field">
                <label class="tool-label" for="jwt-input">${e.input}</label>
                <textarea class="tool-input tool-code-input" id="jwt-input" rows="7" spellcheck="false" placeholder="${e.placeholder}"></textarea>
            </div>
            <div class="tool-actions">
                <button type="button" class="tool-btn tool-btn--primary" id="jwt-decode">${e.decode}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="jwt-example">${e.example}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="jwt-clear">${e.clear}</button>
            </div>
            <div class="tool-status" id="jwt-status" role="status" aria-live="polite"></div>
            <div class="tool-section-stack" id="jwt-output" hidden aria-hidden="true">
                <div class="tool-split">
                    <div class="tool-field">
                        <label class="tool-label" for="jwt-header">${e.header}</label>
                        <textarea class="tool-input tool-code-input" id="jwt-header" rows="8" readonly></textarea>
                        <button type="button" class="tool-btn tool-btn--copy" id="jwt-copy-header">${e.copyHeader}</button>
                    </div>
                    <div class="tool-field">
                        <label class="tool-label" for="jwt-payload">${e.payload}</label>
                        <textarea class="tool-input tool-code-input" id="jwt-payload" rows="8" readonly></textarea>
                        <button type="button" class="tool-btn tool-btn--copy" id="jwt-copy-payload">${e.copyPayload}</button>
                    </div>
                </div>
                <fieldset class="tool-fieldset">
                    <legend>${e.claims}</legend>
                    <dl class="tool-definition-grid">
                        <div><dt>${e.issuedAt}</dt><dd id="jwt-iat">${e.noValue}</dd></div>
                        <div><dt>${e.notBefore}</dt><dd id="jwt-nbf">${e.noValue}</dd></div>
                        <div><dt>${e.expiresAt}</dt><dd id="jwt-exp">${e.noValue}</dd></div>
                    </dl>
                </fieldset>
            </div>
        </div>
    `;let a=document.getElementById("jwt-input"),l=document.getElementById("jwt-header"),s=document.getElementById("jwt-payload"),n=document.getElementById("jwt-output"),d=document.getElementById("jwt-status"),o=window.CodeGlimpseToolUi;function r(t){if(t===null)return e.noValue;let p=new Date(t*1e3);return Number.isNaN(p.getTime())?String(t):`${p.toLocaleString()} (${t})`}function c(){if(!a.value.trim()){o.setStatus(d,"error",e.required);return}try{let t=window.CodeGlimpseJwt.decode(a.value);l.value=JSON.stringify(t.header,null,2),s.value=JSON.stringify(t.payload,null,2),document.getElementById("jwt-iat").textContent=r(t.claims.issuedAt),document.getElementById("jwt-nbf").textContent=r(t.claims.notBefore),document.getElementById("jwt-exp").textContent=r(t.claims.expiresAt),n.hidden=!1,n.setAttribute("aria-hidden","false"),t.status.expired?o.setStatus(d,"error",e.expired):t.status.notActive?o.setStatus(d,"info",e.pending):t.claims.expiresAt===null?o.setStatus(d,"info",e.noExpiry):o.setStatus(d,"success",e.decoded)}catch(t){n.hidden=!0,n.setAttribute("aria-hidden","true"),o.setStatus(d,"error",`${e.invalid}: ${t.message}`)}}function u(t){return btoa(JSON.stringify(t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}document.getElementById("jwt-decode").addEventListener("click",c),document.getElementById("jwt-example").addEventListener("click",()=>{a.value=`${u({alg:"none",typ:"JWT"})}.${u({sub:"123",name:"CodeGlimpse",iat:Math.floor(Date.now()/1e3)})}.`,c()}),document.getElementById("jwt-clear").addEventListener("click",()=>{a.value="",l.value="",s.value="",n.hidden=!0,n.setAttribute("aria-hidden","true"),o.setStatus(d,"",""),a.focus()}),document.getElementById("jwt-copy-header").addEventListener("click",t=>o.copy({button:t.currentTarget,value:l.value,status:d,messages:{empty:e.required,copied:e.copied,copyFailed:e.copyFailed}})),document.getElementById("jwt-copy-payload").addEventListener("click",t=>o.copy({button:t.currentTarget,value:s.value,status:d,messages:{empty:e.required,copied:e.copied,copyFailed:e.copyFailed}})),o.bindShortcut(a,c)})();})();
