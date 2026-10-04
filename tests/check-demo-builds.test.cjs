const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DEMO_CASES, expandDemoRegistry } = require('../scripts/demo-registry.cjs');
const { checkDemoBuilds } = require('../scripts/check-demo-builds.cjs');

const fixtureParent = process.env.TEST_TMP_ROOT
    ? path.resolve(process.env.TEST_TMP_ROOT)
    : process.platform === 'win32' ? path.resolve(__dirname, '..', '..', 'temp') : path.resolve(os.tmpdir());

function photographyRegistry(differentContent) {
    const photo = structuredClone(DEMO_CASES.find(demo => demo.id === 'photo-portfolio'));
    photo.differentContent = differentContent;
    for (const template of photo.templates) {
        template.checks = { ...template.checks, pages: ['', 'works/', 'about/', `works/${template.id}-only/`] };
    }
    return expandDemoRegistry([photo]);
}

function createOutput(t, registry, skip = () => false) {
    fs.mkdirSync(fixtureParent, { recursive: true });
    const output = fs.mkdtempSync(path.join(fixtureParent, 'codeglimpse-demo-build-check-'));
    t.after(() => {
        assert.equal(path.dirname(output), fixtureParent);
        fs.rmSync(output, { recursive: true, force: true });
    });
    for (const demo of registry) for (const page of demo.checks.pages) {
        if (skip(demo, page)) continue;
        const file = path.join(output, demo.path, page, 'index.html');
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, '<html><head><title>Fixture</title></head><body><main>Fixture</main></body></html>');
    }
    return output;
}

function fakeChecker() {
    const calls = [];
    return { calls, run(command, args) { calls.push({ command, args }); return { status: 0 }; } };
}

test('checks independent-content sibling homepages without requiring shared detail routes', (t) => {
    const registry = photographyRegistry(true);
    const output = createOutput(t, registry);
    const fake = fakeChecker();
    assert.equal(checkDemoBuilds({ SITE_ROOT: output, SITE_URL: 'https://example.test/review/', PYTHON: 'fixture-python' }, fake.run, registry), 0);
    assert.equal(fake.calls.length, registry.length);
    for (const [index, call] of fake.calls.entries()) {
        assert.equal(call.command, 'fixture-python');
        assert.equal(call.args[call.args.indexOf('--base-url') + 1], `https://example.test/review/${registry[index].path}`);
        const allowed = call.args.flatMap((value, index) => value === '--template-url' ? [call.args[index + 1]] : []);
        assert.deepEqual(allowed, registry.map(demo => `/review/${demo.path}`));
    }
});

test('requires each independent-content sibling homepage before permitting its URL', (t) => {
    const registry = photographyRegistry(true);
    const missing = registry[registry.length - 1];
    const output = createOutput(t, registry, (demo, page) => demo.id === missing.id && page === '');
    const fake = fakeChecker();
    assert.throws(() => checkDemoBuilds({ SITE_ROOT: output }, fake.run, registry), {
        message: `Missing template destination: ${missing.path}`,
    });
    assert.equal(fake.calls.length, 0);
});

test('shared-content checks require each sibling own registered page routes', (t) => {
    const registry = photographyRegistry(false);
    const fake = fakeChecker();
    const complete = createOutput(t, registry);
    assert.equal(checkDemoBuilds({ SITE_ROOT: complete }, fake.run, registry), 0);
    assert.equal(fake.calls.length, registry.length);
    const missing = registry[1];
    const route = `works/${missing.templateId}-only/`;
    const incomplete = createOutput(t, registry, (demo, page) => demo.id === missing.id && page === route);
    assert.throws(() => checkDemoBuilds({ SITE_ROOT: incomplete }, fake.run, registry), {
        message: `Missing template destination: ${missing.path}${route}`,
    });
    assert.equal(fake.calls.length, registry.length);
});
