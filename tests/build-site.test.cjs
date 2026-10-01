const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildSite, resolveSourceCommit, configurationArgs } = require('../scripts/build-site.cjs');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');
const projectRoot = path.resolve(__dirname, '..');
const environment = { HUGO_PARAMS_SOURCECOMMIT: 'a'.repeat(40) };

function fakeHugo(config = {}, failureAt = -1) {
    const calls = [];
    return {
        calls,
        run(command, args, options) {
            calls.push({ command, args, options });
            if (calls.length === failureAt) return { status: 1, stderr: 'fixture failure' };
            if (args[0] === 'config') return {
                status: 0,
                stdout: JSON.stringify({ baseurl: 'https://example.test/', publishdir: 'public', workingdir: projectRoot, ...config }),
            };
            return { status: 0 };
        },
    };
}

test('uses an explicit source commit for reproducible deployment markers', () => {
    const commit = 'ABCDEF0123456789ABCDEF0123456789ABCDEF01';
    assert.equal(resolveSourceCommit({ HUGO_PARAMS_SOURCECOMMIT: commit }), commit.toLowerCase());
});

test('passes configuration overrides to Hugo without build-only flags', () => {
    assert.deepEqual(configurationArgs([
        '--minify', '--destination', 'folder with spaces', '--baseURL=https://example.test/review/',
        '-e', 'staging', '--config', 'custom.toml', '--configDir=config-review', '--panicOnWarning',
        '-dpublic-alt', '-bhttps://example.test/short/', '-s', 'other-source',
    ]), [
        '--destination', 'folder with spaces', '--baseURL=https://example.test/review/',
        '-e', 'staging', '--config', 'custom.toml', '--configDir=config-review',
        '-dpublic-alt', '-bhttps://example.test/short/', '-s', 'other-source',
    ]);
    assert.deepEqual(configurationArgs(['-d=out', '-b', 'https://example.test/', '--gc']), ['-d=out', '-b', 'https://example.test/']);
    assert.throws(() => configurationArgs(['--destination']), /Missing value/);
});

test('builds every registered demo inside the merged output directory and URL prefix', () => {
    const output = path.join(projectRoot, 'temp', 'review output');
    const fake = fakeHugo({ publishdir: output, baseurl: 'https://preview.example.test/review' });
    const args = ['--destination', output, '--baseURL', 'https://preview.example.test/review'];
    assert.equal(buildSite(args, environment, fake.run), 0);
    assert.equal(fake.calls.length, 2 + DEMO_REGISTRY.length);
    assert.deepEqual(fake.calls[0].args, ['config', '--format', 'json', ...args]);
    assert.deepEqual(fake.calls[1].args, ['--cleanDestinationDir', '--minify', '--gc', ...args]);
    for (const [index, demo] of DEMO_REGISTRY.entries()) {
        const call = fake.calls[index + 2];
        assert.equal(call.args[call.args.indexOf('--destination') + 1], path.join(output, demo.path));
        assert.equal(call.args[call.args.indexOf('--baseURL') + 1], `https://preview.example.test/review/${demo.path}`);
        assert.equal(call.options.cwd, path.join(projectRoot, demo.source));
        assert.equal(call.options.env.HUGO_PARAMS_DEMOCATALOGURL, '/review/demos/');
        assert.equal(call.options.env.HUGO_PARAMS_DEMOTEMPLATE, demo.templateId);
        const templates = JSON.parse(call.options.env.HUGO_PARAMS_DEMOTEMPLATES);
        assert.deepEqual(templates.map(item => item.url), demo.siblings.map(item => `/review/${item.path}`));
    }
});

test('uses Hugo-resolved environment and config values without CLI overrides', () => {
    const source = path.join(projectRoot, 'alternate-source');
    const fake = fakeHugo({ workingdir: source, publishdir: 'site-output', baseurl: 'https://config.example.test/nested/' });
    const env = { ...environment, HUGO_PUBLISHDIR: 'site-output', HUGO_BASEURL: 'https://config.example.test/nested/' };
    assert.equal(buildSite([], env, fake.run), 0);
    assert.equal(fake.calls[0].options.env, env);
    assert.equal(fake.calls[2].options.cwd, path.join(source, DEMO_REGISTRY[0].source));
    for (const [index, demo] of DEMO_REGISTRY.entries()) {
        const child = fake.calls[index + 2].options.env;
        assert.equal(child.HUGO_PUBLISHDIR, path.join(source, 'site-output', demo.path));
        assert.equal(child.HUGO_BASEURL, `https://config.example.test/nested/${demo.path}`);
        assert.equal(child.HUGO_PARAMS_DEMOCATALOGURL, '/nested/demos/');
        assert.equal(child.HUGO_PARAMS_SOURCECOMMIT, environment.HUGO_PARAMS_SOURCECOMMIT);
    }
});

test('does not pass differently cased parent output overrides into demos', () => {
    const fake = fakeHugo();
    const env = { ...environment, hugo_baseurl: 'https://parent.test/', hugo_publishdir: 'parent-output', hugo_params_democatalogurl: '/stale/', hugo_params_demotemplate: 'stale', hugo_params_demotemplates: 'stale' };
    assert.equal(buildSite([], env, fake.run), 0);
    const child = fake.calls[2].options.env;
    assert.equal(child.hugo_baseurl, undefined);
    assert.equal(child.hugo_publishdir, undefined);
    assert.equal(child.hugo_params_democatalogurl, undefined);
    assert.equal(child.hugo_params_demotemplate, undefined);
    assert.equal(child.hugo_params_demotemplates, undefined);
    assert.equal(child.HUGO_BASEURL, `https://example.test/${DEMO_REGISTRY[0].path}`);
    assert.equal(child.HUGO_PUBLISHDIR, path.join(projectRoot, 'public', DEMO_REGISTRY[0].path));
    assert.equal(child.HUGO_PARAMS_DEMOCATALOGURL, '/demos/');
});

test('stops before publishing later demos when a preceding build fails', () => {
    for (let failureAt = 2; failureAt <= 2 + DEMO_REGISTRY.length; failureAt += 1) {
        const fake = fakeHugo({}, failureAt);
        assert.equal(buildSite([], environment, fake.run), 1);
        assert.equal(fake.calls.length, failureAt);
    }
    const fake = fakeHugo({}, 1);
    assert.throws(() => buildSite([], environment, fake.run), /Unable to resolve Hugo configuration/);
    assert.equal(fake.calls.length, 1);
});
