(() => {
  // <stdin>
  (function() {
    const container = document.getElementById("tool-binary");
    if (!container) return;
    const lang = container.getAttribute("data-lang") || "zh-cn";
    const i18n = {
      "zh-cn": {
        labelInput: "\u8F93\u5165\u6570\u503C",
        labelBase: "\u6E90\u8FDB\u5236",
        labelBinary: "\u4E8C\u8FDB\u5236 (2)",
        labelOctal: "\u516B\u8FDB\u5236 (8)",
        labelDecimal: "\u5341\u8FDB\u5236 (10)",
        labelHex: "\u5341\u516D\u8FDB\u5236 (16)",
        labelCustom: "\u81EA\u5B9A\u4E49\u8FDB\u5236 (2-36)",
        placeholderInput: "\u5728\u8FD9\u91CC\u8F93\u5165\u6570\u503C...",
        placeholderCustom: "\u4F8B\u5982: 32",
        invalidInput: "\u65E0\u6548\u8F93\u5165",
        copyBtn: "\u590D\u5236",
        copied: "\u5DF2\u590D\u5236"
      },
      "en": {
        labelInput: "Input Value",
        labelBase: "Source Base",
        labelBinary: "Binary (2)",
        labelOctal: "Octal (8)",
        labelDecimal: "Decimal (10)",
        labelHex: "Hexadecimal (16)",
        labelCustom: "Custom Base (2-36)",
        placeholderInput: "Enter value here...",
        placeholderCustom: "e.g., 32",
        invalidInput: "Invalid Input",
        copyBtn: "Copy",
        copied: "Copied"
      }
    };
    const t = i18n[lang] || i18n["en"];
    container.innerHTML = `
        <style>
            #tool-binary .tool-container { display: flex; flex-direction: column; gap: 1.5rem; max-width: 600px; margin: 0 auto; }
            #tool-binary .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
            #tool-binary .input-group label { font-weight: bold; font-size: 1.1rem; color: var(--card-text-color-main); }
            #tool-binary select, #tool-binary input {
                padding: 0.8rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--body-background);
                color: var(--card-text-color-main);
                font-size: 1rem;
                outline: none;
                transition: border-color 0.2s;
            }
            #tool-binary select:focus, #tool-binary input:focus { border-color: var(--accent-color); }
            #tool-binary .results-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 1rem; }
            #tool-binary .result-item { display: flex; flex-direction: column; gap: 0.3rem; }
            #tool-binary .result-item label { font-size: 0.9rem; color: var(--card-text-color-secondary); }
            #tool-binary .result-row { display: flex; gap: 0.5rem; }
            #tool-binary .result-row input { flex: 1; }
            #tool-binary .copy-btn {
                padding: 0 1rem;
                background: var(--accent-color);
                color: #fff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: opacity 0.2s;
            }
            #tool-binary .copy-btn:hover { opacity: 0.8; }
            #tool-binary .custom-base-group { display: flex; gap: 1rem; }
            #tool-binary .custom-base-group .input-group { flex: 1; }
        </style>
        <div class="tool-container">
            <div class="custom-base-group">
                <div class="input-group">
                    <label>${t.labelBase}</label>
                    <select id="source-base">
                        <option value="2">2 (${t.labelBinary})</option>
                        <option value="8">8 (${t.labelOctal})</option>
                        <option value="10" selected>10 (${t.labelDecimal})</option>
                        <option value="16">16 (${t.labelHex})</option>
                        <option value="custom">${t.labelCustom}</option>
                    </select>
                </div>
                <div class="input-group" id="custom-source-group" style="display: none;">
                    <label>${t.labelCustom}</label>
                    <input type="number" id="custom-source-base" min="2" max="36" value="32">
                </div>
            </div>
            
            <div class="input-group">
                <label>${t.labelInput}</label>
                <input type="text" id="binary-input" placeholder="${t.placeholderInput}">
            </div>

            <div class="results-grid">
                <div class="result-item">
                    <label>${t.labelBinary}</label>
                    <div class="result-row">
                        <input type="text" id="res-2" readonly>
                        <button class="copy-btn" data-target="res-2">${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <label>${t.labelOctal}</label>
                    <div class="result-row">
                        <input type="text" id="res-8" readonly>
                        <button class="copy-btn" data-target="res-8">${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <label>${t.labelDecimal}</label>
                    <div class="result-row">
                        <input type="text" id="res-10" readonly>
                        <button class="copy-btn" data-target="res-10">${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <label>${t.labelHex}</label>
                    <div class="result-row">
                        <input type="text" id="res-16" readonly>
                        <button class="copy-btn" data-target="res-16">${t.copyBtn}</button>
                    </div>
                </div>
                <div class="result-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label>${t.labelCustom}</label>
                        <input type="number" id="target-custom-base" min="2" max="36" value="32" style="width: 60px; padding: 0.2rem; font-size: 0.8rem;">
                    </div>
                    <div class="result-row">
                        <input type="text" id="res-custom" readonly>
                        <button class="copy-btn" data-target="res-custom">${t.copyBtn}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    const sourceBaseSelect = document.getElementById("source-base");
    const customSourceGroup = document.getElementById("custom-source-group");
    const customSourceBaseInput = document.getElementById("custom-source-base");
    const binaryInput = document.getElementById("binary-input");
    const targetCustomBaseInput = document.getElementById("target-custom-base");
    const resultInputs = {
      2: document.getElementById("res-2"),
      8: document.getElementById("res-8"),
      10: document.getElementById("res-10"),
      16: document.getElementById("res-16"),
      custom: document.getElementById("res-custom")
    };
    function updateConversion() {
      const val = binaryInput.value.trim();
      if (!val) {
        Object.values(resultInputs).forEach((input) => input.value = "");
        return;
      }
      let sourceBase = sourceBaseSelect.value === "custom" ? parseInt(customSourceBaseInput.value) : parseInt(sourceBaseSelect.value);
      if (isNaN(sourceBase) || sourceBase < 2 || sourceBase > 36) sourceBase = 10;
      try {
        const decimalValue = BigInt("0x" + parseInt(val, sourceBase).toString(16));
        const decimalNum = parseInt(val, sourceBase);
        if (isNaN(decimalNum)) {
          throw new Error("Invalid");
        }
        resultInputs[2].value = decimalNum.toString(2).toUpperCase();
        resultInputs[8].value = decimalNum.toString(8).toUpperCase();
        resultInputs[10].value = decimalNum.toString(10).toUpperCase();
        resultInputs[16].value = decimalNum.toString(16).toUpperCase();
        let targetCustomBase = parseInt(targetCustomBaseInput.value);
        if (isNaN(targetCustomBase) || targetCustomBase < 2 || targetCustomBase > 36) targetCustomBase = 32;
        resultInputs["custom"].value = decimalNum.toString(targetCustomBase).toUpperCase();
      } catch (e) {
        Object.values(resultInputs).forEach((input) => input.value = t.invalidInput);
      }
    }
    sourceBaseSelect.addEventListener("change", () => {
      customSourceGroup.style.display = sourceBaseSelect.value === "custom" ? "flex" : "none";
      updateConversion();
    });
    [customSourceBaseInput, binaryInput, targetCustomBaseInput].forEach((el) => {
      el.addEventListener("input", updateConversion);
    });
    container.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (input && input.value && input.value !== t.invalidInput) {
          input.select();
          document.execCommand("copy");
          const originalText = btn.innerText;
          btn.innerText = t.copied;
          setTimeout(() => btn.innerText = originalText, 1500);
        }
      });
    });
  })();
})();
