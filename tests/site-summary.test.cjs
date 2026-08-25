const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const summary = require('../scripts/write-site-summary.cjs');
const { TOOL_IDS } = require('../scripts/tool-registry.cjs');

function createSiteFixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codeglimpse-summary-'));
    const pages = [path.join(root, 'index.html')];
    for (const toolId of TOOL_IDS) {
        pages.push(
            path.join(root, 'tools', toolId, 'index.html'),
            path.join(root, 'en', 'tools', toolId, 'index.html'),
        );
    }
    for (const filePath of pages) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, '<html></html>');
    }
    return root;
}

test('counts bilingual tool pages in a built site', () => {
    const fixture = createSiteFixture();
    try {
        const metrics = summary.countSiteMetrics(fixture);
        assert.equal(metrics.toolPages, 32);
        assert.ok(metrics.htmlPages >= metrics.toolPages);
    } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
    }
});

test('builds a traceable maintenance summary', () => {
    const fixture = createSiteFixture();
    try {
        const output = summary.buildSummary({ stage: 'deploy', publicRoot: fixture, source: 'abc123' });
        assert.match(output, /Source commit: `abc123`/);
        assert.match(output, /Published bilingual tool pages: 32/);
        assert.match(output, /Online verification/);
    } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
    }
});
