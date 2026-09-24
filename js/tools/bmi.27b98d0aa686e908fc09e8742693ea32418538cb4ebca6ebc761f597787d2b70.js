(()=>{(function(){let s=document.getElementById("tool-bmi");if(!s)return;let p=s.getAttribute("data-lang")||"zh-cn",g={"zh-cn":{labelHeight:"\u8EAB\u9AD8 (cm)",labelWeight:"\u4F53\u91CD (kg)",placeholderHeight:"\u4F8B\u5982: 175",placeholderWeight:"\u4F8B\u5982: 70",btnCalc:"\u5F00\u59CB\u8BA1\u7B97",btnClear:"\u6E05\u7A7A",errorInvalid:"\u8BF7\u8F93\u5165\u6709\u6548\u7684\u8EAB\u9AD8\u548C\u4F53\u91CD\u3002",statusUnderweight:"\u504F\u7626",statusNormal:"\u6B63\u5E38",statusOverweight:"\u8FC7\u91CD",statusObese:"\u80A5\u80D6",thresholds:{normal:24,overweight:28}},en:{labelHeight:"Height (cm)",labelWeight:"Weight (kg)",placeholderHeight:"e.g., 175",placeholderWeight:"e.g., 70",btnCalc:"Calculate",btnClear:"Clear",errorInvalid:"Enter a valid height and weight.",statusUnderweight:"Underweight",statusNormal:"Normal",statusOverweight:"Overweight",statusObese:"Obese",thresholds:{normal:25,overweight:30}}},e=g[p]||g.en;s.innerHTML=`
        <style>
            #tool-bmi .tool-container { display: flex; flex-direction: column; gap: 1rem; max-width: 400px; margin: 0 auto; }
            #tool-bmi .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
            #tool-bmi .input-group label { font-weight: bold; font-size: 1.8rem; color: var(--card-text-color-main); }
            #tool-bmi .input-group input {
                padding: 1.5rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-size: 1.2rem;
                outline: none;
                transition: border-color 0.2s;
            }
            #tool-bmi .input-group input:focus { border-color: var(--accent-color); }
            #tool-bmi .btn-calc {
                margin-top: 1rem;
                padding: 0.8rem;
                background: var(--accent-color);
                color: #fff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                font-size: 2rem;
                transition: opacity 0.2s;
            }
            #tool-bmi .btn-calc:hover { opacity: 0.9; }
            #tool-bmi .result-box {
                margin-top: 1rem;
                padding: 1.5rem;
                text-align: center;
                border-radius: 8px;
                background: var(--body-background);
                border: 1px dashed var(--border-color);
            }
            #tool-bmi .bmi-value { font-size: 2rem; font-weight: bold; display: block; color: var(--accent-color); }
            #tool-bmi .bmi-status {
                display: inline-block;
                margin-top: 0.8rem;
                padding: 0.3rem 1.2rem;
                border-radius: 20px;
                color: #fff;
                font-size: 1.5rem;
                font-weight: bold;
            }
            #tool-bmi #bmi-error { min-height: 1.5rem; color: #e74c3c; text-align: center; }
        </style>
        <div class="tool-container">
            <div class="input-group tool-field">
                <label class="tool-label" for="bmi-height">${e.labelHeight}</label>
                <input class="tool-input" type="number" id="bmi-height" min="50" max="300" step="0.1" inputmode="decimal" placeholder="${e.placeholderHeight}">
            </div>
            <div class="input-group tool-field">
                <label class="tool-label" for="bmi-weight">${e.labelWeight}</label>
                <input class="tool-input" type="number" id="bmi-weight" min="1" max="1000" step="0.1" inputmode="decimal" placeholder="${e.placeholderWeight}">
            </div>
            <div class="tool-actions">
                <button type="button" class="btn-calc tool-btn tool-btn--primary" id="bmi-calc">${e.btnCalc}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="bmi-clear">${e.btnClear}</button>
            </div>
            <div class="result-box" id="bmi-result" hidden aria-live="polite">
                <span class="bmi-value"></span>
                <span class="bmi-status"></span>
            </div>
            <div class="tool-status" id="bmi-error" role="status" aria-live="polite"></div>
        </div>
    `;let v=document.getElementById("bmi-calc"),t=document.getElementById("bmi-result"),c=t.querySelector(".bmi-value"),r=t.querySelector(".bmi-status"),d=document.getElementById("bmi-error"),n=document.getElementById("bmi-height"),b=document.getElementById("bmi-weight"),f=document.getElementById("bmi-clear"),u=window.CodeGlimpseToolUi;function h(){let m=n.value,a=b.value;try{let o=window.CodeGlimpseBmi.calculate(m,a).toFixed(1),i="",l="";o<18.5?(i=e.statusUnderweight,l="#3498db"):o<e.thresholds.normal?(i=e.statusNormal,l="#2ecc71"):o<e.thresholds.overweight?(i=e.statusOverweight,l="#f1c40f"):(i=e.statusObese,l="#e74c3c"),t.hidden=!1,c.innerText=`BMI: ${o}`,r.innerText=i,r.style.backgroundColor=l,u.setStatus(d,"","")}catch{t.hidden=!0,c.innerText="",r.innerText="",u.setStatus(d,"error",e.errorInvalid)}}v.addEventListener("click",h),[n,b].forEach(m=>{m.addEventListener("keydown",a=>{a.key==="Enter"&&(a.preventDefault(),h())})}),f.addEventListener("click",()=>{n.value="",b.value="",t.hidden=!0,c.innerText="",r.innerText="",u.setStatus(d,"",""),n.focus()})})();})();
