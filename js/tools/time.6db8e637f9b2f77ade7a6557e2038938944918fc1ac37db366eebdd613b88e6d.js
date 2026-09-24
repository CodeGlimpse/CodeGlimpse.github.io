(()=>{(function(){let f=document.getElementById("tool-time");if(!f)return;let g=f.getAttribute("data-lang")||"en",h={"zh-cn":{titleCurrent:"\u5B9E\u65F6\u65F6\u95F4",labelTimeDisplay:"\u5F53\u524D\u65F6\u95F4",labelTimezone:"\u9009\u62E9\u65F6\u533A",labelLocalTimePrefix:"\u2B50 \u672C\u5730\u65F6\u95F4",labelTimestampSec:"\u79D2\u7EA7\u65F6\u95F4\u6233 (s)",labelTimestampMs:"\u6BEB\u79D2\u7EA7\u65F6\u95F4\u6233 (ms)",titleConverter:"\u65F6\u95F4\u6233\u8F6C\u6362\u5668",labelConvertTimestamp:"\u65F6\u95F4\u6233 (Timestamp)",labelConvertDateTime:"\u65E5\u671F\u65F6\u95F4 (Date Time)",labelConvertTimezone:"\u65F6\u533A (Timezone)",btnToDateTime:"\u8F6C\u6362 \u2794 \u65E5\u671F\u65F6\u95F4",btnToTimestamp:"\u8F6C\u6362 \u2794 \u65F6\u95F4\u6233",placeholderTimestamp:"\u8F93\u5165\u79D2\u6216\u6BEB\u79D2\u65F6\u95F4\u6233...",placeholderDateTime:"YYYY-MM-DD HH:mm:ss",errorInvalid:"\u65E0\u6548\u7684\u8F93\u5165\u683C\u5F0F",required:"\u8BF7\u8F93\u5165\u9700\u8981\u8F6C\u6362\u7684\u5185\u5BB9",converted:"\u8F6C\u6362\u5B8C\u6210",copyBtn:"\u590D\u5236",copied:"\u5DF2\u590D\u5236",copyFailed:"\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236"},en:{titleCurrent:"Real-time Time",labelTimeDisplay:"Current Time",labelTimezone:"Select Timezone",labelLocalTimePrefix:"\u2B50 Local Time",labelTimestampSec:"Timestamp (s)",labelTimestampMs:"Timestamp (ms)",titleConverter:"Timestamp Converter",labelConvertTimestamp:"Timestamp",labelConvertDateTime:"Date Time",labelConvertTimezone:"Timezone",btnToDateTime:"Convert \u2794 Date Time",btnToTimestamp:"Convert \u2794 Timestamp",placeholderTimestamp:"Enter seconds or milliseconds...",placeholderDateTime:"YYYY-MM-DD HH:mm:ss",errorInvalid:"Invalid input format",required:"Enter a value to convert",converted:"Conversion complete",copyBtn:"Copy",copied:"Copied",copyFailed:"Copy failed; please copy manually"}},e=h[g]||h.en;f.innerHTML=`
        <style>
            #tool-time .tool-container { max-width: 100%; }
            #tool-time .tool-section { margin-bottom: 2rem; padding: 1.5rem; border-radius: 12px; background: var(--card-background); border: 1px solid var(--border-color); }
            #tool-time h3 { margin-top: 0; margin-bottom: 1.2rem; font-size: 1.6rem; color: var(--accent-color); border-bottom: 2px solid var(--accent-color); display: inline-block; padding-bottom: 0.3rem; }
            #tool-time .time-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
            #tool-time .time-card { padding: 1rem; border-radius: 8px; background: var(--body-background); border: 1px solid var(--border-color); }
            #tool-time .time-label { font-size: 1.1rem; color: var(--card-text-color-secondary); margin-bottom: 0.4rem; font-weight: bold; }
            #tool-time .time-value-wrapper { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
            #tool-time .time-value { font-family: 'Fira Code', monospace; font-size: 1.4rem; color: var(--card-text-color-main); word-break: break-all; }
            #tool-time .converter-group { display: flex; flex-direction: column; gap: 1.2rem; }
            #tool-time .input-row { display: flex; align-items: flex-end; gap: 1rem; flex-wrap: wrap; }
            #tool-time .input-field { flex: 1; min-width: 250px; }
            #tool-time input {
                width: 100%;
                padding: 0.8rem 1rem;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-family: 'Fira Code', monospace;
                font-size: 1.3rem;
                outline: none;
                transition: border-color 0.2s;
            }
            #tool-time input:focus { border-color: var(--accent-color); }
            #tool-time .btn {
                padding: 0.8rem 1.5rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                background: var(--accent-color);
                color: #fff;
                transition: opacity 0.2s;
                white-space: nowrap;
                height: 3.8rem;
            }
            #tool-time .btn:hover { opacity: 0.9; }
            #tool-time .copy-btn {
                padding: 0.2rem 0.5rem;
                font-size: 1rem;
                background: var(--border-color);
                color: var(--card-text-color-main);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            #tool-time select {
                width: 100%;
                padding: 0.8rem 1rem;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-family: inherit;
                font-size: 1.3rem;
                outline: none;
                cursor: pointer;
            }
            #tool-time select:focus { border-color: var(--accent-color); }
            #tool-time .time-display-main { font-size: 2.4rem; font-weight: bold; color: var(--accent-color); margin-bottom: 1rem; text-align: center; }
            #tool-time .timezone-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
            #tool-time .timezone-row label { font-weight: bold; font-size: 1.2rem; white-space: nowrap; }
            #tool-time .converter-timezone { margin-bottom: 1rem; }
        </style>
        <div class="tool-container">
            <div class="tool-section">
                <h3>${e.titleCurrent}</h3>
                <div class="timezone-row">
                    <label for="current-timezone">${e.labelTimezone}:</label>
                    <select id="current-timezone"></select>
                </div>
                <div class="time-display-main" id="current-display" aria-label="${e.labelTimeDisplay}" aria-live="off">-</div>
                <div class="time-grid">
                    <div class="time-card">
                        <div class="time-label" id="current-sec-label">${e.labelTimestampSec}</div>
                        <div class="time-value-wrapper">
                            <div class="time-value" id="current-sec" aria-labelledby="current-sec-label">-</div>
                            <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="current-sec" aria-label="${e.copyBtn}: ${e.labelTimestampSec}">${e.copyBtn}</button>
                        </div>
                    </div>
                    <div class="time-card">
                        <div class="time-label" id="current-ms-label">${e.labelTimestampMs}</div>
                        <div class="time-value-wrapper">
                            <div class="time-value" id="current-ms" aria-labelledby="current-ms-label">-</div>
                            <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="current-ms" aria-label="${e.copyBtn}: ${e.labelTimestampMs}">${e.copyBtn}</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="tool-section">
                <h3>${e.titleConverter}</h3>
                <div class="converter-group">
                    <div class="input-field converter-timezone">
                        <label class="time-label" for="converter-timezone">${e.labelConvertTimezone}</label>
                        <select id="converter-timezone"></select>
                    </div>
                    <div class="input-row">
                        <div class="input-field">
                            <label class="time-label" for="input-ts">${e.labelConvertTimestamp}</label>
                            <input type="text" id="input-ts" placeholder="${e.placeholderTimestamp}">
                        </div>
                        <button type="button" class="btn tool-btn tool-btn--primary" id="btn-to-dt">${e.btnToDateTime}</button>
                    </div>
                    <div class="input-row">
                        <div class="input-field">
                            <label class="time-label" for="input-dt">${e.labelConvertDateTime}</label>
                            <input type="text" id="input-dt" placeholder="${e.placeholderDateTime}">
                        </div>
                        <button type="button" class="btn tool-btn tool-btn--primary" id="btn-to-ts">${e.btnToTimestamp}</button>
                    </div>
                    <div class="tool-status" id="time-status" role="status" aria-live="polite"></div>
                </div>
            </div>
        </div>
    `;let d=g.toLowerCase()==="zh-cn"?"zh-CN":g,E=(()=>{let t=new Date,n=window.CodeGlimpseTime.getTimezones(),o;try{o=new Intl.DisplayNames([d],{type:"timeZone"})}catch{o=null}let m=n.map(r=>{let b=new Intl.DateTimeFormat(d,{timeZone:r,timeZoneName:"longOffset"}).formatToParts(t).find(v=>v.type==="timeZoneName").value,a="";if(o&&(a=o.of(r)),!a||a===r)try{a=new Intl.DateTimeFormat(d,{timeZone:r,timeZoneName:"longGeneric"}).formatToParts(t).find(s=>s.type==="timeZoneName").value}catch{a=r.replace(/_/g," ")}return{label:`(${b}) ${a}`,value:r,offset:b,localizedName:a}}),k=new Set;return m.filter(r=>{let c=`${r.offset}-${r.localizedName}`;return k.has(c)?!1:(k.add(c),!0)}).sort((r,c)=>{let C=v=>{let s=v.match(/GMT([+-])(\d+):?(\d+)?/);return s?(s[1]==="+"?1:-1)*(parseInt(s[2])*60+(s[3]?parseInt(s[3]):0)):0},b=C(r.offset),a=C(c.offset);return b!==a?b-a:r.value.localeCompare(c.value)})})(),p=Intl.DateTimeFormat().resolvedOptions().timeZone,w=document.getElementById("current-timezone"),u=document.getElementById("converter-timezone"),x=t=>{let n=document.createElement("option");n.value=p;let o="";try{o=new Intl.DisplayNames([d],{type:"timeZone"}).of(p)}catch{}if(!o||o===p)try{o=new Intl.DateTimeFormat(d,{timeZone:p,timeZoneName:"longGeneric"}).formatToParts(new Date).find(m=>m.type==="timeZoneName").value}catch{o=p.replace(/_/g," ")}n.textContent=`${e.labelLocalTimePrefix} (${o})`,n.selected=!0,t.appendChild(n)};x(w),x(u),E.forEach(t=>{let n=document.createElement("option");n.value=t.value,n.textContent=t.label,w.appendChild(n);let o=document.createElement("option");o.value=t.value,o.textContent=t.label,u.appendChild(o)});let B=document.getElementById("current-display"),S=document.getElementById("current-sec"),L=document.getElementById("current-ms"),T=document.getElementById("input-ts"),y=document.getElementById("input-dt"),z=document.getElementById("btn-to-dt"),D=document.getElementById("btn-to-ts"),i=document.getElementById("time-status"),l=window.CodeGlimpseToolUi;function I(){let t=new Date,n=w.value;B.textContent=window.CodeGlimpseTime.formatDate(t,n),S.textContent=Math.floor(t.getTime()/1e3),L.textContent=t.getTime()}let $=new Date;T.value=Math.floor($.getTime()/1e3),y.value=window.CodeGlimpseTime.formatDate($,u.value),setInterval(I,1e3),I(),z.onclick=()=>{let t=T.value.trim();if(!t){l.setStatus(i,"error",e.required);return}try{let n=window.CodeGlimpseTime.parseTimestamp(t);y.value=window.CodeGlimpseTime.formatDate(n.date,u.value),l.setStatus(i,"success",e.converted)}catch{l.setStatus(i,"error",e.errorInvalid)}},D.onclick=()=>{let t=y.value.trim();if(!t){l.setStatus(i,"error",e.required);return}let n=u.value;try{T.value=window.CodeGlimpseTime.dateTimeToTimestamp(t,n),l.setStatus(i,"success",e.converted)}catch{l.setStatus(i,"error",e.errorInvalid)}},f.addEventListener("click",t=>{if(t.target.classList.contains("copy-btn")){let n=t.target.getAttribute("data-target"),o=document.getElementById(n),m="value"in o?o.value:o.textContent;l.copy({button:t.target,value:m,status:i,messages:{empty:e.required,copied:e.copied,copyFailed:e.copyFailed}})}}),T.addEventListener("keydown",t=>{t.key==="Enter"&&(t.preventDefault(),z.click())}),y.addEventListener("keydown",t=>{t.key==="Enter"&&(t.preventDefault(),D.click())})})();})();
