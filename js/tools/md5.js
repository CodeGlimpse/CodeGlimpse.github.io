(() => {
  // <stdin>
  (function() {
    const container = document.getElementById("tool-md5");
    if (!container) return;
    const lang = container.getAttribute("data-lang") || "zh-cn";
    const i18n = {
      "zh-cn": {
        labelInput: "\u8F93\u5165\u5185\u5BB9",
        labelOutput: "MD5 \u54C8\u5E0C\u503C",
        placeholderInput: "\u5728\u6B64\u8F93\u5165\u9700\u8981\u52A0\u5BC6\u7684\u6587\u672C...",
        btnHash: "\u751F\u6210 (Generate)",
        btnClear: "\u6E05\u7A7A\u5185\u5BB9",
        copyBtn: "\u590D\u5236\u7ED3\u679C",
        copied: "\u5DF2\u590D\u5236",
        caseLabel: "\u8F93\u51FA\u683C\u5F0F",
        caseLower: "\u5C0F\u5199",
        caseUpper: "\u5927\u5199"
      },
      "en": {
        labelInput: "Input Content",
        labelOutput: "MD5 Hash",
        placeholderInput: "Enter text to hash...",
        btnHash: "Generate",
        btnClear: "Clear",
        copyBtn: "Copy Result",
        copied: "Copied",
        caseLabel: "Output Case",
        caseLower: "Lowercase",
        caseUpper: "Uppercase"
      }
    };
    const t = i18n[lang] || i18n["en"];
    function md5(string) {
      function rotateLeft(lValue, iShiftBits) {
        return lValue << iShiftBits | lValue >>> 32 - iShiftBits;
      }
      function addUnsigned(lX, lY) {
        var lX4, lY4, lX8, lY8, lResult;
        lX8 = lX & 2147483648;
        lY8 = lY & 2147483648;
        lX4 = lX & 1073741824;
        lY4 = lY & 1073741824;
        lResult = (lX & 1073741823) + (lY & 1073741823);
        if (lX4 & lY4) return lResult ^ 2147483648 ^ lX8 ^ lY8;
        if (lX4 | lY4) {
          if (lResult & 1073741824) return lResult ^ 3221225472 ^ lX8 ^ lY8;
          else return lResult ^ 1073741824 ^ lX8 ^ lY8;
        } else return lResult ^ lX8 ^ lY8;
      }
      function F(x2, y, z) {
        return x2 & y | ~x2 & z;
      }
      function G(x2, y, z) {
        return x2 & z | y & ~z;
      }
      function H(x2, y, z) {
        return x2 ^ y ^ z;
      }
      function I(x2, y, z) {
        return y ^ (x2 | ~z);
      }
      function FF(a2, b2, c2, d2, x2, s, ac) {
        a2 = addUnsigned(a2, addUnsigned(addUnsigned(F(b2, c2, d2), x2), ac));
        return addUnsigned(rotateLeft(a2, s), b2);
      }
      function GG(a2, b2, c2, d2, x2, s, ac) {
        a2 = addUnsigned(a2, addUnsigned(addUnsigned(G(b2, c2, d2), x2), ac));
        return addUnsigned(rotateLeft(a2, s), b2);
      }
      function HH(a2, b2, c2, d2, x2, s, ac) {
        a2 = addUnsigned(a2, addUnsigned(addUnsigned(H(b2, c2, d2), x2), ac));
        return addUnsigned(rotateLeft(a2, s), b2);
      }
      function II(a2, b2, c2, d2, x2, s, ac) {
        a2 = addUnsigned(a2, addUnsigned(addUnsigned(I(b2, c2, d2), x2), ac));
        return addUnsigned(rotateLeft(a2, s), b2);
      }
      function convertToWordArray(string2) {
        var lWordCount;
        var lMessageLength = string2.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - lNumberOfWords_temp1 % 64) / 64;
        var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        var lWordArray = Array(lNumberOfWords - 1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
          lWordCount = (lByteCount - lByteCount % 4) / 4;
          lBytePosition = lByteCount % 4 * 8;
          lWordArray[lWordCount] = lWordArray[lWordCount] | string2.charCodeAt(lByteCount) << lBytePosition;
          lByteCount++;
        }
        lWordCount = (lByteCount - lByteCount % 4) / 4;
        lBytePosition = lByteCount % 4 * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | 128 << lBytePosition;
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
      }
      function wordToHex(lValue) {
        var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
          lByte = lValue >>> lCount * 8 & 255;
          WordToHexValue_temp = "0" + lByte.toString(16);
          WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
        }
        return WordToHexValue;
      }
      function utf8Encode(string2) {
        string2 = string2.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string2.length; n++) {
          var c2 = string2.charCodeAt(n);
          if (c2 < 128) {
            utftext += String.fromCharCode(c2);
          } else if (c2 > 127 && c2 < 2048) {
            utftext += String.fromCharCode(c2 >> 6 | 192);
            utftext += String.fromCharCode(c2 & 63 | 128);
          } else {
            utftext += String.fromCharCode(c2 >> 12 | 224);
            utftext += String.fromCharCode(c2 >> 6 & 63 | 128);
            utftext += String.fromCharCode(c2 & 63 | 128);
          }
        }
        return utftext;
      }
      var x = Array();
      var k, AA, BB, CC, DD, a, b, c, d;
      var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
      var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
      var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
      var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
      string = utf8Encode(string);
      x = convertToWordArray(string);
      a = 1732584193;
      b = 4023233417;
      c = 2562383102;
      d = 271733878;
      for (k = 0; k < x.length; k += 16) {
        AA = a;
        BB = b;
        CC = c;
        DD = d;
        a = FF(a, b, c, d, x[k + 0], S11, 3614090360);
        d = FF(d, a, b, c, x[k + 1], S12, 3905402710);
        c = FF(c, d, a, b, x[k + 2], S13, 606105819);
        b = FF(b, c, d, a, x[k + 3], S14, 3250441966);
        a = FF(a, b, c, d, x[k + 4], S11, 4118548399);
        d = FF(d, a, b, c, x[k + 5], S12, 1200080426);
        c = FF(c, d, a, b, x[k + 6], S13, 2821735955);
        b = FF(b, c, d, a, x[k + 7], S14, 4249261313);
        a = FF(a, b, c, d, x[k + 8], S11, 1770035416);
        d = FF(d, a, b, c, x[k + 9], S12, 2336552879);
        c = FF(c, d, a, b, x[k + 10], S13, 4294925233);
        b = FF(b, c, d, a, x[k + 11], S14, 2304563134);
        a = FF(a, b, c, d, x[k + 12], S11, 1804603682);
        d = FF(d, a, b, c, x[k + 13], S12, 4254626195);
        c = FF(c, d, a, b, x[k + 14], S13, 2792965006);
        b = FF(b, c, d, a, x[k + 15], S14, 1236535329);
        a = GG(a, b, c, d, x[k + 1], S21, 4129170786);
        d = GG(d, a, b, c, x[k + 6], S22, 3225465664);
        c = GG(c, d, a, b, x[k + 11], S23, 643717713);
        b = GG(b, c, d, a, x[k + 0], S24, 3921069994);
        a = GG(a, b, c, d, x[k + 5], S21, 3593408605);
        d = GG(d, a, b, c, x[k + 10], S22, 38016083);
        c = GG(c, d, a, b, x[k + 15], S23, 3634488961);
        b = GG(b, c, d, a, x[k + 4], S24, 3889429448);
        a = GG(a, b, c, d, x[k + 9], S21, 568446438);
        d = GG(d, a, b, c, x[k + 14], S22, 3275163606);
        c = GG(c, d, a, b, x[k + 3], S23, 4107603335);
        b = GG(b, c, d, a, x[k + 8], S24, 1163531501);
        a = GG(a, b, c, d, x[k + 13], S21, 2850285829);
        d = GG(d, a, b, c, x[k + 2], S22, 4243563512);
        c = GG(c, d, a, b, x[k + 7], S23, 1735328473);
        b = GG(b, c, d, a, x[k + 12], S24, 2368359562);
        a = HH(a, b, c, d, x[k + 5], S31, 4294588738);
        d = HH(d, a, b, c, x[k + 8], S32, 2272392833);
        c = HH(c, d, a, b, x[k + 11], S33, 1839030562);
        b = HH(b, c, d, a, x[k + 14], S34, 4259657740);
        a = HH(a, b, c, d, x[k + 1], S31, 2763975236);
        d = HH(d, a, b, c, x[k + 4], S32, 1272893353);
        c = HH(c, d, a, b, x[k + 7], S33, 4139469664);
        b = HH(b, c, d, a, x[k + 10], S34, 3200236656);
        a = HH(a, b, c, d, x[k + 13], S31, 681279174);
        d = HH(d, a, b, c, x[k + 0], S32, 3936430074);
        c = HH(c, d, a, b, x[k + 3], S33, 3572445317);
        b = HH(b, c, d, a, x[k + 6], S34, 76029189);
        a = HH(a, b, c, d, x[k + 9], S31, 3654602809);
        d = HH(d, a, b, c, x[k + 12], S32, 3873151461);
        c = HH(c, d, a, b, x[k + 15], S33, 530742520);
        b = HH(b, c, d, a, x[k + 2], S34, 3299628645);
        a = II(a, b, c, d, x[k + 0], S41, 4096336452);
        d = II(d, a, b, c, x[k + 7], S42, 1126891415);
        c = II(c, d, a, b, x[k + 14], S43, 2878612391);
        b = II(b, c, d, a, x[k + 5], S44, 4237533241);
        a = II(a, b, c, d, x[k + 12], S41, 1700485571);
        d = II(d, a, b, c, x[k + 3], S42, 2399980690);
        c = II(c, d, a, b, x[k + 10], S43, 4293915773);
        b = II(b, c, d, a, x[k + 1], S44, 2240044497);
        a = II(a, b, c, d, x[k + 8], S41, 1873313359);
        d = II(d, a, b, c, x[k + 15], S42, 4264355552);
        c = II(c, d, a, b, x[k + 6], S43, 2734768916);
        b = II(b, c, d, a, x[k + 13], S44, 1309151649);
        a = II(a, b, c, d, x[k + 4], S41, 4149444226);
        d = II(d, a, b, c, x[k + 11], S42, 3174756917);
        c = II(c, d, a, b, x[k + 2], S43, 718787259);
        b = II(b, c, d, a, x[k + 9], S44, 3951481745);
        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
      }
      var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
      return temp.toLowerCase();
    }
    container.innerHTML = `
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
        <div class="tool-container">
            <div class="input-group">
                <label>${t.labelInput}</label>
                <textarea id="md5-input" rows="8" placeholder="${t.placeholderInput}"></textarea>
            </div>
            <div class="button-group">
                <button class="btn btn-primary" id="md5-generate">${t.btnHash}</button>
                <button class="btn btn-secondary" id="md5-clear">${t.btnClear}</button>
                <div class="options-group">
                    <span>${t.caseLabel}:</span>
                    <input type="radio" id="case-lower" name="md5-case" value="lower" checked>
                    <label for="case-lower">${t.caseLower}</label>
                    <input type="radio" id="case-upper" name="md5-case" value="upper">
                    <label for="case-upper">${t.caseUpper}</label>
                </div>
            </div>
            <div class="input-group result-group" id="md5-result-group" style="display: none;">
                <label>${t.labelOutput}</label>
                <textarea id="md5-output" rows="2" readonly></textarea>
                <button class="btn-copy" id="md5-copy">${t.copyBtn}</button>
            </div>
        </div>
    `;
    const input = document.getElementById("md5-input");
    const output = document.getElementById("md5-output");
    const resultGroup = document.getElementById("md5-result-group");
    const btnGenerate = document.getElementById("md5-generate");
    const btnClear = document.getElementById("md5-clear");
    const btnCopy = document.getElementById("md5-copy");
    const caseRadios = document.getElementsByName("md5-case");
    const updateResult = () => {
      const str = input.value;
      if (!str) {
        resultGroup.style.display = "none";
        return;
      }
      let hash = md5(str);
      const isUpper = document.getElementById("case-upper").checked;
      if (isUpper) {
        hash = hash.toUpperCase();
      }
      output.value = hash;
      resultGroup.style.display = "block";
    };
    btnGenerate.onclick = updateResult;
    input.oninput = updateResult;
    caseRadios.forEach((radio) => {
      radio.onchange = updateResult;
    });
    btnClear.onclick = () => {
      input.value = "";
      output.value = "";
      resultGroup.style.display = "none";
      input.focus();
    };
    btnCopy.onclick = () => {
      output.select();
      document.execCommand("copy");
      const originalText = btnCopy.innerText;
      btnCopy.innerText = t.copied;
      setTimeout(() => {
        btnCopy.innerText = originalText;
      }, 2e3);
    };
  })();
})();
