(() => {
  // <stdin>
  (function() {
    const container = document.getElementById("tool-bmi");
    if (!container) return;
    const lang = container.getAttribute("data-lang") || "zh-cn";
    const i18n = {
      "zh-cn": {
        labelHeight: "\u8EAB\u9AD8 (cm)",
        labelWeight: "\u4F53\u91CD (kg)",
        placeholderHeight: "\u4F8B\u5982: 175",
        placeholderWeight: "\u4F8B\u5982: 70",
        btnCalc: "\u5F00\u59CB\u8BA1\u7B97",
        statusUnderweight: "\u504F\u7626",
        statusNormal: "\u6B63\u5E38",
        statusOverweight: "\u8FC7\u91CD",
        statusObese: "\u80A5\u80D6",
        thresholds: { normal: 24, overweight: 28 }
      },
      "en": {
        labelHeight: "Height (cm)",
        labelWeight: "Weight (kg)",
        placeholderHeight: "e.g., 175",
        placeholderWeight: "e.g., 70",
        btnCalc: "Calculate",
        statusUnderweight: "Underweight",
        statusNormal: "Normal",
        statusOverweight: "Overweight",
        statusObese: "Obese",
        thresholds: { normal: 25, overweight: 30 }
      }
    };
    const t = i18n[lang] || i18n["en"];
    container.innerHTML = `
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
        </style>
        <div class="tool-container">
            <div class="input-group">
                <label>${t.labelHeight}</label>
                <input type="number" id="bmi-height" placeholder="${t.placeholderHeight}">
            </div>
            <div class="input-group">
                <label>${t.labelWeight}</label>
                <input type="number" id="bmi-weight" placeholder="${t.placeholderWeight}">
            </div>
            <button class="btn-calc" id="bmi-calc">${t.btnCalc}</button>
            <div class="result-box" id="bmi-result" style="display: none;">
                <span class="bmi-value"></span>
                <span class="bmi-status"></span>
            </div>
        </div>
    `;
    const btn = document.getElementById("bmi-calc");
    const resBox = document.getElementById("bmi-result");
    const valSpan = resBox.querySelector(".bmi-value");
    const statSpan = resBox.querySelector(".bmi-status");
    btn.onclick = () => {
      const h = parseFloat(document.getElementById("bmi-height").value) / 100;
      const w = parseFloat(document.getElementById("bmi-weight").value);
      if (h > 0 && w > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        let status = "";
        let color = "";
        if (bmi < 18.5) {
          status = t.statusUnderweight;
          color = "#3498db";
        } else if (bmi < t.thresholds.normal) {
          status = t.statusNormal;
          color = "#2ecc71";
        } else if (bmi < t.thresholds.overweight) {
          status = t.statusOverweight;
          color = "#f1c40f";
        } else {
          status = t.statusObese;
          color = "#e74c3c";
        }
        resBox.style.display = "block";
        valSpan.innerText = `BMI: ${bmi}`;
        statSpan.innerText = status;
        statSpan.style.backgroundColor = color;
      }
    };
  })();
})();
