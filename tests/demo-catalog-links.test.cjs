const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { DEMO_CASES } = require('../scripts/demo-registry.cjs');

const fixtureParent = process.env.TEST_TMP_ROOT
    ? path.resolve(process.env.TEST_TMP_ROOT)
    : process.platform === 'win32' ? path.resolve(__dirname, '..', '..', 'temp') : path.resolve(os.tmpdir());
const baseUrl = 'https://example.test/review/demos/client-portfolio/';
const prefix = new URL(baseUrl).pathname;
const catalogUrl = '/review/demos/';
const catalogLink = `<a data-demo-catalog href="${catalogUrl}">返回目录</a>`;

function writeFixture(root, relativeFile, content) {
    const filePath = path.join(root, relativeFile);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function createFixture(t, markup) {
    fs.mkdirSync(fixtureParent, { recursive: true });
    const root = fs.mkdtempSync(path.join(fixtureParent, 'codeglimpse-catalog-check-'));
    t.after(() => {
        assert.equal(path.dirname(root), fixtureParent);
        fs.rmSync(root, { recursive: true, force: true });
    });
    const output = path.join(root, 'site');
    const html = (body) => `<!doctype html><html><head><title>Portfolio</title><link rel="stylesheet" href="${prefix}css/site.css"></head><body><main>${body}</main></body></html>`;
    writeFixture(root, 'index.html', html('Parent catalog'));
    writeFixture(output, 'index.html', html(`<a href="${prefix}works/">作品</a>${markup}`));
    writeFixture(output, 'works/index.html', html(`<a href="${prefix}works/morning-room/">作品详情</a>`));
    writeFixture(output, 'about/index.html', html('摄影师介绍'));
    writeFixture(output, 'works/morning-room/index.html', html(`<img src="${prefix}images/cover.jpg" alt="晨光中的房间">`));
    writeFixture(output, 'css/site.css', '.portfolio { display: block; }');
    writeFixture(output, 'images/cover.jpg', 'original image fixture');
    writeFixture(output, 'previews/morning-room.jpg', 'preview fixture');
    return output;
}

function runChecker(demoId, output, args = []) {
    const script = path.resolve(__dirname, '..', 'demos', demoId, 'scripts', 'check_build.py');
    const commands = process.env.PYTHON
        ? [process.env.PYTHON]
        : process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python'];
    for (const command of commands) {
        const result = spawnSync(command, ['-B', '-X', 'utf8', script, output, '--base-url', baseUrl, ...args], {
            encoding: 'utf8',
            windowsHide: true,
            timeout: 10000,
        });
        if (result.error?.code === 'ENOENT') continue;
        assert.ifError(result.error);
        return result;
    }
    throw new Error('Python 3 is required to run the demo catalog checker tests');
}

test('workshop demo mode still requires the original catalog label', (t) => {
    const output = createFixture(t, catalogLink);
    const generic = runChecker('workshop-booking', output, ['--catalog-url', catalogUrl]);
    assert.equal(generic.status, 0, generic.stdout + generic.stderr);
    const demo = runChecker('workshop-booking', output, ['--catalog-url', catalogUrl, '--check-demo-pages']);
    assert.equal(demo.status, 1, demo.stdout + demo.stderr);
    assert.match(demo.stdout, /catalog anchor must say ← 返回演示目录/);
});

for (const { id: demoId } of DEMO_CASES) {
    test(`${demoId} rejects a marked parent catalog link without an explicit allowance`, (t) => {
        const output = createFixture(t, catalogLink);
        const result = runChecker(demoId, output);
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.match(result.stdout, /(?:site prefix|base path)/);
    });

    test(`${demoId} permits only the explicitly configured catalog anchor`, (t) => {
        const output = createFixture(t, catalogLink);
        const result = runChecker(demoId, output, ['--catalog-url', catalogUrl]);
        assert.equal(result.status, 0, result.stdout + result.stderr);
    });

    for (const scenario of [
        { name: 'unmarked parent anchors', markup: `<a href="${catalogUrl}">目录</a>`, error: /(?:site prefix|base path)/ },
        { name: 'image sources', markup: `${catalogLink}<img data-demo-catalog src="${catalogUrl}" alt="目录">`, error: /(?:site prefix|base path)/ },
        { name: 'anchor source attributes', markup: `<a data-demo-catalog href="${catalogUrl}" src="${catalogUrl}">目录</a>`, error: /(?:site prefix|base path)/ },
        { name: 'other marked parent paths', markup: '<a data-demo-catalog href="/review/">上一级</a>', error: /catalog link must point to/ },
        { name: 'catalog links with a query', markup: `<a data-demo-catalog href="${catalogUrl}?preview=1">目录</a>`, error: /catalog link must point to/ },
        { name: 'existing relative parent files', markup: `${catalogLink}<a href="../index.html">父目录文件</a>`, error: /local target escapes site output/ },
    ]) {
        test(`${demoId} does not exempt ${scenario.name}`, (t) => {
            const output = createFixture(t, scenario.markup);
            const result = runChecker(demoId, output, ['--catalog-url', catalogUrl]);
            assert.equal(result.status, 1, result.stdout + result.stderr);
            assert.match(result.stdout, scenario.error);
        });
    }
}
