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

    const zhTools = checkToolPages('zh-cn');
    const enTools = checkToolPages('en');
    if (zhTools.join('|') !== enTools.join('|')) {
        errors.push(`generated tool page sets differ: zh-cn=${zhTools.join(',')}, en=${enTools.join(',')}`);
    }
}

if (errors.length > 0) {
    console.error(`Build output check failed: ${errors.length} issue(s)`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log('Build output check passed: homepage JSON absent, search JSON present, and published assets verified');
