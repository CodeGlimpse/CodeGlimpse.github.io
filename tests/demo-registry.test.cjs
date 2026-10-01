const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DEMO_CASES, DEMO_REGISTRY, validateDemoRegistry, expandDemoRegistry } = require('../scripts/demo-registry.cjs');
const { checkerArgs } = require('../scripts/check-demo-builds.cjs');
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
    const duplicates = structuredClone(DEMO_CASES);
    duplicates.push({ ...structuredClone(duplicates[0]), id: 'another-demo' });
    assert.throws(() => validateDemoRegistry(duplicates), /Duplicate/);
    const incomplete = structuredClone(DEMO_CASES);
    delete incomplete[0].copy.en.description;
    assert.throws(() => validateDemoRegistry(incomplete), /Missing en demo copy/);
});

test('rejects paths that escape the site or source tree', () => {
    for (const value of ['../escape', '/absolute', 'C:/absolute', 'folder/../../escape']) {
        const entries = structuredClone(DEMO_CASES);
        entries[0].source = value;
        assert.throws(() => validateDemoRegistry(entries), /Invalid demo paths/);
    }
    const entries = structuredClone(DEMO_CASES);
    entries[0].templates[0].preview.image = '../outside.jpg';
    assert.throws(() => validateDemoRegistry(entries), /Invalid demo preview/);
});

test('expands templates with one content source and independent destinations', () => {
    assert.equal(DEMO_CASES.length, 6);
    assert.equal(DEMO_REGISTRY.length, DEMO_CASES.reduce((count, item) => count + item.templates.length, 0));
    for (const item of DEMO_CASES) {
        const variants = DEMO_REGISTRY.filter(demo => demo.caseId === item.id);
        assert.equal(new Set(variants.map(demo => demo.source)).size, 1);
        assert.equal(variants.find(demo => demo.templateId === 'classic').path, `demos/${item.id}/`);
        for (const demo of variants) {
            assert.deepEqual(demo.checks.pages, item.checks.pages);
            assert.ok(item.checks.assets.every(asset => demo.checks.assets.includes(asset)));
        }
    }
});

test('rejects conflicting templates, ambiguous defaults, and nested destinations', () => {
    for (const mutate of [
        entries => { entries[0].templates[1].id = 'classic'; },
        entries => { entries[0].defaultTemplate = 'missing'; },
        entries => { entries[0].templates[1].path = `${entries[0].templates[0].path}alternate/`; },
        entries => { entries[0].templates[1].assets = ['../escape.css']; },
        entries => { entries[0].templates[1].path = 'demos/%2e%2e/'; },
    ]) {
        const entries = structuredClone(DEMO_CASES);
        mutate(entries);
        assert.throws(() => expandDemoRegistry(entries));
    }
});

test('Python checks receive exact sibling page allowances with the deployment prefix', () => {
    const demo = DEMO_REGISTRY.find(item => item.id === 'photo-portfolio-gallery');
    const args = checkerArgs(demo, projectRoot, 'https://example.test/review/');
    assert.equal(args[args.indexOf('--base-url') + 1], 'https://example.test/review/demos/variants/photo-portfolio/gallery/');
    const allowed = args.flatMap((value, index) => value === '--template-url' ? [args[index + 1]] : []);
    assert.equal(allowed.length, demo.checks.pages.length * demo.siblings.length);
    assert.ok(allowed.includes('/review/demos/photo-portfolio/works/rain-street/'));
    assert.ok(allowed.includes('/review/demos/variants/photo-portfolio/gallery/about/'));
    assert.ok(allowed.includes('/review/demos/variants/photo-portfolio/filmstrip/works/rain-street/'));
    assert.ok(!allowed.includes('/review/'));
});
