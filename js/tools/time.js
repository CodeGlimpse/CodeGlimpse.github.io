(() => {
  // <stdin>
  (function() {
    const container = document.getElementById("tool-time");
    if (!container) return;
    const lang = container.getAttribute("data-lang") || "en";
    const i18n = {
      "zh-cn": {
        titleCurrent: "\u5B9E\u65F6\u65F6\u95F4",
        labelTimeDisplay: "\u5F53\u524D\u65F6\u95F4",
        labelTimezone: "\u9009\u62E9\u65F6\u533A",
        labelLocalTimePrefix: "\u2B50 \u672C\u5730\u65F6\u95F4",
        labelTimestampSec: "\u79D2\u7EA7\u65F6\u95F4\u6233 (s)",
        labelTimestampMs: "\u6BEB\u79D2\u7EA7\u65F6\u95F4\u6233 (ms)",
        titleConverter: "\u65F6\u95F4\u6233\u8F6C\u6362\u5668",
        labelConvertTimestamp: "\u65F6\u95F4\u6233 (Timestamp)",
        labelConvertDateTime: "\u65E5\u671F\u65F6\u95F4 (Date Time)",
        labelConvertTimezone: "\u65F6\u533A (Timezone)",
        btnToDateTime: "\u8F6C\u6362 \u2794 \u65E5\u671F\u65F6\u95F4",
        btnToTimestamp: "\u8F6C\u6362 \u2794 \u65F6\u95F4\u6233",
        placeholderTimestamp: "\u8F93\u5165\u79D2\u6216\u6BEB\u79D2\u65F6\u95F4\u6233...",
        placeholderDateTime: "YYYY-MM-DD HH:mm:ss",
        errorInvalid: "\u65E0\u6548\u7684\u8F93\u5165\u683C\u5F0F",
        copyBtn: "\u590D\u5236",
        copied: "\u5DF2\u590D\u5236"
      },
      "en": {
        titleCurrent: "Real-time Time",
        labelTimeDisplay: "Current Time",
        labelTimezone: "Select Timezone",
        labelLocalTimePrefix: "\u2B50 Local Time",
        labelTimestampSec: "Timestamp (s)",
        labelTimestampMs: "Timestamp (ms)",
        titleConverter: "Timestamp Converter",
        labelConvertTimestamp: "Timestamp",
        labelConvertDateTime: "Date Time",
        labelConvertTimezone: "Timezone",
        btnToDateTime: "Convert \u2794 Date Time",
        btnToTimestamp: "Convert \u2794 Timestamp",
        placeholderTimestamp: "Enter seconds or milliseconds...",
        placeholderDateTime: "YYYY-MM-DD HH:mm:ss",
        errorInvalid: "Invalid input format",
        copyBtn: "Copy",
        copied: "Copied"
      }
    };
    const t = i18n[lang] || i18n["en"];
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
                    <label>${t.labelTimezone}:</label>
                    <select id="current-timezone"></select>
                </div>
                <div class="time-display-main" id="current-display">-</div>
                <div class="time-grid">
                    <div class="time-card">
                        <div class="time-label">${t.labelTimestampSec}</div>
                        <div class="time-value-wrapper">
                            <div class="time-value" id="current-sec">-</div>
                            <button class="copy-btn" data-target="current-sec">${t.copyBtn}</button>
                        </div>
                    </div>
                    <div class="time-card">
                        <div class="time-label">${t.labelTimestampMs}</div>
                        <div class="time-value-wrapper">
                            <div class="time-value" id="current-ms">-</div>
                            <button class="copy-btn" data-target="current-ms">${t.copyBtn}</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="tool-section">
                <h3>${t.titleConverter}</h3>
                <div class="converter-group">
                    <div class="input-field converter-timezone">
                        <div class="time-label">${t.labelConvertTimezone}</div>
                        <select id="converter-timezone"></select>
                    </div>
                    <div class="input-row">
                        <div class="input-field">
                            <div class="time-label">${t.labelConvertTimestamp}</div>
                            <input type="text" id="input-ts" placeholder="${t.placeholderTimestamp}">
                        </div>
                        <button class="btn" id="btn-to-dt">${t.btnToDateTime}</button>
                    </div>
                    <div class="input-row">
                        <div class="input-field">
                            <div class="time-label">${t.labelConvertDateTime}</div>
                            <input type="text" id="input-dt" placeholder="${t.placeholderDateTime}">
                        </div>
                        <button class="btn" id="btn-to-ts">${t.btnToTimestamp}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    const normalizedLang = lang.toLowerCase() === "zh-cn" ? "zh-CN" : lang;
    const getTimezones = () => {
      const now = /* @__PURE__ */ new Date();
      const allTz = Intl.supportedValuesOf("timeZone");
      let dn;
      try {
        dn = new Intl.DisplayNames([normalizedLang], { type: "timeZone" });
      } catch (e) {
        dn = null;
      }
      const list = allTz.map((tz) => {
        const dtf = new Intl.DateTimeFormat(normalizedLang, {
          timeZone: tz,
          timeZoneName: "longOffset"
        });
        const parts = dtf.formatToParts(now);
        const offset = parts.find((p) => p.type === "timeZoneName").value;
        let localizedName = "";
        if (dn) {
          localizedName = dn.of(tz);
        }
        if (!localizedName || localizedName === tz) {
          try {
            const nameParts = new Intl.DateTimeFormat(normalizedLang, {
              timeZone: tz,
              timeZoneName: "longGeneric"
            }).formatToParts(now);
            localizedName = nameParts.find((p) => p.type === "timeZoneName").value;
          } catch (e) {
            localizedName = tz.replace(/_/g, " ");
          }
        }
        return {
          label: `(${offset}) ${localizedName}`,
          value: tz,
          offset,
          localizedName
        };
      });
      const seen = /* @__PURE__ */ new Set();
      const uniqueList = list.filter((item) => {
        const key = `${item.offset}-${item.localizedName}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return uniqueList.sort((a, b) => {
        const extractOffset = (s) => {
          const m = s.match(/GMT([+-])(\d+):?(\d+)?/);
          if (!m) return 0;
          return (m[1] === "+" ? 1 : -1) * (parseInt(m[2]) * 60 + (m[3] ? parseInt(m[3]) : 0));
        };
        const offA = extractOffset(a.offset);
        const offB = extractOffset(b.offset);
        if (offA !== offB) return offA - offB;
        return a.value.localeCompare(b.value);
      });
    };
    const timezones = getTimezones();
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentTzSelect = document.getElementById("current-timezone");
    const converterTzSelect = document.getElementById("converter-timezone");
    const localOpt = (select) => {
      const opt = document.createElement("option");
      opt.value = localTz;
      let localTzName = "";
      try {
        localTzName = new Intl.DisplayNames([normalizedLang], { type: "timeZone" }).of(localTz);
      } catch (e) {
      }
      if (!localTzName || localTzName === localTz) {
        try {
          localTzName = new Intl.DateTimeFormat(normalizedLang, {
            timeZone: localTz,
            timeZoneName: "longGeneric"
          }).formatToParts(/* @__PURE__ */ new Date()).find((p) => p.type === "timeZoneName").value;
        } catch (e) {
          localTzName = localTz.replace(/_/g, " ");
        }
      }
      opt.textContent = `${t.labelLocalTimePrefix} (${localTzName})`;
      opt.selected = true;
      select.appendChild(opt);
    };
    localOpt(currentTzSelect);
    localOpt(converterTzSelect);
    timezones.forEach((tz) => {
      const opt1 = document.createElement("option");
      opt1.value = tz.value;
      opt1.textContent = tz.label;
      currentTzSelect.appendChild(opt1);
      const opt2 = document.createElement("option");
      opt2.value = tz.value;
      opt2.textContent = tz.label;
      converterTzSelect.appendChild(opt2);
    });
    const currentDisplay = document.getElementById("current-display");
    const currentSec = document.getElementById("current-sec");
    const currentMs = document.getElementById("current-ms");
    const inputTs = document.getElementById("input-ts");
    const inputDt = document.getElementById("input-dt");
    const btnToDt = document.getElementById("btn-to-dt");
    const btnToTs = document.getElementById("btn-to-ts");
    function formatDate(date, tz) {
      return new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: tz
      }).format(date).replace(/(\d+)\/(\d+)\/(\d+),?/, "$3-$2-$1");
    }
    function updateCurrent() {
      const now = /* @__PURE__ */ new Date();
      const tz = currentTzSelect.value;
      currentDisplay.textContent = formatDate(now, tz);
      currentSec.textContent = Math.floor(now.getTime() / 1e3);
      currentMs.textContent = now.getTime();
    }
    const initDate = /* @__PURE__ */ new Date();
    inputTs.value = Math.floor(initDate.getTime() / 1e3);
    inputDt.value = formatDate(initDate, converterTzSelect.value);
    setInterval(updateCurrent, 1e3);
    updateCurrent();
    btnToDt.onclick = () => {
      let ts = inputTs.value.trim();
      if (!ts) return;
      let val = parseInt(ts);
      if (isNaN(val)) {
        alert(t.errorInvalid);
        return;
      }
      if (ts.length <= 11) val *= 1e3;
      inputDt.value = formatDate(new Date(val), converterTzSelect.value);
    };
    btnToTs.onclick = () => {
      let dtStr = inputDt.value.trim();
      if (!dtStr) return;
      const tz = converterTzSelect.value;
      try {
        const parts = dtStr.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
        if (!parts) throw new Error();
        const [_, y, m, d, h, min, s] = parts.map(Number);
        const isoStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        const date = new Date(isoStr);
        const getOffset = (date2, tz2) => {
          const parts2 = new Intl.DateTimeFormat("en-US", {
            timeZone: tz2,
            timeZoneName: "longOffset"
          }).formatToParts(date2);
          const offsetName = parts2.find((p) => p.type === "timeZoneName").value;
          const match = offsetName.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
          if (!match) return 0;
          const [__, sign, hours, minutes] = match;
          const totalMinutes = parseInt(hours) * 60 + (minutes ? parseInt(minutes) : 0);
          return (sign === "+" ? 1 : -1) * totalMinutes;
        };
        const targetOffset = getOffset(date, tz);
        const localOffset = -date.getTimezoneOffset();
        const diff = targetOffset - localOffset;
        const adjustedDate = new Date(date.getTime() - diff * 6e4);
        if (isNaN(adjustedDate.getTime())) throw new Error();
        inputTs.value = Math.floor(adjustedDate.getTime() / 1e3);
      } catch (e) {
        alert(t.errorInvalid);
      }
    };
    container.addEventListener("click", (e) => {
      if (e.target.classList.contains("copy-btn")) {
        const targetId = e.target.getAttribute("data-target");
        const text = document.getElementById(targetId).textContent;
        navigator.clipboard.writeText(text).then(() => {
          const originalText = e.target.textContent;
          e.target.textContent = t.copied;
          setTimeout(() => e.target.textContent = originalText, 1500);
        });
      }
    });
  })();
})();
