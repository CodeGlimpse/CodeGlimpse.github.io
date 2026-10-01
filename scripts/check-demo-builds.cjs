const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const { DEMO_REGISTRY, templateLinks } = require('./demo-registry.cjs');
const projectRoot = path.resolve(__dirname, '..');

function checkerArgs(demo, outputRoot, baseURL) {
    return [
        '-B', '-X', 'utf8', path.join(projectRoot, demo.source, 'scripts/check_build.py'),
        path.join(outputRoot, demo.path), '--base-url', new URL(demo.path, baseURL).href,
        '--check-demo-pages', '--catalog-url', new URL('demos/', baseURL).pathname,
        ...templateLinks(demo, baseURL).flatMap(template => demo.checks.pages.flatMap(page => ['--template-url', template.url + page])),
    ];
}

function checkDemoBuilds(environment = process.env, run = spawnSync) {
    const outputRoot = path.resolve(environment.SITE_ROOT || path.join(projectRoot, 'public'));
    const baseURL = new URL((environment.SITE_URL || 'https://blog.codeglimpse.top/').replace(/\/+$/, '') + '/');
    if (!['http:', 'https:'].includes(baseURL.protocol) || baseURL.search || baseURL.hash) throw new Error('SITE_URL must be an HTTP(S) directory URL');
    const commands = environment.PYTHON ? [environment.PYTHON] : process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python'];
    for (const demo of DEMO_REGISTRY) {
        // Resolve every switch destination in the combined artifact before permitting it.
        for (const sibling of demo.siblings) for (const page of demo.checks.pages) {
            const file = path.join(outputRoot, sibling.path, page, 'index.html');
            if (!fs.existsSync(file)) throw new Error(`Missing template destination: ${sibling.path}${page}`);
        }
        let result;
        for (const command of commands) {
            result = run(command, checkerArgs(demo, outputRoot, baseURL), { cwd: projectRoot, env: environment, stdio: 'inherit', windowsHide: true });
            if (result.error?.code !== 'ENOENT') break;
        }
        if (result.error) throw result.error;
        if (result.status !== 0) return result.status ?? 1;
    }
    return 0;
}

if (require.main === module) {
    try { process.exitCode = checkDemoBuilds(); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { checkerArgs, checkDemoBuilds };
