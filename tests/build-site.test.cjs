const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveSourceCommit } = require('../scripts/build-site.cjs');

test('uses an explicit source commit for reproducible deployment markers', () => {
    const commit = 'ABCDEF0123456789ABCDEF0123456789ABCDEF01';
    assert.equal(resolveSourceCommit({ HUGO_PARAMS_SOURCECOMMIT: commit }), commit.toLowerCase());
});
