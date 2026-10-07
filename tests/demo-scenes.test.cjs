const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DEMO_CASES, DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');

const root = path.resolve(__dirname, '..');
const datasets = {
    'content-dashboard': ['entries.json', 'title'],
    bookstore: ['books.json', 'title'],
    'workshop-booking': ['schedule.json', 'title'],
    'trip-planner': ['places.json', 'name'],
};

for (const demoCase of DEMO_CASES.filter(item => item.id !== 'photo-portfolio')) {
    test(`${demoCase.id} retains its URLs and owns three independent content collections`, () => {
        const versions = DEMO_REGISTRY.filter(item => item.caseId === demoCase.id);
        assert.equal(versions.length, 3);
        assert.ok(versions.every(item => item.differentContent));
        assert.equal(new Set(versions.map(item => item.contentDir)).size, 3);
        const homePages = versions.map(item => fs.readFileSync(path.join(root, item.source, item.contentDir, '_index.md'), 'utf8'));
        assert.equal(new Set(homePages).size, 3, 'Scene homepages must have independently authored content');
        for (const item of versions) {
            assert.equal(item.path, item.templateId === 'classic' ? `demos/${item.caseId}/` : `demos/variants/${item.caseId}/${item.templateId}/`);
            if (item.templateId !== 'classic') {
                assert.ok(fs.existsSync(path.join(root, item.source, 'variants', item.templateId, 'config.toml')), 'Standalone scenes need a configuration overlay');
            }
        }
    });
}

for (const [caseId, [filename, label]] of Object.entries(datasets)) {
    test(`${caseId} scene datasets contain different authored records without title reuse`, () => {
        const versions = DEMO_REGISTRY.filter(item => item.caseId === caseId);
        assert.equal(new Set(versions.map(item => item.dataDir)).size, versions.length);
        const content = versions.map(item => JSON.parse(fs.readFileSync(path.join(root, item.source, item.dataDir, filename), 'utf8')));
        assert.equal(new Set(content.map(value => JSON.stringify(value))).size, versions.length);
        const collections = content.map(value => Array.isArray(value) ? value : value.courses);
        const seen = new Set();
        for (const collection of collections) {
            assert.ok(collection.length > 0);
            for (const record of collection) {
                assert.equal(typeof record[label], 'string');
                assert.ok(record[label].trim());
                assert.ok(!seen.has(record[label]), `Reused authored record: ${record[label]}`);
                seen.add(record[label]);
            }
        }
    });
}

test('creator scenes retain working legacy detail routes with distinct original media', () => {
    const versions = DEMO_REGISTRY.filter(item => item.caseId === 'creator-portfolio');
    const legacyRoutes = ['works/window-light/', 'works/paper-tide/', 'projects/rain-notes/', 'projects/leaf-atlas/'];
    for (const route of legacyRoutes) {
        const texts = [], covers = [];
        for (const item of versions) {
            assert.ok(item.checks.pages.includes(route));
            const bundle = path.join(root, item.source, item.contentDir, route);
            texts.push(fs.readFileSync(path.join(bundle, 'index.md'), 'utf8'));
            covers.push(fs.readFileSync(path.join(bundle, 'cover.svg'), 'utf8'));
        }
        assert.equal(new Set(texts).size, versions.length, `${route}: reused content`);
        assert.equal(new Set(covers).size, versions.length, `${route}: reused artwork`);
    }
});
