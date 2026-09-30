const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const checkerPath = path.resolve(__dirname, '..', 'demos', 'photo-portfolio', 'scripts', 'check_build.py');
const fixtureParent = process.env.TEST_TMP_ROOT
    ? path.resolve(process.env.TEST_TMP_ROOT)
    : process.platform === 'win32' ? path.resolve(__dirname, '..', '..', 'temp') : path.resolve(os.tmpdir());
const baseUrl = 'https://example.github.io/client-portfolio/';
const prefix = new URL(baseUrl).pathname;

function writeFixture(root, relativeFile, content) {
    const filePath = path.join(root, relativeFile);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function html(body) {
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>Portfolio</title><link rel="stylesheet" href="${prefix}css/site.css"></head><body><main>${body}</main></body></html>`;
}

function createSiteFixture(t, options = {}) {
    fs.mkdirSync(fixtureParent, { recursive: true });
    const root = fs.mkdtempSync(path.join(fixtureParent, 'codeglimpse-photo-check-'));
    t.after(() => {
        assert.equal(path.dirname(root), fixtureParent);
        fs.rmSync(root, { recursive: true, force: true });
    });

    const slug = options.demo ? 'rain-street' : 'morning-room';
    const homeText = options.homeText ?? (options.demo ? '虚构演示 · AI 生成' : '晨间摄影作品集');
    writeFixture(root, 'css/site.css', '.portfolio { display: block; }');
    writeFixture(root, 'index.html', html(`<h1>${homeText}</h1><a href="${prefix}works/">作品</a><a href="${prefix}about/">关于</a>`));
    writeFixture(root, 'works/index.html', html(`<a href="${prefix}works/${slug}/"><img src="${prefix}previews/${slug}.jpg" alt="作品预览"></a>`));
    writeFixture(root, 'about/index.html', html(`<p>摄影师介绍</p><a href="${prefix}">首页</a>`));
    writeFixture(root, `works/${slug}/index.html`, html(`<picture><source type="image/jpeg" srcset="${prefix}images/small.jpg 640w, ${prefix}images/large.jpg 1440w"><img src="${prefix}works/${slug}/photo.jpg" alt="晨光中的房间"></picture>`));
    writeFixture(root, `works/${slug}/photo.jpg`, 'original image fixture');
    writeFixture(root, `previews/${slug}.jpg`, 'preview fixture');
    writeFixture(root, 'images/small.jpg', 'small image fixture');
    if (options.includeLargeImage !== false) writeFixture(root, 'images/large.jpg', 'large image fixture');
    if (options.demo && options.includeDemoCover !== false) writeFixture(root, 'works/rain-street/cover.png', 'demo integration image fixture');
    return root;
}

function runChecker(root, args = []) {
    const commands = process.env.PYTHON
        ? [process.env.PYTHON]
        : process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python'];
    for (const command of commands) {
        const result = spawnSync(command, ['-B', '-X', 'utf8', checkerPath, root, '--base-url', baseUrl, ...args], {
            encoding: 'utf8',
            windowsHide: true,
            timeout: 10000,
        });
        if (result.error?.code === 'ENOENT') continue;
        assert.ifError(result.error);
        return result;
    }
    throw new Error('Python 3 is required to run the photography checker tests');
}

test('accepts customer content after all demo examples are replaced', (t) => {
    const root = createSiteFixture(t);
    const result = runChecker(root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('demo mode rejects missing fictional and AI disclosures', (t) => {
    const root = createSiteFixture(t, { demo: true, homeText: '摄影作品集' });
    const result = runChecker(root, ['--check-demo-pages']);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /home page missing disclosure: 虚构演示/);
    assert.match(result.stdout, /home page missing disclosure: AI 生成/);
});

test('demo mode requires the original image used by the blog', (t) => {
    const root = createSiteFixture(t, { demo: true, includeDemoCover: false });
    const result = runChecker(root, ['--check-demo-pages']);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /missing original rain-street cover for blog integration/);
});

for (const demo of [false, true]) {
    test(`${demo ? 'demo' : 'customer'} mode rejects missing source srcset images`, (t) => {
        const root = createSiteFixture(t, { demo, includeLargeImage: false });
        const result = runChecker(root, demo ? ['--check-demo-pages'] : []);
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.match(result.stdout, /missing local target: \/client-portfolio\/images\/large\.jpg/);
    });
}

test('accepts the demo with its disclosures, original image, and srcset targets', (t) => {
    const root = createSiteFixture(t, { demo: true });
    const result = runChecker(root, ['--check-demo-pages']);
    assert.equal(result.status, 0, result.stdout + result.stderr);
});
