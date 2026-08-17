(function() {
    const container = document.getElementById('tool-time');
    if (!container) return;

    const lang = container.getAttribute('data-lang') || 'en';
    
    const i18n = {
        'zh-cn': {
            titleCurrent: '实时时间',
            labelTimeDisplay: '当前时间',
            labelTimezone: '选择时区',
            labelLocalTimePrefix: '⭐ 本地时间',
            labelTimestampSec: '秒级时间戳 (s)',
            labelTimestampMs: '毫秒级时间戳 (ms)',
            titleConverter: '时间戳转换器',
            labelConvertTimestamp: '时间戳 (Timestamp)',
            labelConvertDateTime: '日期时间 (Date Time)',
            labelConvertTimezone: '时区 (Timezone)',
            btnToDateTime: '转换 ➔ 日期时间',
            btnToTimestamp: '转换 ➔ 时间戳',
            placeholderTimestamp: '输入秒或毫秒时间戳...',
            placeholderDateTime: 'YYYY-MM-DD HH:mm:ss',
            errorInvalid: '无效的输入格式',
            required: '请输入需要转换的内容',
            converted: '转换完成',
            copyBtn: '复制',
            copied: '已复制',
            copyFailed: '复制失败，请手动复制'
        },
        'en': {
            titleCurrent: 'Real-time Time',
            labelTimeDisplay: 'Current Time',
            labelTimezone: 'Select Timezone',
            labelLocalTimePrefix: '⭐ Local Time',
            labelTimestampSec: 'Timestamp (s)',
            labelTimestampMs: 'Timestamp (ms)',
            titleConverter: 'Timestamp Converter',
            labelConvertTimestamp: 'Timestamp',
            labelConvertDateTime: 'Date Time',
            labelConvertTimezone: 'Timezone',
            btnToDateTime: 'Convert ➔ Date Time',
            btnToTimestamp: 'Convert ➔ Timestamp',
            placeholderTimestamp: 'Enter seconds or milliseconds...',
            placeholderDateTime: 'YYYY-MM-DD HH:mm:ss',
            errorInvalid: 'Invalid input format',
            required: 'Enter a value to convert',
            converted: 'Conversion complete',
            copyBtn: 'Copy',
            copied: 'Copied',
            copyFailed: 'Copy failed; please copy manually'
        }
    };

    const t = i18n[lang] || i18n['en'];

    container.innerHTML = `
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
                <h3>${t.titleCurrent}</h3>
                <div class="timezone-row">
                    <label for="current-timezone">${t.labelTimezone}:</label>
                    <select id="current-timezone"></select>
                </div>
                <div class="time-display-main" id="current-display" aria-label="${t.labelTimeDisplay}" aria-live="off">-</div>
                <div class="time-grid">
                    <div class="time-card">
                        <div class="time-label" id="current-sec-label">${t.labelTimestampSec}</div>
                        <div class="time-value-wrapper">
                            <div class="time-value" id="current-sec" aria-labelledby="current-sec-label">-</div>
                            <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="current-sec" aria-label="${t.copyBtn}: ${t.labelTimestampSec}">${t.copyBtn}</button>
                        </div>
                    </div>
                    <div class="time-card">
                        <div class="time-label" id="current-ms-label">${t.labelTimestampMs}</div>
                        <div class="time-value-wrapper">
                            <div class="time-value" id="current-ms" aria-labelledby="current-ms-label">-</div>
                            <button type="button" class="copy-btn tool-btn tool-btn--copy" data-target="current-ms" aria-label="${t.copyBtn}: ${t.labelTimestampMs}">${t.copyBtn}</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="tool-section">
                <h3>${t.titleConverter}</h3>
                <div class="converter-group">
                    <div class="input-field converter-timezone">
                        <label class="time-label" for="converter-timezone">${t.labelConvertTimezone}</label>
                        <select id="converter-timezone"></select>
                    </div>
                    <div class="input-row">
                        <div class="input-field">
                            <label class="time-label" for="input-ts">${t.labelConvertTimestamp}</label>
                            <input type="text" id="input-ts" placeholder="${t.placeholderTimestamp}">
                        </div>
                        <button type="button" class="btn tool-btn tool-btn--primary" id="btn-to-dt">${t.btnToDateTime}</button>
                    </div>
                    <div class="input-row">
                        <div class="input-field">
                            <label class="time-label" for="input-dt">${t.labelConvertDateTime}</label>
                            <input type="text" id="input-dt" placeholder="${t.placeholderDateTime}">
                        </div>
                        <button type="button" class="btn tool-btn tool-btn--primary" id="btn-to-ts">${t.btnToTimestamp}</button>
                    </div>
                    <div class="tool-status" id="time-status" role="status" aria-live="polite"></div>
                </div>
            </div>
        </div>
    `;

    const normalizedLang = lang.toLowerCase() === 'zh-cn' ? 'zh-CN' : lang;

    const getTimezones = () => {
        const now = new Date();
        const allTz = window.CodeGlimpseTime.getTimezones();
        
        let dn;
        try {
            dn = new Intl.DisplayNames([normalizedLang], { type: 'timeZone' });
        } catch (e) {
            dn = null;
        }

        const list = allTz.map(tz => {
            const dtf = new Intl.DateTimeFormat(normalizedLang, {
                timeZone: tz,
                timeZoneName: 'longOffset'
            });
            const parts = dtf.formatToParts(now);
            const offset = parts.find(p => p.type === 'timeZoneName').value;
            
            let localizedName = '';
            if (dn) {
                localizedName = dn.of(tz);
            }
            
            if (!localizedName || localizedName === tz) {
                try {
                    const nameParts = new Intl.DateTimeFormat(normalizedLang, {
                        timeZone: tz,
                        timeZoneName: 'longGeneric'
                    }).formatToParts(now);
                    localizedName = nameParts.find(p => p.type === 'timeZoneName').value;
                } catch (e) {
                    localizedName = tz.replace(/_/g, ' ');
                }
            }
            
            return {
                label: `(${offset}) ${localizedName}`,
                value: tz,
                offset: offset,
                localizedName: localizedName
            };
        });

        // Deduplicate: Group by (Offset + LocalizedName) to avoid repeating "Central European Time" many times
        const seen = new Set();
        const uniqueList = list.filter(item => {
            const key = `${item.offset}-${item.localizedName}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return uniqueList.sort((a, b) => {
            const extractOffset = (s) => {
                const m = s.match(/GMT([+-])(\d+):?(\d+)?/);
                if (!m) return 0;
                return (m[1] === '+' ? 1 : -1) * (parseInt(m[2]) * 60 + (m[3] ? parseInt(m[3]) : 0));
            };
            const offA = extractOffset(a.offset);
            const offB = extractOffset(b.offset);
            if (offA !== offB) return offA - offB;
            return a.value.localeCompare(b.value);
        });
    };

    const timezones = getTimezones();
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const currentTzSelect = document.getElementById('current-timezone');
    const converterTzSelect = document.getElementById('converter-timezone');
    
    const localOpt = (select) => {
        const opt = document.createElement('option');
        opt.value = localTz;
        let localTzName = '';
        try {
            localTzName = new Intl.DisplayNames([normalizedLang], { type: 'timeZone' }).of(localTz);
        } catch(e) {}
        
        if (!localTzName || localTzName === localTz) {
            try {
                localTzName = new Intl.DateTimeFormat(normalizedLang, {
                    timeZone: localTz,
                    timeZoneName: 'longGeneric'
                }).formatToParts(new Date()).find(p => p.type === 'timeZoneName').value;
            } catch(e) {
                localTzName = localTz.replace(/_/g, ' ');
            }
        }
        opt.textContent = `${t.labelLocalTimePrefix} (${localTzName})`;
        opt.selected = true;
        select.appendChild(opt);
    };

    localOpt(currentTzSelect);
    localOpt(converterTzSelect);

    timezones.forEach(tz => {
        const opt1 = document.createElement('option');
        opt1.value = tz.value;
        opt1.textContent = tz.label;
        currentTzSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = tz.value;
        opt2.textContent = tz.label;
        converterTzSelect.appendChild(opt2);
    });

    const currentDisplay = document.getElementById('current-display');
    const currentSec = document.getElementById('current-sec');
    const currentMs = document.getElementById('current-ms');
    
    const inputTs = document.getElementById('input-ts');
    const inputDt = document.getElementById('input-dt');
    const btnToDt = document.getElementById('btn-to-dt');
    const btnToTs = document.getElementById('btn-to-ts');
    const status = document.getElementById('time-status');
    const ui = window.CodeGlimpseToolUi;

    function updateCurrent() {
        const now = new Date();
        const tz = currentTzSelect.value;
        currentDisplay.textContent = window.CodeGlimpseTime.formatDate(now, tz);
        currentSec.textContent = Math.floor(now.getTime() / 1000);
        currentMs.textContent = now.getTime();
    }

    // Initialize inputs with current time
    const initDate = new Date();
    inputTs.value = Math.floor(initDate.getTime() / 1000);
    inputDt.value = window.CodeGlimpseTime.formatDate(initDate, converterTzSelect.value);

    setInterval(updateCurrent, 1000);
    updateCurrent();

    btnToDt.onclick = () => {
        let ts = inputTs.value.trim();
        if (!ts) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        try {
            const parsed = window.CodeGlimpseTime.parseTimestamp(ts);
            inputDt.value = window.CodeGlimpseTime.formatDate(parsed.date, converterTzSelect.value);
            ui.setStatus(status, 'success', t.converted);
        } catch (error) {
            ui.setStatus(status, 'error', t.errorInvalid);
        }
    };

    btnToTs.onclick = () => {
        let dtStr = inputDt.value.trim();
        if (!dtStr) {
            ui.setStatus(status, 'error', t.required);
            return;
        }
        
        const tz = converterTzSelect.value;
        try {
            inputTs.value = window.CodeGlimpseTime.dateTimeToTimestamp(dtStr, tz);
            ui.setStatus(status, 'success', t.converted);
        } catch (e) {
            ui.setStatus(status, 'error', t.errorInvalid);
        }
    };

    // Copy functionality
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn')) {
            const targetId = e.target.getAttribute('data-target');
            const target = document.getElementById(targetId);
            const text = 'value' in target ? target.value : target.textContent;
            ui.copy({
                button: e.target,
                value: text,
                status,
                messages: { empty: t.required, copied: t.copied, copyFailed: t.copyFailed }
            });
        }
    });

    inputTs.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            btnToDt.click();
        }
    });
    inputDt.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            btnToTs.click();
        }
    });
})();
