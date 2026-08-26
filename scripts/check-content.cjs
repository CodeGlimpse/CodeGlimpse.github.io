const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const contentRoot = path.join(projectRoot, 'content');
const toolsRoot = path.join(projectRoot, 'assets', 'js', 'tools');
const templatePath = path.join(projectRoot, 'layouts', 'shortcodes', 'tool.html');
const { LANGUAGES: languages, TOOL_IDS, TOOL_REGISTRY } = require('./tool-registry.cjs');
const errors = [];

function relativePath(filePath) {
    return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function collectFiles(directory, predicate) {
    if (!fs.existsSync(directory)) return [];

    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectFiles(entryPath, predicate);
        return entry.isFile() && predicate(entryPath) ? [entryPath] : [];
    });
}

function collectDirectories(directory) {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
}

function parseFrontMatter(filePath) {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    if (lines[0]?.trim() !== '---') {
        return { fields: new Map(), valid: false, error: 'missing opening front matter delimiter' };
    }

    const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
    if (closingIndex === -1) {
        return { fields: new Map(), valid: false, error: 'missing closing front matter delimiter' };
    }

    const fields = new Map();
    for (const line of lines.slice(1, closingIndex)) {
        const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
        if (match && !line.startsWith(' ') && !line.startsWith('\t')) {
            fields.set(match[1], match[2].trim());
        }
    }

    return { fields, valid: true };
}

function scalarValue(value) {
    const trimmed = value.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"'))
        || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

function hasValue(fields, key) {
    return fields.has(key) && scalarValue(fields.get(key)) !== '';
}

function isTrue(fields, key) {
    return scalarValue(fields.get(key) ?? '').toLowerCase() === 'true';
}

function getContentInfo(filePath) {
    const relative = path.relative(contentRoot, filePath).split(path.sep).join('/');
    const parts = relative.split('/');
    const language = parts[0];
    const section = parts[1] ?? '';
    const fileName = parts.at(-1);
    const directoryName = parts.at(-2);
    const isIndex = fileName === 'index.md' || fileName === '_index.md';
    const defaultSlug = isIndex ? directoryName : path.basename(fileName, '.md');

    return {
        language,
        section,
        fileName,
        defaultSlug,
        isIndex,
        relative
    };
}

function getToolId(filePath, fields) {
    const matches = fs.readFileSync(filePath, 'utf8').match(/\{\{<\s*tool\s+id\s*=\s*["']([^"']+)["']\s*>\}\}/g) ?? [];
    const ids = matches.map((match) => match.match(/id\s*=\s*["']([^"']+)["']/)[1]);

    if (ids.length !== 1) {
        errors.push(`${relativePath(filePath)}: expected exactly one tool shortcode, found ${ids.length}`);
        return null;
    }

    const toolId = ids[0].trim().toLowerCase();
    const slug = scalarValue(fields.get('slug') ?? '').toLowerCase();
    if (slug && slug !== toolId) {
        errors.push(`${relativePath(filePath)}: slug "${slug}" does not match tool id "${toolId}"`);
    }
    return toolId;
}

function checkFrontMatterAndPages() {
    const files = collectFiles(contentRoot, (filePath) => filePath.endsWith('.md'));
    const slugs = new Map();
    const toolIdsByLanguage = new Map(languages.map((language) => [language, new Set()]));

    for (const filePath of files) {
        const info = getContentInfo(filePath);
        const parsed = parseFrontMatter(filePath);
        if (!parsed.valid) {
            errors.push(`${relativePath(filePath)}: ${parsed.error}`);
            continue;
        }

        const { fields } = parsed;
        const isToolPage = info.section === 'tools' && info.isIndex && info.fileName === 'index.md';
        const isPost = info.section === 'post' && info.isIndex && info.fileName === 'index.md';

        if (isToolPage || isPost) {
            if (!hasValue(fields, 'title')) errors.push(`${relativePath(filePath)}: missing title`);
            if (!hasValue(fields, 'description')) errors.push(`${relativePath(filePath)}: missing description`);
            if (isTrue(fields, 'draft')) errors.push(`${relativePath(filePath)}: published page must not set draft: true`);
        }

        if (isToolPage) {
            const toolId = getToolId(filePath, fields);
            if (toolId) toolIdsByLanguage.get(info.language)?.add(toolId);

            const body = fs.readFileSync(filePath, 'utf8');
            const examplesHeading = info.language === 'zh-cn' ? /^### 示例与限制\s*$/m : /^### Examples and limits\s*$/m;
            if (!examplesHeading.test(body)) {
                errors.push(`${relativePath(filePath)}: missing examples and limits section`);
            }
            const privacyHint = info.language === 'zh-cn' ? /(本地|上传|离开浏览器)/ : /(local|upload|browser)/i;
            if (!privacyHint.test(body)) {
                errors.push(`${relativePath(filePath)}: missing local-processing or privacy note`);
            }

            const toolSpec = TOOL_REGISTRY[toolId];
            if (!toolSpec) {
                errors.push(`${relativePath(filePath)}: tool id "${toolId}" is not in the tool registry`);
                continue;
            }

            const scriptPath = path.join(toolsRoot, toolSpec.script);
            if (toolId && !fs.existsSync(scriptPath)) {
                errors.push(`${relativePath(filePath)}: tool id "${toolId}" has no matching ${relativePath(scriptPath)}`);
            }
        }

        if (!info.language || !languages.includes(info.language) || info.fileName === '_index.md') continue;

        const explicitSlug = scalarValue(fields.get('slug') ?? '');
        const slug = (explicitSlug || info.defaultSlug || '').trim().toLowerCase();
        if (!slug) continue;

        const slugKey = `${info.language}/${info.section}/${slug}`;
        const previous = slugs.get(slugKey);
        if (previous) {
            errors.push(`${relativePath(filePath)}: duplicate slug "${slug}" also used by ${previous}`);
        } else {
            slugs.set(slugKey, relativePath(filePath));
        }
    }

    return toolIdsByLanguage;
}

function checkToolDirectories(toolIdsByLanguage) {
    const directorySets = new Map();
    const expectedToolIds = new Set(TOOL_IDS);
    for (const language of languages) {
        const toolsDirectory = path.join(contentRoot, language, 'tools');
        const names = collectDirectories(toolsDirectory);
        const normalized = new Map();
        for (const name of names) {
            const key = name.toLowerCase();
            if (normalized.has(key)) {
                errors.push(`${relativePath(toolsDirectory)}: duplicate tool directory when ignoring case: ${name}`);
            }
            if (!expectedToolIds.has(key)) {
                errors.push(`${relativePath(toolsDirectory)}: unexpected tool directory "${name}"; add it to the tool registry first`);
            }
            normalized.set(key, name);

            const pagePath = path.join(toolsDirectory, name, 'index.md');
            if (!fs.existsSync(pagePath)) errors.push(`${relativePath(pagePath)}: tool page is missing`);
        }
        for (const toolId of expectedToolIds) {
            if (!normalized.has(toolId)) {
                errors.push(`${language}: registered tool "${toolId}" is missing from ${relativePath(toolsDirectory)}`);
            }
        }
        directorySets.set(language, new Set(normalized.keys()));

        const ids = toolIdsByLanguage.get(language) ?? new Set();
        for (const id of ids) {
            if (!normalized.has(id)) {
                errors.push(`${language}: tool shortcode id "${id}" has no matching content directory`);
            }
        }
    }

    const zhTools = directorySets.get('zh-cn') ?? new Set();
    const enTools = directorySets.get('en') ?? new Set();
    for (const id of new Set([...zhTools, ...enTools])) {
        if (!zhTools.has(id)) errors.push(`en tool "${id}" is missing from content/zh-cn/tools`);
        if (!enTools.has(id)) errors.push(`zh-cn tool "${id}" is missing from content/en/tools`);
    }

    console.log(`Tool directories: zh-cn=${zhTools.size}, en=${enTools.size}`);
}

function checkToolImplementations() {
    if (!fs.existsSync(templatePath)) {
        errors.push(`missing tool shortcode template: ${relativePath(templatePath)}`);
        return;
    }

    const template = fs.readFileSync(templatePath, 'utf8');
    for (const commonScript of ['clipboard.js', 'tool-ui.js', 'share.js']) {
        const commonPath = path.join(toolsRoot, commonScript);
        if (!fs.existsSync(commonPath)) {
            errors.push(`missing shared tool script: ${relativePath(commonPath)}`);
        }
        if (!template.includes(`js/tools/${commonScript}`)) {
            errors.push(`tool shortcode template does not load shared script ${commonScript}`);
        }
    }

    const offlineScriptPath = path.join(projectRoot, 'assets', 'js', 'offline.js');
    if (!fs.existsSync(offlineScriptPath)) {
        errors.push(`missing offline enhancement script: ${relativePath(offlineScriptPath)}`);
    }
    const toastScriptPath = path.join(projectRoot, 'assets', 'js', 'toast.js');
    if (!fs.existsSync(toastScriptPath)) {
        errors.push(`missing global toast script: ${relativePath(toastScriptPath)}`);
    }
    const baseTemplate = path.join(projectRoot, 'layouts', '_default', 'baseof.html');
    if (fs.existsSync(baseTemplate) && !fs.readFileSync(baseTemplate, 'utf8').includes('js/toast.js')) {
        errors.push('base template does not load global toast script');
    }
    const footerScript = path.join(projectRoot, 'layouts', 'partials', 'footer', 'components', 'script.html');
    if (fs.existsSync(footerScript) && !fs.readFileSync(footerScript, 'utf8').includes('js/offline.js')) {
        errors.push('footer script partial does not load offline enhancement script');
    }

    const dynamicCorePath = 'printf "js/tools/%s-core.js" $id';
    if (!template.includes(dynamicCorePath)) {
        errors.push('tool shortcode template does not load convention-based core scripts');
    }

    for (const toolId of TOOL_IDS) {
        const spec = TOOL_REGISTRY[toolId];
        const scriptPath = path.join(toolsRoot, spec.script);
        if (!fs.existsSync(scriptPath)) {
            errors.push(`registered tool "${toolId}" is missing implementation ${relativePath(scriptPath)}`);
        }

        if (spec.core) {
            const corePath = path.join(toolsRoot, spec.core);
            if (!fs.existsSync(corePath)) {
                errors.push(`registered tool "${toolId}" is missing core implementation ${relativePath(corePath)}`);
            }
            if (spec.core !== `${toolId}-core.js`) {
                errors.push(`registered tool "${toolId}" core must follow the ${toolId}-core.js naming convention`);
            }
        }
    }
}

function checkImageBudgets() {
    const categoryRoot = path.join(contentRoot);
    const banners = collectFiles(categoryRoot, (filePath) => (
        path.basename(filePath).toLowerCase() === 'banner.jpg'
        && filePath.split(path.sep).includes('categories')
    ));
    const maxBannerBytes = 300 * 1024;

    for (const banner of banners) {
        const size = fs.statSync(banner).size;
        if (size > maxBannerBytes) {
            errors.push(`${relativePath(banner)}: category banner exceeds 300 KB (${size} bytes)`);
        }
    }

    const shareImage = path.join(projectRoot, 'assets', 'img', 'og-default.png');
    if (!fs.existsSync(shareImage)) {
        errors.push(`${relativePath(shareImage)}: default social sharing image is missing`);
    } else if (fs.statSync(shareImage).size > 200 * 1024) {
        errors.push(`${relativePath(shareImage)}: default social sharing image exceeds 200 KB`);
    }
}

const toolIdsByLanguage = checkFrontMatterAndPages();
checkToolDirectories(toolIdsByLanguage);
checkToolImplementations();
checkImageBudgets();

if (errors.length > 0) {
    console.error(`Content structure check failed: ${errors.length} issue(s)`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log('Content structure check passed');
