const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const contentRoot = path.join(projectRoot, 'content');
const outputRoot = path.join(projectRoot, 'public');
const errors = [];
const googleAnalyticsId = 'G-Q70SQCVRF7';
const baiduAnalyticsId = 'ffa021be8a9760a0c063cb6e6b71e095';
const clarityProjectId = 'occc2jaghm';

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

function checkResponsiveAvatar(relativeFile, html) {
    const avatar = html.match(/<img\b(?=[^>]*\bclass=(?:"[^"]*\bsite-logo\b[^"]*"|'[^']*\bsite-logo\b'|[^\s>]*\bsite-logo\b))[^>]*>/i)?.[0] ?? '';
    if (!avatar) {
        errors.push(`${relativeFile}: missing site avatar`);
        return;
    }
    if (!/\bwidth=["']?100["']?/i.test(avatar) || !/\bheight=["']?100["']?/i.test(avatar)) {
        errors.push(`${relativeFile}: site avatar must reserve a 100x100 layout box`);
    }
    if (!/\bsrcset=["'][^"']+\s+100w,\s*[^"']+\s+200w["']/i.test(avatar)) {
        errors.push(`${relativeFile}: site avatar must expose 100w and 200w srcset candidates`);
    }
    if (!/\bsizes=["'][^"']+["']/i.test(avatar)) {
        errors.push(`${relativeFile}: site avatar must define sizes for responsive loading`);
    }
}

function checkLocalAssetTags(relativeFile, html) {
    const allowedExternalAssets = new Set([
        `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
    ]);
    const tags = [
        /<img\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi,
        /<script\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi,
        /<link\b[^>]*\brel=(?:"stylesheet"|'stylesheet'|stylesheet)[^>]*\bhref=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi,
    ];
    for (const pattern of tags) {
        for (const match of html.matchAll(pattern)) {
            const asset = match[1] || match[2] || match[3];
            if (/^https?:\/\//i.test(asset) && !allowedExternalAssets.has(asset)) {
                errors.push(`${relativeFile}: external asset is not allowed in key page: ${asset}`);
            }
        }
    }
}

function checkAnalytics(relativeFile, html) {
    const googleScript = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
    const baiduScript = `https://hm.baidu.com/hm.js?${baiduAnalyticsId}`;
    const clarityScriptBase = 'https://www.clarity.ms/tag/';
    const googleScriptCount = (html.match(new RegExp(googleScript.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
    const baiduScriptCount = (html.match(new RegExp(baiduScript.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
    const clarityScriptBaseCount = (html.match(new RegExp(clarityScriptBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
    const clarityProjectIdCount = (html.match(new RegExp(clarityProjectId, 'g')) ?? []).length;

    if (googleScriptCount !== 1) {
        errors.push(`${relativeFile}: expected one Google Analytics script, found ${googleScriptCount}`);
    }
    if (baiduScriptCount !== 1) {
        errors.push(`${relativeFile}: expected one Baidu Analytics script, found ${baiduScriptCount}`);
    }
    if (clarityScriptBaseCount !== 1 || clarityProjectIdCount !== 1) {
        errors.push(`${relativeFile}: expected one Microsoft Clarity script for project ${clarityProjectId}`);
    }
    requirePattern(
        relativeFile,
        html,
        new RegExp(`gtag\\((?:['\"])config(?:['\"]),?\\s*(?:['\"])${googleAnalyticsId}(?:['\"])\\)`, 'i'),
        'missing Google Analytics configuration call',
    );
    requirePattern(relativeFile, html, /var\s+_hmt\s*=\s*_hmt\s*\|\|\s*\[\]/i,
        'missing Baidu Analytics queue initialization');
    requirePattern(relativeFile, html, /\.q\s*=\s*[^;]*\.push\(arguments\)[\s\S]*clarity/i,
        'missing Microsoft Clarity queue initialization');
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
    for (const searchPage of ['search/index.html', 'en/search/index.html']) {
        const html = readOutput(searchPage);
        const scriptPath = html.match(/src=["']?(\/ts\/search\.[a-f0-9]{64}\.js)/i)?.[1];
        if (!scriptPath) {
            errors.push(`${searchPage}: missing fingerprinted search script`);
            continue;
        }
        const script = readOutput(scriptPath.replace(/^\//, ''));
        forbidPattern(searchPage, script, /dangerouslySetInnerHTML|\.innerHTML\s*=/i,
            'search script must not inject dynamic HTML');
    }
    requireFile('robots.txt');
    requireFile('sitemap.xml');
    requireFile('favicon.png');
    requireFile('signature.svg');
    requireFile('img/github-mark.svg');
    requireFile('img/og-default.png');
    requireFile('sw.js');
    requireFile('offline.html');

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

    const verificationContent = 'wmOney6zJ-t1ceBP1NkI3tCCzftAbPd8ZIsgm_ltYwY';
    const chineseHome = readOutput('index.html');
    const englishHome = readOutput('en/index.html');
    for (const [relativeFile, html] of [['index.html', chineseHome], ['en/index.html', englishHome]]) {
        requirePattern(
            relativeFile,
            html,
            new RegExp(`<meta\\b[^>]*\\bname=(?:["']?)google-site-verification(?:["']?)[^>]*\\bcontent=(?:["']?)${verificationContent}(?:["']?)`, 'i'),
            'missing Google site verification meta tag',
        );
    }
    checkResponsiveAvatar('index.html', chineseHome);
    checkResponsiveAvatar('en/index.html', englishHome);
    forbidPattern('tools/json/index.html', readOutput('tools/json/index.html'), /google-site-verification/i,
        'Google site verification meta tag must be limited to homepages');

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
        checkAnalytics(relativeFile, html);
    }
}

if (errors.length > 0) {
    console.error(`Build output check failed: ${errors.length} issue(s)`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log('Build output check passed: homepage JSON absent, search JSON present, analytics present, and published assets verified');
