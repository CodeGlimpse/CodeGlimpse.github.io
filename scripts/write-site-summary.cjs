const fs = require('node:fs');
const path = require('node:path');
const { TOOL_IDS } = require('./tool-registry.cjs');

const projectRoot = path.resolve(__dirname, '..');

function collectFiles(directory, predicate) {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectFiles(entryPath, predicate);
        return entry.isFile() && predicate(entryPath) ? [entryPath] : [];
    });
}

function countSiteMetrics(publicRoot = path.join(projectRoot, 'public')) {
    const htmlPages = collectFiles(publicRoot, (filePath) => filePath.endsWith('.html')).length;
    const toolPages = TOOL_IDS.reduce((count, toolId) => count
        + Number(fs.existsSync(path.join(publicRoot, 'tools', toolId, 'index.html')))
        + Number(fs.existsSync(path.join(publicRoot, 'en', 'tools', toolId, 'index.html'))), 0);
    return { htmlPages, toolPages };
}

function buildSummary({ stage = 'build', publicRoot, source = process.env.GITHUB_SHA ?? 'local' } = {}) {
    const metrics = countSiteMetrics(publicRoot);
    const lines = [
        `## CodeGlimpse ${stage} summary`,
        '',
        `- Source commit: \`${source}\``,
        `- Go: \`${process.env.GO_VERSION ?? 'configured in workflow'}\``,
        `- Hugo: \`${process.env.HUGO_VERSION ?? 'configured in workflow'}\``,
        `- Node.js: \`${process.env.NODE_VERSION ?? 'configured in workflow'}\``,
        `- Generated HTML pages: ${metrics.htmlPages}`,
        `- Published bilingual tool pages: ${metrics.toolPages} (${TOOL_IDS.length} tools x 2 languages)`,
        '- Quality gates: version, workflow, JavaScript, content, unit tests, Hugo build, output, and browser E2E',
    ];
    if (stage === 'deploy') {
        lines.push('- Online verification: deployed endpoint and local asset smoke test');
    }
    return `${lines.join('\n')}\n`;
}

function writeSummary(options = {}) {
    const summary = buildSummary(options);
    const target = process.env.GITHUB_STEP_SUMMARY;
    if (target) fs.appendFileSync(target, summary, 'utf8');
    else process.stdout.write(summary);
    return summary;
}

if (require.main === module) writeSummary({ stage: process.env.SUMMARY_STAGE ?? 'build' });

module.exports = { buildSummary, countSiteMetrics, writeSummary };
