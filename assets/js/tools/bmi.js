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
            statusUnderweight: 'Underweight',
            statusNormal: 'Normal',
            statusOverweight: 'Overweight',
            statusObese: 'Obese',
            thresholds: { normal: 25, overweight: 30 }
        }
    };

    const t = i18n[lang] || i18n['en'];

    container.innerHTML = `
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

    const btn = document.getElementById('bmi-calc');
    const resBox = document.getElementById('bmi-result');
    const valSpan = resBox.querySelector('.bmi-value');
    const statSpan = resBox.querySelector('.bmi-status');

    btn.onclick = () => {
        const h = parseFloat(document.getElementById('bmi-height').value) / 100;
        const w = parseFloat(document.getElementById('bmi-weight').value);

        if (h > 0 && w > 0) {
            const bmi = (w / (h * h)).toFixed(1);
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

            resBox.style.display = 'block';
            valSpan.innerText = `BMI: ${bmi}`;
            statSpan.innerText = status;
            statSpan.style.backgroundColor = color;
        }
    };
})();
