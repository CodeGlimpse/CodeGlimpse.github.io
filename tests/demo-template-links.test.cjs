const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { DEMO_CASES } = require('../scripts/demo-registry.cjs');

const projectRoot = path.resolve(__dirname, '..');
const fixtureParent = process.env.TEST_TMP_ROOT
    ? path.resolve(process.env.TEST_TMP_ROOT)
    : process.platform === 'win32' ? path.resolve(projectRoot, '..', 'temp') : path.resolve(os.tmpdir());
const baseUrl = 'https://example.test/review/demos/client-portfolio/';
const prefix = new URL(baseUrl).pathname;
const templateUrl = '/review/demos/variants/client-portfolio/gallery/';
const secondTemplateUrl = '/review/demos/variants/client-portfolio/editorial/';
const catalogUrl = '/review/demos/';
const templateLink = `<a data-demo-template href="${templateUrl}">画廊模板</a>`;
const allowedArgs = ['--template-url', templateUrl];

function writeFixture(root, relativeFile, content) {
    const filePath = path.join(root, relativeFile);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

function createFixture(t, markup) {
    fs.mkdirSync(fixtureParent, { recursive: true });
    const root = fs.mkdtempSync(path.join(fixtureParent, 'codeglimpse-template-check-'));
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

function runChecker(demo, output, args = []) {
    const script = path.resolve(projectRoot, demo.source, 'scripts', 'check_build.py');
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
    throw new Error('Python 3 is required to run the demo template checker tests');
}

for (const demo of DEMO_CASES) {
    test(`${demo.id} permits repeatable exact marked template anchors`, (t) => {
        const output = createFixture(t, `${templateLink}<a data-demo-template href="${secondTemplateUrl}">杂志模板</a>`);
        const result = runChecker(demo, output, [...allowedArgs, '--template-url', secondTemplateUrl]);
        assert.equal(result.status, 0, result.stdout + result.stderr);
    });

    test(`${demo.id} does not exempt marked external paths without an allowlist`, (t) => {
        const output = createFixture(t, templateLink);
        const result = runChecker(demo, output);
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.match(result.stdout, /(?:site prefix|base path)/);
    });

    test(`${demo.id} still validates marked local paths normally without an allowlist`, (t) => {
        const output = createFixture(t, `<a data-demo-template href="${prefix}works/">作品</a>`);
        const result = runChecker(demo, output);
        assert.equal(result.status, 0, result.stdout + result.stderr);
    });

    for (const scenario of [
        { name: 'unmarked anchors', markup: `<a href="${templateUrl}">模板</a>`, error: /(?:site prefix|base path)/ },
        { name: 'image sources', markup: `${templateLink}<img data-demo-template src="${templateUrl}" alt="模板">`, error: /(?:site prefix|base path)/ },
        { name: 'anchor source attributes', markup: `<a data-demo-template href="${templateUrl}" src="${templateUrl}">模板</a>`, error: /(?:site prefix|base path)/ },
        { name: 'different marked paths', markup: '<a data-demo-template href="/review/demos/other-template/">模板</a>', error: /template link must point to an allowed URL/ },
        { name: 'marked paths with queries', markup: `<a data-demo-template href="${templateUrl}?view=1">模板</a>`, error: /template link must point to an allowed URL/ },
        { name: 'marked paths with fragments', markup: `<a data-demo-template href="${templateUrl}#intro">模板</a>`, error: /template link must point to an allowed URL/ },
        { name: 'absolute marked URLs', markup: `<a data-demo-template href="https://example.test${templateUrl}">模板</a>`, error: /template link must point to an allowed URL/ },
        { name: 'empty marked hrefs', markup: '<a data-demo-template href="">模板</a>', error: /template link must point to an allowed URL/ },
    ]) {
        test(`${demo.id} does not exempt ${scenario.name}`, (t) => {
            const output = createFixture(t, scenario.markup);
            const result = runChecker(demo, output, allowedArgs);
            assert.equal(result.status, 1, result.stdout + result.stderr);
            assert.match(result.stdout, scenario.error);
        });
    }

    test(`${demo.id} retains catalog validation on anchors carrying both markers`, (t) => {
        const output = createFixture(t, `<a data-demo-template data-demo-catalog href="${templateUrl}">模板</a>`);
        const result = runChecker(demo, output, [...allowedArgs, '--catalog-url', catalogUrl]);
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.match(result.stdout, /catalog link must point to/);
    });

    test(`${demo.id} rejects unsafe template-url arguments before checking pages`, (t) => {
        const output = createFixture(t, 'Ordinary customer content');
        for (const value of [
            'https://example.test/templates/', '//example.test/templates/', 'relative/templates/',
            '/review/templates', '/review/templates/?view=1', '/review/templates/#intro',
            '/review/./templates/', '/review/../templates/', '/review/templates\\other/',
            '/review/%2e%2e/templates/', '/review/templates%2fother/', '/review/templates%5cother/',
            '/review/templates/%41/', '/review/templates/\t/', '/review/templates/\n/',
            '/review/templates/\x01/', '/review/templates/\x7f/', '/review/templates/\u0085/', '//[/templates/',
        ]) {
            const result = runChecker(demo, output, ['--template-url', value]);
            assert.equal(result.status, 2, `${JSON.stringify(value)}: ${result.stdout}${result.stderr}`);
            assert.match(result.stderr, /--template-url must be an exact root-relative directory path/);
        }
    });
}

test('photography checker does not exempt marked image srcset candidates', (t) => {
    const demo = DEMO_CASES.find((entry) => entry.id === 'photo-portfolio');
    const output = createFixture(t, `${templateLink}<img data-demo-template srcset="${templateUrl} 1x" alt="模板">`);
    const result = runChecker(demo, output, allowedArgs);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /base path/);
});
