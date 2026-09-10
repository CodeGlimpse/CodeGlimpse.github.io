(()=>{(function(){let D=document.getElementById("tool-md5");if(!D)return;let te=D.getAttribute("data-lang")||"zh-cn",J={"zh-cn":{labelInput:"\u8F93\u5165\u5185\u5BB9",labelOutput:"MD5 \u54C8\u5E0C\u503C",placeholderInput:"\u5728\u6B64\u8F93\u5165\u9700\u8981\u52A0\u5BC6\u7684\u6587\u672C...",btnHash:"\u751F\u6210 (Generate)",btnClear:"\u6E05\u7A7A\u5185\u5BB9",copyBtn:"\u590D\u5236\u7ED3\u679C",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236",required:"\u8BF7\u8F93\u5165\u9700\u8981\u5904\u7406\u7684\u5185\u5BB9",generated:"MD5 \u5DF2\u751F\u6210",caseLabel:"\u8F93\u51FA\u683C\u5F0F",caseLower:"\u5C0F\u5199",caseUpper:"\u5927\u5199"},en:{labelInput:"Input Content",labelOutput:"MD5 Hash",placeholderInput:"Enter text to hash...",btnHash:"Generate",btnClear:"Clear",copyBtn:"Copy Result",copied:"Copied",copyFailed:"Copy failed; please copy manually",required:"Enter content to process",generated:"MD5 generated",caseLabel:"Output Case",caseLower:"Lowercase",caseUpper:"Uppercase"}},x=J[te]||J.en;function ce(v){function h(d,l){return d<<l|d>>>32-l}function s(d,l){var u,i,p,m,c;return p=d&2147483648,m=l&2147483648,u=d&1073741824,i=l&1073741824,c=(d&1073741823)+(l&1073741823),u&i?c^2147483648^p^m:u|i?c&1073741824?c^3221225472^p^m:c^1073741824^p^m:c^p^m}function K(d,l,u){return d&l|~d&u}function ne(d,l,u){return d&u|l&~u}function le(d,l,u){return d^l^u}function de(d,l,u){return l^(d|~u)}function b(d,l,u,i,p,m,c){return d=s(d,s(s(K(l,u,i),p),c)),s(h(d,m),l)}function f(d,l,u,i,p,m,c){return d=s(d,s(s(ne(l,u,i),p),c)),s(h(d,m),l)}function F(d,l,u,i,p,m,c){return d=s(d,s(s(le(l,u,i),p),c)),s(h(d,m),l)}function g(d,l,u,i,p,m,c){return d=s(d,s(s(de(l,u,i),p),c)),s(h(d,m),l)}function ue(d){for(var l,u=d.length,i=u+8,p=(i-i%64)/64,m=(p+1)*16,c=Array(m-1),Y=0,y=0;y<u;)l=(y-y%4)/4,Y=y%4*8,c[l]=c[l]|d.charCodeAt(y)<<Y,y++;return l=(y-y%4)/4,Y=y%4*8,c[l]=c[l]|128<<Y,c[m-2]=u<<3,c[m-1]=u>>>29,c}function k(d){var l="",u="",i,p;for(p=0;p<=3;p++)i=d>>>p*8&255,u="0"+i.toString(16),l=l+u.substr(u.length-2,2);return l}function ie(d){d=d.replace(/\r\n/g,`
`);for(var l="",u=0;u<d.length;u++){var i=d.charCodeAt(u);i<128?l+=String.fromCharCode(i):i>127&&i<2048?(l+=String.fromCharCode(i>>6|192),l+=String.fromCharCode(i&63|128)):(l+=String.fromCharCode(i>>12|224),l+=String.fromCharCode(i>>6&63|128),l+=String.fromCharCode(i&63|128))}return l}var n=Array(),a,Q,X,Z,ee,e,t,o,r,L=7,H=12,$=17,O=22,G=5,U=9,z=14,W=20,M=4,T=11,q=16,N=23,R=6,_=10,P=15,V=21;for(v=ie(v),n=ue(v),e=1732584193,t=4023233417,o=2562383102,r=271733878,a=0;a<n.length;a+=16)Q=e,X=t,Z=o,ee=r,e=b(e,t,o,r,n[a+0],L,3614090360),r=b(r,e,t,o,n[a+1],H,3905402710),o=b(o,r,e,t,n[a+2],$,606105819),t=b(t,o,r,e,n[a+3],O,3250441966),e=b(e,t,o,r,n[a+4],L,4118548399),r=b(r,e,t,o,n[a+5],H,1200080426),o=b(o,r,e,t,n[a+6],$,2821735955),t=b(t,o,r,e,n[a+7],O,4249261313),e=b(e,t,o,r,n[a+8],L,1770035416),r=b(r,e,t,o,n[a+9],H,2336552879),o=b(o,r,e,t,n[a+10],$,4294925233),t=b(t,o,r,e,n[a+11],O,2304563134),e=b(e,t,o,r,n[a+12],L,1804603682),r=b(r,e,t,o,n[a+13],H,4254626195),o=b(o,r,e,t,n[a+14],$,2792965006),t=b(t,o,r,e,n[a+15],O,1236535329),e=f(e,t,o,r,n[a+1],G,4129170786),r=f(r,e,t,o,n[a+6],U,3225465664),o=f(o,r,e,t,n[a+11],z,643717713),t=f(t,o,r,e,n[a+0],W,3921069994),e=f(e,t,o,r,n[a+5],G,3593408605),r=f(r,e,t,o,n[a+10],U,38016083),o=f(o,r,e,t,n[a+15],z,3634488961),t=f(t,o,r,e,n[a+4],W,3889429448),e=f(e,t,o,r,n[a+9],G,568446438),r=f(r,e,t,o,n[a+14],U,3275163606),o=f(o,r,e,t,n[a+3],z,4107603335),t=f(t,o,r,e,n[a+8],W,1163531501),e=f(e,t,o,r,n[a+13],G,2850285829),r=f(r,e,t,o,n[a+2],U,4243563512),o=f(o,r,e,t,n[a+7],z,1735328473),t=f(t,o,r,e,n[a+12],W,2368359562),e=F(e,t,o,r,n[a+5],M,4294588738),r=F(r,e,t,o,n[a+8],T,2272392833),o=F(o,r,e,t,n[a+11],q,1839030562),t=F(t,o,r,e,n[a+14],N,4259657740),e=F(e,t,o,r,n[a+1],M,2763975236),r=F(r,e,t,o,n[a+4],T,1272893353),o=F(o,r,e,t,n[a+7],q,4139469664),t=F(t,o,r,e,n[a+10],N,3200236656),e=F(e,t,o,r,n[a+13],M,681279174),r=F(r,e,t,o,n[a+0],T,3936430074),o=F(o,r,e,t,n[a+3],q,3572445317),t=F(t,o,r,e,n[a+6],N,76029189),e=F(e,t,o,r,n[a+9],M,3654602809),r=F(r,e,t,o,n[a+12],T,3873151461),o=F(o,r,e,t,n[a+15],q,530742520),t=F(t,o,r,e,n[a+2],N,3299628645),e=g(e,t,o,r,n[a+0],R,4096336452),r=g(r,e,t,o,n[a+7],_,1126891415),o=g(o,r,e,t,n[a+14],P,2878612391),t=g(t,o,r,e,n[a+5],V,4237533241),e=g(e,t,o,r,n[a+12],R,1700485571),r=g(r,e,t,o,n[a+3],_,2399980690),o=g(o,r,e,t,n[a+10],P,4293915773),t=g(t,o,r,e,n[a+1],V,2240044497),e=g(e,t,o,r,n[a+8],R,1873313359),r=g(r,e,t,o,n[a+15],_,4264355552),o=g(o,r,e,t,n[a+6],P,2734768916),t=g(t,o,r,e,n[a+13],V,1309151649),e=g(e,t,o,r,n[a+4],R,4149444226),r=g(r,e,t,o,n[a+11],_,3174756917),o=g(o,r,e,t,n[a+2],P,718787259),t=g(t,o,r,e,n[a+9],V,3951481745),e=s(e,Q),t=s(t,X),o=s(o,Z),r=s(r,ee);var se=k(e)+k(t)+k(o)+k(r);return se.toLowerCase()}D.innerHTML=`
        <style>
            #tool-md5 .tool-container { max-width: 100%; }
            #tool-md5 .input-group { margin-bottom: 1.5rem; }
            #tool-md5 label { font-weight: bold; font-size: 1.8rem; color: var(--card-text-color-main); display: block; margin-bottom: 0.5rem; }
            #tool-md5 textarea {
                width: 100%;
                padding: 1.2rem;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-family: 'Fira Code', monospace;
                font-size: 1.4rem;
                line-height: 1.6;
                resize: vertical;
                outline: none;
                transition: border-color 0.2s;
            }
            #tool-md5 textarea:focus { border-color: var(--accent-color); }
            #tool-md5 .button-group { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; margin: 1.5rem 0 2rem 0; }
            #tool-md5 .btn {
                padding: 1rem 2rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 1.4rem;
                transition: all 0.2s;
            }
            #tool-md5 .btn-primary { background: var(--accent-color); color: #fff; }
            #tool-md5 .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
            #tool-md5 .btn-secondary { background: var(--body-background); border: 1px solid var(--border-color); color: var(--card-text-color-main); }
            #tool-md5 .btn-secondary:hover { border-color: var(--accent-color); color: var(--accent-color); }
            
            #tool-md5 .options-group { display: flex; gap: 1rem; align-items: center; font-size: 1.4rem; color: var(--card-text-color-main); }
            #tool-md5 .options-group label { display: inline; font-size: 1.4rem; margin-right: 0.5rem; font-weight: normal; }
            
            #tool-md5 .result-group { position: relative; margin-top: 2rem; }
            #tool-md5 .btn-copy {
                position: absolute;
                right: 1rem;
                top: 3.5rem;
                padding: 0.4rem 1rem;
                font-size: 1.2rem;
                background: var(--accent-color);
                color: #fff;
                border-radius: 4px;
                border: none;
                cursor: pointer;
            }
        </style>
        <div class="tool-container tool-text-tool" data-output-state="empty">
            <div class="input-group tool-field tool-input-panel">
                <label class="tool-label" for="md5-input">${x.labelInput}</label>
                <textarea id="md5-input" rows="8" placeholder="${x.placeholderInput}"></textarea>
            </div>
            <div class="button-group tool-actions tool-action-panel">
                <button type="button" class="btn btn-primary tool-btn tool-btn--primary" id="md5-generate">${x.btnHash}</button>
                <button type="button" class="btn btn-secondary tool-btn tool-btn--secondary" id="md5-clear">${x.btnClear}</button>
                <div class="options-group" role="group" aria-label="${x.caseLabel}">
                    <span>${x.caseLabel}:</span>
                    <input type="radio" id="case-lower" name="md5-case" value="lower" checked>
                    <label for="case-lower">${x.caseLower}</label>
                    <input type="radio" id="case-upper" name="md5-case" value="upper">
                    <label for="case-upper">${x.caseUpper}</label>
                </div>
            </div>
            <div class="tool-status" id="md5-status" role="status" aria-live="polite"></div>
            <div class="input-group result-group tool-field tool-output-panel" id="md5-result-group" hidden aria-hidden="true">
                <label class="tool-label" for="md5-output">${x.labelOutput}</label>
                <textarea id="md5-output" rows="2" readonly></textarea>
                <button type="button" class="btn-copy tool-btn tool-btn--copy" id="md5-copy" aria-label="${x.copyBtn}" disabled>${x.copyBtn}</button>
            </div>
        </div>
    `;let A=document.getElementById("md5-input"),S=document.getElementById("md5-output"),E=document.getElementById("md5-result-group"),oe=document.getElementById("md5-generate"),re=document.getElementById("md5-clear"),B=document.getElementById("md5-copy"),ae=document.getElementsByName("md5-case"),w=document.getElementById("md5-status"),j=D.querySelector(".tool-text-tool"),C=window.CodeGlimpseToolUi,I=(v=!1)=>{let h=A.value;if(!h){S.value="",E.hidden=!0,E.setAttribute("aria-hidden","true"),B.disabled=!0,C.setOutputState(j,"empty"),v&&C.setStatus(w,"error",x.required);return}let s=window.CodeGlimpseMd5.hash(h);document.getElementById("case-upper").checked&&(s=s.toUpperCase()),S.value=s,E.hidden=!1,E.setAttribute("aria-hidden","false"),B.disabled=!1,C.setOutputState(j,"ready"),v&&C.setStatus(w,"success",x.generated)};oe.onclick=()=>I(!0),A.oninput=()=>I(!1),ae.forEach(v=>{v.onchange=()=>I(!1)}),re.onclick=()=>{A.value="",S.value="",E.hidden=!0,E.setAttribute("aria-hidden","true"),B.disabled=!0,C.setOutputState(j,"empty"),C.setStatus(w,"",""),A.focus()},B.onclick=()=>{C.copy({button:B,value:S.value,status:w,messages:{empty:x.required,copied:x.copied,copyFailed:x.copyFailed}})},C.bindShortcut(A,()=>I(!0))})();})();
