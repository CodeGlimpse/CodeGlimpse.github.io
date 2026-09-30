const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DEMO_REGISTRY, validateDemoRegistry } = require('../scripts/demo-registry.cjs');
const projectRoot = path.resolve(__dirname, '..');

test('each registered demo has source pages and a real JPEG preview', () => {
    for (const demo of DEMO_REGISTRY) {
        assert.ok(fs.existsSync(path.join(projectRoot, demo.source, 'hugo.toml')));
        const preview = fs.readFileSync(path.join(projectRoot, 'static', demo.preview.image));
        assert.equal(preview.readUInt16BE(0), 0xffd8);
        assert.ok(preview.length > 1024 && preview.length <= 300 * 1024, `${demo.id}: preview must be between 1 and 300 KiB`);
        assert.ok(demo.checks.navigation.every(route => demo.checks.pages.includes(route)));
    }
});

test('rejects duplicated destinations and incomplete language copy', () => {
    const duplicates = structuredClone(DEMO_REGISTRY);
    duplicates.push({ ...structuredClone(duplicates[0]), id: 'another-demo' });
    assert.throws(() => validateDemoRegistry(duplicates), /Duplicate/);
    const incomplete = structuredClone(DEMO_REGISTRY);
    delete incomplete[0].copy.en.description;
    assert.throws(() => validateDemoRegistry(incomplete), /Missing en demo copy/);
});

test('rejects paths that escape the site or source tree', () => {
    for (const value of ['../escape', '/absolute', 'C:/absolute', 'folder/../../escape']) {
        const entries = structuredClone(DEMO_REGISTRY);
        entries[0].source = value;
        assert.throws(() => validateDemoRegistry(entries), /Invalid demo paths/);
    }
    const entries = structuredClone(DEMO_REGISTRY);
    entries[0].preview.image = '../outside.jpg';
    assert.throws(() => validateDemoRegistry(entries), /Invalid demo preview/);
});
