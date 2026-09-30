const { spawnSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const demoIds = ['creator-portfolio', 'photo-portfolio'];
const configurationFlags = new Set([
    '--baseURL', '-b', '--destination', '-d', '--environment', '-e',
    '--config', '--configDir', '--source', '-s', '--theme', '-t', '--themesDir',
]);

function configurationArgs(args) {
    const selected = [];
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        const flag = arg.split('=', 1)[0];
        if (configurationFlags.has(flag)) {
            selected.push(arg);
            if (!arg.includes('=')) {
                if (args[index + 1] === undefined) throw new Error(`Missing value for ${flag}`);
                selected.push(args[++index]);
            }
        } else if (/^-[bdest].+/.test(arg)) {
            // Hugo also accepts attached short values such as -doutput and -bhttps://example.com/.
            if (configurationFlags.has(arg.slice(0, 2))) selected.push(arg);
        }
    }
    return selected;
}

function resolveBuildOptions(args, environment, run = spawnSync) {
    // Ask Hugo for the merged configuration so config files and HUGO_* overrides
    // have the same precedence as the actual blog build.
    const result = run('hugo', ['config', '--format', 'json', ...configurationArgs(args)], {
        cwd: projectRoot,
        env: environment,
        encoding: 'utf8',
        windowsHide: true,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Unable to resolve Hugo configuration: ${result.stderr || result.status}`);
    const config = JSON.parse(result.stdout);
    const baseURL = new URL(config.baseurl);
    baseURL.pathname = baseURL.pathname.replace(/\/+$/, '') + '/';
    baseURL.search = '';
    baseURL.hash = '';
    return {
        sourceRoot: path.resolve(config.workingdir || projectRoot),
        outputRoot: path.resolve(config.workingdir || projectRoot, config.publishdir || 'public'),
        baseURL,
    };
}

function resolveSourceCommit(environment = process.env) {
    const configured = String(environment.HUGO_PARAMS_SOURCECOMMIT || '').trim();
    if (/^[a-f0-9]{40}$/i.test(configured)) return configured.toLowerCase();

    const result = spawnSync('git', ['rev-parse', 'HEAD'], {
        cwd: projectRoot,
        encoding: 'utf8',
        windowsHide: true,
    });
    const commit = String(result.stdout || '').trim();
    if (result.status !== 0 || !/^[a-f0-9]{40}$/i.test(commit)) {
        throw new Error('Unable to resolve a 40-character source commit for the site build');
    }
    return commit.toLowerCase();
}

function buildSite(args = process.argv.slice(2), environment = process.env, run = spawnSync) {
    const sourceCommit = resolveSourceCommit(environment);
    const options = resolveBuildOptions(args, environment, run);
    const hugoArgs = ['--cleanDestinationDir', '--minify', '--gc', ...args];
    const result = run('hugo', hugoArgs, {
        cwd: projectRoot,
        env: { ...environment, HUGO_PARAMS_SOURCECOMMIT: sourceCommit },
        stdio: 'inherit',
        windowsHide: true,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) return result.status ?? 1;

    // Each demo keeps its own layouts and CSS, but belongs to the same artifact.
    for (const id of demoIds) {
        const baseURL = new URL(`demos/${id}/`, options.baseURL).toString();
        const destination = path.join(options.outputRoot, 'demos', id);
        // Hugo environment settings override CLI flags. Scope these values to
        // the child site, including differently cased keys on Windows.
        const demoEnvironment = Object.fromEntries(Object.entries(environment)
            .filter(([key]) => !['HUGO_BASEURL', 'HUGO_PUBLISHDIR'].includes(key.toUpperCase())));
        const demo = run('hugo', [
            '--cleanDestinationDir', '--minify', '--gc', '--panicOnWarning',
            '--baseURL', baseURL,
            '--destination', destination,
        ], {
            cwd: path.join(options.sourceRoot, 'demos', id),
            env: { ...demoEnvironment, HUGO_BASEURL: baseURL, HUGO_PUBLISHDIR: destination },
            stdio: 'inherit',
            windowsHide: true,
        });
        if (demo.error) throw demo.error;
        if (demo.status !== 0) return demo.status ?? 1;
    }
    return 0;
}

if (require.main === module) {
    try {
        process.exitCode = buildSite();
    } catch (error) {
        console.error(`Site build failed: ${error.message}`);
        process.exitCode = 1;
    }
}

module.exports = { buildSite, resolveSourceCommit, resolveBuildOptions, configurationArgs };
