const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const contentRoot = path.join(projectRoot, 'content');
const outputRoot = path.join(projectRoot, 'public');
const errors = [];

function relativePath(filePath) {
    return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function requireFile(relativeFile) {
    const filePath = path.join(outputRoot, relativeFile);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        errors.push(`missing generated file: ${relativeFile}`);
    }
    return filePath;
}

function requireJson(relativeFile) {
    const filePath = requireFile(relativeFile);
    if (!fs.existsSync(filePath)) return;

    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!Array.isArray(parsed)) errors.push(`${relativeFile}: expected a JSON array`);
    } catch (error) {
        errors.push(`${relativeFile}: invalid JSON (${error.message})`);
    }
}

function readOutput(relativeFile) {
    const filePath = requireFile(relativeFile);
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf8');
}

function requirePattern(relativeFile, content, pattern, message) {
    if (!pattern.test(content)) errors.push(`${relativeFile}: ${message}`);
}

function forbidPattern(relativeFile, content, pattern, message) {
    if (pattern.test(content)) errors.push(`${relativeFile}: ${message}`);
}

function checkImagesHaveAlt(relativeFile, html) {
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
        if (!/\balt\s*=\s*(?:["'][^"']*["']|[^\s>]+)/i.test(match[0])) {
            errors.push(`${relativeFile}: image is missing an alt attribute`);
        }
    }
}

function checkLocalAssetTags(relativeFile, html) {
    const tags = [
        /<img\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi,
        /<script\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi,
        /<link\b[^>]*\brel=(?:"stylesheet"|'stylesheet'|stylesheet)[^>]*\bhref=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi,
    ];
    for (const pattern of tags) {
        for (const match of html.matchAll(pattern)) {
            const asset = match[1] || match[2] || match[3];
            if (/^https?:\/\//i.test(asset)) {
                errors.push(`${relativeFile}: external asset is not allowed in key page: ${asset}`);
            }
        }
    }
}

function checkToolMetadata(relativeFile, expectations) {
    const html = readOutput(relativeFile);
    if (!html) return;

    requirePattern(relativeFile, html, expectations.title, 'missing site-qualified page title');
    for (const language of ['zh-cn', 'en', 'x-default']) {
        requirePattern(
            relativeFile,
            html,
            new RegExp(`hreflang=["']?${language}["']?`, 'i'),
            `missing hreflang=${language}`,
        );
    }
    requirePattern(relativeFile, html, /type=["']?application\/ld\+json["']?[^>]*>[^<]*"@type":"WebApplication"/i,
        'missing WebApplication structured data');
    requirePattern(relativeFile, html, /property=["']?og:image["']?/i, 'missing Open Graph image');
    requirePattern(relativeFile, html, /name=["']?twitter:image["']?/i, 'missing Twitter image');
    requirePattern(relativeFile, html, /property=["']og:type["'][^>]+content=["']website["']/i,
        'tool page must use website Open Graph type');

    const h1Count = (html.match(/<h1\b/gi) ?? []).length;
    if (h1Count !== 1) errors.push(`${relativeFile}: expected exactly one h1, found ${h1Count}`);

    forbidPattern(relativeFile, html, /photoswipe/i, 'tool page must not load PhotoSwipe');
    forbidPattern(relativeFile, html, /node-vibrant|vibrant\.min\.js/i, 'tool page must not load Vibrant');
    forbidPattern(relativeFile, html, /fonts\.googleapis\.com/i, 'tool page must not load Google Fonts');
    requirePattern(relativeFile, html, /\/js\/tools\/json\.[a-f0-9]{64}\.js/i,
        'JSON script must use a SHA-256 fingerprinted URL');
}

function collectToolIds(language) {
    const toolsDirectory = path.join(contentRoot, language, 'tools');
    if (!fs.existsSync(toolsDirectory)) {
        errors.push(`missing content tools directory: ${relativePath(toolsDirectory)}`);
        return [];
    }

    return fs.readdirSync(toolsDirectory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name.toLowerCase())
        .sort();
}

function checkToolPages(language) {
    const toolIds = collectToolIds(language);
    const outputPrefix = language === 'en' ? 'en' : '';
    for (const toolId of toolIds) {
        const relativeFile = path.posix.join(outputPrefix, 'tools', toolId, 'index.html');
        requireFile(relativeFile);
    }
    return toolIds;
}

if (!fs.existsSync(outputRoot)) {
    errors.push(`missing build output directory: ${relativePath(outputRoot)}`);
} else {
    // The homepage intentionally exposes HTML/RSS only. Search pages are the
    // only JSON page outputs currently supported by the project.
    for (const homepageJson of ['index.json', 'en/index.json']) {
        if (fs.existsSync(path.join(outputRoot, homepageJson))) {
            errors.push(`homepage JSON must not be generated: ${homepageJson}`);
        }
    }

    requireJson('search/index.json');
    requireJson('en/search/index.json');
    requireFile('robots.txt');
    requireFile('sitemap.xml');
    requireFile('favicon.png');
    requireFile('signature.svg');
    requireFile('img/github-mark.svg');
    requireFile('img/og-default.png');

    const zhTools = checkToolPages('zh-cn');
    const enTools = checkToolPages('en');
    if (zhTools.join('|') !== enTools.join('|')) {
        errors.push(`generated tool page sets differ: zh-cn=${zhTools.join(',')}, en=${enTools.join(',')}`);
    }

    checkToolMetadata('tools/json/index.html', {
        title: /<title>JSON 格式化工具 \| Fernweh的个人博客<\/title>/i,
    });
    checkToolMetadata('en/tools/json/index.html', {
        title: /<title>JSON Formatter \| Personal Blogs for Fernweh<\/title>/i,
    });

    const keyPages = [
        'index.html',
        'en/index.html',
        'links/index.html',
        'en/links/index.html',
        ...zhTools.map((toolId) => `tools/${toolId}/index.html`),
        ...enTools.map((toolId) => `en/tools/${toolId}/index.html`),
    ];
    for (const relativeFile of keyPages) {
        const html = readOutput(relativeFile);
        if (!html) continue;
        checkImagesHaveAlt(relativeFile, html);
        checkLocalAssetTags(relativeFile, html);
    }
}

if (errors.length > 0) {
    console.error(`Build output check failed: ${errors.length} issue(s)`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log('Build output check passed: homepage JSON absent, search JSON present, and published assets verified');
