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
const sourceLink = '<a data-photo-source href="https://example.test/photos/morning-room">作者与原始作品</a>';
const licenseLink = '<a data-photo-license href="https://example.test/licenses/by-4.0">许可说明</a>';
const photoCredits = sourceLink + licenseLink;

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

    const slug = 'morning-room';
    const homeText = options.homeText ?? (options.demo ? '摄影专题演示 · 真实摄影作品' : '晨间摄影作品集');
    const credits = options.creditMarkup ?? (options.demo ? photoCredits : '');
    writeFixture(root, 'css/site.css', '.portfolio { display: block; }');
    writeFixture(root, 'index.html', html(`<h1>${homeText}</h1><a href="${prefix}works/">作品</a><a href="${prefix}about/">关于</a>${options.extraMarkup || ''}`));
    writeFixture(root, 'works/index.html', html(`<a href="${prefix}works/${slug}/"><img src="${prefix}previews/${slug}.jpg" alt="作品预览"></a>`));
    writeFixture(root, 'about/index.html', html(`<p>摄影师介绍</p><a href="${prefix}">首页</a>`));
    writeFixture(root, `works/${slug}/index.html`, html(`<picture><source type="image/jpeg" srcset="${prefix}images/small.jpg 640w, ${prefix}images/large.jpg 1440w"><img src="${prefix}works/${slug}/photo.jpg" alt="晨光中的房间"></picture>${credits}`));
    writeFixture(root, `works/${slug}/photo.jpg`, 'original image fixture');
    writeFixture(root, `previews/${slug}.jpg`, 'preview fixture');
    writeFixture(root, 'images/small.jpg', 'small image fixture');
    if (options.includeLargeImage !== false) writeFixture(root, 'images/large.jpg', 'large image fixture');
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

test('demo mode rejects missing photography disclosures', (t) => {
    const root = createSiteFixture(t, { demo: true, homeText: '摄影作品集' });
    const result = runChecker(root, ['--check-demo-pages']);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /home page missing disclosure: 摄影专题演示/);
    assert.match(result.stdout, /home page missing disclosure: 真实摄影作品/);
});

for (const [label, markup] of [['source', licenseLink], ['license', sourceLink]]) {
    test(`demo mode rejects a missing marked photo ${label} link`, (t) => {
        const root = createSiteFixture(t, { demo: true, creditMarkup: markup });
        const result = runChecker(root, ['--check-demo-pages']);
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.match(result.stdout, new RegExp(`missing photo ${label} link \\(data-photo-${label}\\)`));
    });
}

test('demo mode requires source and licence links on every work detail', (t) => {
    const root = createSiteFixture(t, { demo: true });
    writeFixture(root, 'works/second-study/index.html', html(`<img src="${prefix}works/morning-room/photo.jpg" alt="第二幅摄影作品">${sourceLink}`));
    writeFixture(root, 'previews/second-study.jpg', 'second preview fixture');
    const result = runChecker(root, ['--check-demo-pages']);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /second-study[\\/]index\.html: missing photo license link/);
});

for (const [label, otherLink] of [['source', licenseLink], ['license', sourceLink]]) {
    test(`demo mode requires the marked photo ${label} href to be a non-empty HTTPS URL`, (t) => {
        for (const href of [null, '', 'http://example.test/photo', '//example.test/photo', '/client-portfolio/',
            'javascript:alert(1)', 'https://', 'https://example.test/white space', 'https://example.test\\photo',
            'https://example.test:not-a-port/photo', 'https://[invalid/photo']) {
            const attribute = href === null ? '' : ` href="${href}"`;
            const root = createSiteFixture(t, { demo: true, creditMarkup: `<a data-photo-${label}${attribute}>作品来源</a>${otherLink}` });
            const result = runChecker(root, ['--check-demo-pages']);
            assert.equal(result.status, 1, `${JSON.stringify(href)}: ${result.stdout}${result.stderr}`);
            assert.match(result.stdout, new RegExp(`photo ${label} link \\(data-photo-${label}\\) must use a non-empty HTTPS URL`));
        }
    });
}

test('demo mode does not accept unmarked links, non-anchor markers or an invalid duplicate source', (t) => {
    for (const markup of [
        photoCredits.replace('data-photo-source', 'data-unmarked-source'),
        `<span data-photo-source>作品作者</span>${licenseLink}`,
        `${photoCredits}<a data-photo-source href="http://example.test/untrusted">其他来源</a>`,
    ]) {
        const root = createSiteFixture(t, { demo: true, creditMarkup: markup });
        const result = runChecker(root, ['--check-demo-pages']);
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.match(result.stdout, /photo source link/);
    }
});

for (const demo of [false, true]) {
    test(`${demo ? 'demo' : 'customer'} mode rejects missing source srcset images`, (t) => {
        const root = createSiteFixture(t, { demo, includeLargeImage: false });
        const result = runChecker(root, demo ? ['--check-demo-pages'] : []);
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.match(result.stdout, /missing local target: \/client-portfolio\/images\/large\.jpg/);
    });
}

test('accepts the demo with photography disclosures, HTTPS attribution and srcset targets', (t) => {
    const root = createSiteFixture(t, { demo: true });
    const result = runChecker(root, ['--check-demo-pages']);
    assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('a configured catalog return link does not bypass responsive image checks', (t) => {
    const root = createSiteFixture(t, {
        demo: true,
        includeLargeImage: false,
        extraMarkup: '<a data-demo-catalog href="/demos/">返回目录</a>',
    });
    const result = runChecker(root, ['--check-demo-pages', '--catalog-url', '/demos/']);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /missing local target: \/client-portfolio\/images\/large\.jpg/);
    assert.doesNotMatch(result.stdout, /URL misses base path/);
});
