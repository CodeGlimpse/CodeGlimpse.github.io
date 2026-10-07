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

for (const directory of ['contentDir', 'dataDir']) test(`rejects template ${directory} paths that escape the source tree`, () => {
    for (const value of ['', null, '../escape', '/absolute', 'C:/absolute', 'folder/../../escape', 'content\\portrait', './content', 'content/%2e%2e', 'content\u0000', 'content/.. /escape', 'content.', 'content/*', 'content\u007f']) {
        const entries = structuredClone(DEMO_CASES);
        entries[0].templates[0][directory] = value;
        assert.throws(() => validateDemoRegistry(entries), new RegExp(`Invalid template ${directory}`));
    }
});

test('expands templates with independent content checks and destinations', () => {
    assert.equal(DEMO_CASES.length, 6);
    assert.equal(DEMO_REGISTRY.length, DEMO_CASES.reduce((count, item) => count + item.templates.length, 0));
    for (const item of DEMO_CASES) {
        const variants = DEMO_REGISTRY.filter(demo => demo.caseId === item.id);
        assert.equal(new Set(variants.map(demo => demo.source)).size, 1);
        assert.equal(variants.find(demo => demo.templateId === 'classic').path, `demos/${item.id}/`);
        for (const demo of variants) {
            const template = item.templates.find(template => template.id === demo.templateId);
            assert.equal(demo.contentDir, template.contentDir);
            assert.equal(demo.dataDir, template.dataDir);
            assert.equal(demo.differentContent, item.differentContent === true);
            assert.deepEqual(demo.checks.pages, template.checks?.pages || item.checks.pages);
            assert.ok((template.checks?.assets || item.checks.assets).every(asset => demo.checks.assets.includes(asset)));
        }
    }
});

test('merges validated template checks without retaining replaced case assets', () => {
    const entries = structuredClone(DEMO_CASES);
    const item = entries[0];
    item.differentContent = true;
    delete item.templates[0].checks;
    const template = item.templates[1];
    template.contentDir = 'content/portraits';
    template.checks = {
        pages: ['', 'portraits/'],
        navigation: ['portraits/'],
        requiredText: ['摄影作品演示'],
        assets: ['css/portraits.css'],
    };
    const expanded = expandDemoRegistry(entries);
    const demo = expanded.find(demo => demo.caseId === item.id && demo.templateId === template.id);
    assert.equal(demo.contentDir, 'content/portraits');
    assert.equal(demo.differentContent, true);
    assert.deepEqual(demo.checks.pages, ['', 'portraits/']);
    assert.deepEqual(demo.checks.navigation, ['portraits/']);
    assert.deepEqual(demo.checks.requiredText, ['摄影作品演示']);
    assert.deepEqual(demo.checks.assets, [...new Set(['css/portraits.css', ...template.assets])]);
    assert.ok(!demo.checks.assets.includes(item.checks.assets[0]));
    assert.deepEqual(demo.siblings.find(sibling => sibling.id === template.id).pages, ['', 'portraits/']);
    const classic = expanded.find(demo => demo.caseId === item.id && demo.templateId === item.defaultTemplate);
    assert.deepEqual(classic.checks.pages, item.checks.pages);
    assert.deepEqual(classic.checks.requiredText, item.checks.requiredText);
});

test('validates partial template checks with the case homepage contract', () => {
    const entries = structuredClone(DEMO_CASES);
    entries[0].templates[0].checks = { requiredText: ['New disclosure'] };
    assert.doesNotThrow(() => validateDemoRegistry(entries));
    for (const checks of [
        null, [], { unknown: [] }, { pages: ['works/'] }, { pages: ['', '../escape/'] },
        { navigation: ['missing/'] }, { assets: ['../escape.css'] }, { requiredText: [] },
        { requiredText: [''] }, { requiredText: [42] },
    ]) {
        const invalid = structuredClone(DEMO_CASES);
        invalid[0].templates[0].checks = checks;
        assert.throws(() => validateDemoRegistry(invalid));
    }
    entries[0].differentContent = 'true';
    assert.throws(() => validateDemoRegistry(entries), /Invalid differentContent/);
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
    const entries = structuredClone(DEMO_CASES);
    entries.find(item => item.id === 'creator-portfolio').differentContent = false;
    const demo = expandDemoRegistry(entries).find(item => item.id === 'creator-portfolio-editorial');
    const args = checkerArgs(demo, projectRoot, 'https://example.test/review/');
    assert.equal(args[args.indexOf('--base-url') + 1], 'https://example.test/review/demos/variants/creator-portfolio/editorial/');
    const allowed = args.flatMap((value, index) => value === '--template-url' ? [args[index + 1]] : []);
    assert.equal(allowed.length, demo.checks.pages.length * demo.siblings.length);
    assert.ok(allowed.includes('/review/demos/creator-portfolio/works/window-light/'));
    assert.ok(allowed.includes('/review/demos/variants/creator-portfolio/editorial/projects/'));
    assert.ok(allowed.includes('/review/demos/variants/creator-portfolio/archive/projects/leaf-atlas/'));
    assert.ok(!allowed.includes('/review/'));
});

test('independent photography content permits only exact sibling homepages', () => {
    const entries = structuredClone(DEMO_CASES);
    const photo = entries.find(item => item.id === 'photo-portfolio');
    photo.differentContent = true;
    photo.templates[1].checks = { ...photo.templates[1].checks, pages: ['', 'works/', 'works/nature-detail/', 'about/'] };
    const demo = expandDemoRegistry(entries).find(item => item.id === 'photo-portfolio-gallery');
    const args = checkerArgs(demo, projectRoot, 'https://example.test/review/');
    const allowed = args.flatMap((value, index) => value === '--template-url' ? [args[index + 1]] : []);
    assert.deepEqual(allowed, demo.siblings.map(sibling => `/review/${sibling.path}`));
    assert.ok(!allowed.some(url => url.endsWith('works/nature-detail/')));
});

test('shared-content allowances use the sibling actual page list', () => {
    const entries = structuredClone(DEMO_CASES);
    const item = entries[0];
    item.differentContent = false;
    item.templates[1].checks = { pages: ['', ...item.checks.navigation, 'works/sibling-only/'] };
    const demo = expandDemoRegistry(entries).find(demo => demo.caseId === item.id && demo.templateId === item.defaultTemplate);
    const args = checkerArgs(demo, projectRoot, 'https://example.test/review/');
    const allowed = args.flatMap((value, index) => value === '--template-url' ? [args[index + 1]] : []);
    const siblingPrefix = `/review/${item.templates[1].path}`;
    assert.ok(allowed.includes(`${siblingPrefix}works/sibling-only/`));
    assert.ok(!allowed.includes(`${siblingPrefix}works/window-light/`));
});
