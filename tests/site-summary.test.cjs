const test = require('node:test');
const assert = require('node:assert/strict');

const summary = require('../scripts/write-site-summary.cjs');

test('counts bilingual tool pages in a built site', () => {
    const metrics = summary.countSiteMetrics('public');
    assert.equal(metrics.toolPages, 32);
    assert.ok(metrics.htmlPages >= metrics.toolPages);
});

test('builds a traceable maintenance summary', () => {
    const output = summary.buildSummary({ stage: 'deploy', publicRoot: 'public', source: 'abc123' });
    assert.match(output, /Source commit: `abc123`/);
    assert.match(output, /Published bilingual tool pages: 32/);
    assert.match(output, /Online verification/);
});
