const TOOL_REGISTRY = Object.freeze({
    base64: Object.freeze({ script: 'base64.js', core: 'base64-core.js' }),
    binary: Object.freeze({ script: 'binary.js', core: 'binary-core.js' }),
    bmi: Object.freeze({ script: 'bmi.js', core: 'bmi-core.js' }),
    color: Object.freeze({ script: 'color.js', core: 'color-core.js' }),
    csv: Object.freeze({ script: 'csv.js', core: 'csv-core.js' }),
    html: Object.freeze({ script: 'html.js', core: 'html-core.js' }),
    json: Object.freeze({ script: 'json.js', core: null }),
    jwt: Object.freeze({ script: 'jwt.js', core: 'jwt-core.js' }),
    md5: Object.freeze({ script: 'md5.js', core: 'md5-core.js' }),
    password: Object.freeze({ script: 'password.js', core: 'password-core.js' }),
    regex: Object.freeze({ script: 'regex.js', core: 'regex-core.js' }),
    sha: Object.freeze({ script: 'sha.js', core: 'sha-core.js' }),
    text: Object.freeze({ script: 'text.js', core: 'text-core.js' }),
    time: Object.freeze({ script: 'time.js', core: 'time-core.js' }),
    url: Object.freeze({ script: 'url.js', core: 'url-core.js' }),
    uuid: Object.freeze({ script: 'uuid.js', core: 'uuid-core.js' }),
});

const TOOL_IDS = Object.freeze(Object.keys(TOOL_REGISTRY));
const LANGUAGES = Object.freeze(['zh-cn', 'en']);

module.exports = { LANGUAGES, TOOL_IDS, TOOL_REGISTRY };
