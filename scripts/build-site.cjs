const { spawnSync } = require('node:child_process');

function resolveSourceCommit(environment = process.env) {
    const configured = String(environment.HUGO_PARAMS_SOURCECOMMIT || '').trim();
    if (/^[a-f0-9]{40}$/i.test(configured)) return configured.toLowerCase();

    const result = spawnSync('git', ['rev-parse', 'HEAD'], {
        encoding: 'utf8',
        windowsHide: true,
    });
    const commit = String(result.stdout || '').trim();
    if (result.status !== 0 || !/^[a-f0-9]{40}$/i.test(commit)) {
        throw new Error('Unable to resolve a 40-character source commit for the site build');
    }
    return commit.toLowerCase();
}

function buildSite(args = process.argv.slice(2), environment = process.env) {
    const sourceCommit = resolveSourceCommit(environment);
    const hugoArgs = ['--cleanDestinationDir', '--minify', '--gc', ...args];
    const result = spawnSync('hugo', hugoArgs, {
        env: { ...environment, HUGO_PARAMS_SOURCECOMMIT: sourceCommit },
        stdio: 'inherit',
        windowsHide: true,
    });
    if (result.error) throw result.error;
    return result.status ?? 1;
}

if (require.main === module) {
    try {
        process.exitCode = buildSite();
    } catch (error) {
        console.error(`Site build failed: ${error.message}`);
        process.exitCode = 1;
    }
}

module.exports = { buildSite, resolveSourceCommit };
