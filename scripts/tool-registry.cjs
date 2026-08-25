const tool = (script, core, category, keywords, related = []) => Object.freeze({
    script,
    core,
    category,
    keywords: Object.freeze(keywords),
    related: Object.freeze(related),
});

const TOOL_REGISTRY = Object.freeze({
    base64: tool('base64.js', 'base64-core.js', 'encoding', ['base64', '编码', 'decode'], ['binary', 'html']),
    binary: tool('binary.js', 'binary-core.js', 'encoding', ['binary', '进制', 'hex'], ['base64', 'color']),
    bmi: tool('bmi.js', 'bmi-core.js', 'conversion', ['bmi', '健康', 'calculator'], ['time']),
    color: tool('color.js', 'color-core.js', 'conversion', ['color', '颜色', 'hex', 'rgb', 'hsl'], ['binary']),
    csv: tool('csv.js', 'csv-core.js', 'data', ['csv', 'json', '表格', '数据'], ['json', 'yaml', 'diff']),
    diff: tool('diff.js', 'diff-core.js', 'text', ['diff', 'compare', '对比', '差异'], ['text', 'markdown']),
    html: tool('html.js', 'html-core.js', 'encoding', ['html', 'entity', '实体'], ['xml', 'markdown']),
    json: tool('json.js', null, 'data', ['json', 'format', '格式化', 'validate'], ['yaml', 'jsonpath', 'csv']),
    jsonpath: tool('jsonpath.js', 'jsonpath-core.js', 'data', ['jsonpath', 'query', '查询'], ['json', 'yaml']),
    jwt: tool('jwt.js', 'jwt-core.js', 'security', ['jwt', 'token', '令牌'], ['json', 'base64']),
    markdown: tool('markdown.js', 'markdown-core.js', 'text', ['markdown', 'md', 'preview', '预览'], ['html', 'diff']),
    md5: tool('md5.js', 'md5-core.js', 'security', ['md5', 'hash', '哈希'], ['sha', 'password']),
    password: tool('password.js', 'password-core.js', 'security', ['password', '密码', 'random'], ['uuid', 'sha']),
    regex: tool('regex.js', 'regex-core.js', 'text', ['regex', 'regexp', '正则'], ['diff', 'text']),
    sha: tool('sha.js', 'sha-core.js', 'security', ['sha', 'hash', '哈希'], ['md5', 'password']),
    sql: tool('sql.js', 'sql-core.js', 'development', ['sql', 'database', '数据库', 'format'], ['json', 'diff']),
    text: tool('text.js', 'text-core.js', 'text', ['text', '文本', 'statistics'], ['diff', 'markdown']),
    time: tool('time.js', 'time-core.js', 'conversion', ['time', 'timestamp', '时间戳'], ['bmi', 'uuid']),
    url: tool('url.js', 'url-core.js', 'encoding', ['url', 'uri', '编码'], ['base64', 'jwt']),
    uuid: tool('uuid.js', 'uuid-core.js', 'security', ['uuid', 'identifier', '标识符'], ['password', 'time']),
    xml: tool('xml.js', 'xml-core.js', 'data', ['xml', 'format', '校验'], ['html', 'json']),
    yaml: tool('yaml.js', 'yaml-core.js', 'data', ['yaml', 'json', '配置', 'config'], ['json', 'csv']),
});

const TOOL_IDS = Object.freeze(Object.keys(TOOL_REGISTRY));
const LANGUAGES = Object.freeze(['zh-cn', 'en']);

module.exports = { LANGUAGES, TOOL_IDS, TOOL_REGISTRY };
