const TOOL_REGISTRY = Object.freeze({
    base64: Object.freeze({ script: 'base64.js', core: 'base64-core.js' }),
    binary: Object.freeze({ script: 'binary.js', core: 'binary-core.js' }),
    bmi: Object.freeze({ script: 'bmi.js', core: 'bmi-core.js' }),
    color: Object.freeze({ script: 'color.js', core: 'color-core.js' }),
    json: Object.freeze({ script: 'json.js', core: null }),
    md5: Object.freeze({ script: 'md5.js', core: 'md5-core.js' }),
    sha: Object.freeze({ script: 'sha.js', core: 'sha-core.js' }),
    time: Object.freeze({ script: 'time.js', core: 'time-core.js' }),
});

const TOOL_IDS = Object.freeze(Object.keys(TOOL_REGISTRY));
const LANGUAGES = Object.freeze(['zh-cn', 'en']);

module.exports = { LANGUAGES, TOOL_IDS, TOOL_REGISTRY };
