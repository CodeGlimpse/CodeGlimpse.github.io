const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const contentRoot = path.join(projectRoot, 'content');
const errors = [];

function relativePath(filePath) {
    return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function parseHexColor(value) {
    const normalized = value.trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(normalized)) {
        return normalized.split('').map((channel) => parseInt(channel + channel, 16) / 255);
    }
    if (/^[0-9a-f]{6}$/i.test(normalized)) {
        return normalized.match(/../g).map((channel) => parseInt(channel, 16) / 255);
    }
    return null;
}

function relativeLuminance(rgb) {
    return rgb.reduce((sum, channel, index) => {
        const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
}

function contrastRatio(foreground, background) {
    const foregroundLuminance = relativeLuminance(foreground);
    const backgroundLuminance = relativeLuminance(background);
    const lighter = Math.max(foregroundLuminance, backgroundLuminance);
    const darker = Math.min(foregroundLuminance, backgroundLuminance);
    return (lighter + 0.05) / (darker + 0.05);
}

function extractStyleColors(markdown) {
    const background = markdown.match(/^\s+background:\s*["']?(#[0-9a-f]{3,6})["']?\s*$/im)?.[1] ?? null;
    const color = markdown.match(/^\s+color:\s*["']?(#[0-9a-f]{3,6})["']?\s*$/im)?.[1] ?? null;
    return { background, color };
}

function collectCategoryFiles() {
    if (!fs.existsSync(contentRoot)) return [];
    return fs.readdirSync(contentRoot, { withFileTypes: true })
        .filter((language) => language.isDirectory())
        .flatMap((language) => {
            const categoriesRoot = path.join(contentRoot, language.name, 'categories');
            if (!fs.existsSync(categoriesRoot)) return [];
            return fs.readdirSync(categoriesRoot, { withFileTypes: true })
                .filter((category) => category.isDirectory())
                .map((category) => path.join(categoriesRoot, category.name, '_index.md'))
                .filter((filePath) => fs.existsSync(filePath));
        });
}

function checkCategoryContrast(filePath, markdown) {
    const { background, color } = extractStyleColors(markdown);
    if (!background || !color) {
        errors.push(`${relativePath(filePath)}: category style must define hex background and color values`);
        return;
    }

    const foregroundRgb = parseHexColor(color);
    const backgroundRgb = parseHexColor(background);
    if (!foregroundRgb || !backgroundRgb) {
        errors.push(`${relativePath(filePath)}: category style contains an unsupported color value`);
        return;
    }

    const ratio = contrastRatio(foregroundRgb, backgroundRgb);
    if (ratio < 4.5) {
        errors.push(`${relativePath(filePath)}: category colors have insufficient contrast (${ratio.toFixed(2)}:1, need at least 4.5:1)`);
    }
}

function run() {
    const files = collectCategoryFiles();
    if (files.length === 0) errors.push('no category front matter files found');
    for (const filePath of files) checkCategoryContrast(filePath, fs.readFileSync(filePath, 'utf8'));

    if (errors.length > 0) {
        console.error(`Category contrast check failed: ${errors.length} issue(s)`);
        for (const error of errors) console.error(`- ${error}`);
        process.exitCode = 1;
        return false;
    }

    console.log(`Category contrast check passed: ${files.length} category files meet WCAG AA contrast`);
    return true;
}

if (require.main === module) run();

module.exports = { parseHexColor, contrastRatio, extractStyleColors, run };
