(function() {
    const container = document.getElementById('tool-bmi');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'zh-cn';
    
    const i18n = {
        'zh-cn': {
            labelHeight: '身高 (cm)',
            labelWeight: '体重 (kg)',
            placeholderHeight: '例如: 175',
            placeholderWeight: '例如: 70',
            btnCalc: '开始计算',
            btnClear: '清空',
            errorInvalid: '请输入有效的身高和体重。',
            statusUnderweight: '偏瘦',
            statusNormal: '正常',
            statusOverweight: '过重',
            statusObese: '肥胖',
            thresholds: { normal: 24, overweight: 28 }
        },
        'en': {
            labelHeight: 'Height (cm)',
            labelWeight: 'Weight (kg)',
            placeholderHeight: 'e.g., 175',
            placeholderWeight: 'e.g., 70',
            btnCalc: 'Calculate',
            btnClear: 'Clear',
            errorInvalid: 'Enter a valid height and weight.',
            statusUnderweight: 'Underweight',
            statusNormal: 'Normal',
            statusOverweight: 'Overweight',
            statusObese: 'Obese',
            thresholds: { normal: 25, overweight: 30 }
        }
    };

    const t = i18n[lang] || i18n['en'];

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
            #tool-bmi #bmi-error { min-height: 1.5rem; color: #e74c3c; text-align: center; }
        </style>
        <div class="tool-container">
            <div class="input-group tool-field">
                <label class="tool-label" for="bmi-height">${t.labelHeight}</label>
                <input class="tool-input" type="number" id="bmi-height" min="50" max="300" step="0.1" inputmode="decimal" placeholder="${t.placeholderHeight}">
            </div>
            <div class="input-group tool-field">
                <label class="tool-label" for="bmi-weight">${t.labelWeight}</label>
                <input class="tool-input" type="number" id="bmi-weight" min="1" max="1000" step="0.1" inputmode="decimal" placeholder="${t.placeholderWeight}">
            </div>
            <div class="tool-actions">
                <button type="button" class="btn-calc tool-btn tool-btn--primary" id="bmi-calc">${t.btnCalc}</button>
                <button type="button" class="tool-btn tool-btn--secondary" id="bmi-clear">${t.btnClear}</button>
            </div>
            <div class="result-box" id="bmi-result" hidden aria-live="polite">
                <span class="bmi-value"></span>
                <span class="bmi-status"></span>
            </div>
            <div class="tool-status" id="bmi-error" role="status" aria-live="polite"></div>
        </div>
    `;

    const btn = document.getElementById('bmi-calc');
    const resBox = document.getElementById('bmi-result');
    const valSpan = resBox.querySelector('.bmi-value');
    const statSpan = resBox.querySelector('.bmi-status');
    const errorSpan = document.getElementById('bmi-error');
    const heightInput = document.getElementById('bmi-height');
    const weightInput = document.getElementById('bmi-weight');
    const clearButton = document.getElementById('bmi-clear');
    const ui = window.CodeGlimpseToolUi;

    function calculate() {
        const height = heightInput.value;
        const weight = weightInput.value;

        try {
            const bmi = window.CodeGlimpseBmi.calculate(height, weight).toFixed(1);
            let status = '';
            let color = '';

            // BMI 判定标准 (根据语言切换中国标准/国际标准)
            if (bmi < 18.5) { 
                status = t.statusUnderweight; color = '#3498db'; 
            } else if (bmi < t.thresholds.normal) { 
                status = t.statusNormal; color = '#2ecc71'; 
            } else if (bmi < t.thresholds.overweight) { 
                status = t.statusOverweight; color = '#f1c40f'; 
            } else { 
                status = t.statusObese; color = '#e74c3c'; 
            }

            resBox.hidden = false;
            valSpan.innerText = `BMI: ${bmi}`;
            statSpan.innerText = status;
            statSpan.style.backgroundColor = color;
            ui.setStatus(errorSpan, '', '');
        } catch (error) {
            resBox.hidden = true;
            valSpan.innerText = '';
            statSpan.innerText = '';
            ui.setStatus(errorSpan, 'error', t.errorInvalid);
        }
    }

    btn.addEventListener('click', calculate);
    [heightInput, weightInput].forEach(input => {
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                calculate();
            }
        });
    });

    clearButton.addEventListener('click', () => {
        heightInput.value = '';
        weightInput.value = '';
        resBox.hidden = true;
        valSpan.innerText = '';
        statSpan.innerText = '';
        ui.setStatus(errorSpan, '', '');
        heightInput.focus();
    });
})();
