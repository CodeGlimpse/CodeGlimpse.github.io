const { spawn } = require('node:child_process');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';
const parsedBaseURL = new URL(baseURL);
const localHostnames = new Set(['127.0.0.1', 'localhost']);
const localServerSetting = process.env.E2E_USE_LOCAL_SERVER;
const shouldUseLocalServer = localServerSetting === 'true'
    || (localServerSetting !== 'false' && localHostnames.has(parsedBaseURL.hostname));
const serverTimeout = 120000;

let ownedServer = null;
let testProcess = null;
let handlingSignal = false;

function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isUrlAvailable(url) {
    return new Promise((resolve) => {
        const transport = url.protocol === 'https:' ? https : http;
        let settled = false;
        const finish = (available) => {
            if (settled) return;
            settled = true;
            resolve(available);
        };
        const request = transport.get(url, {
            headers: { Connection: 'close' },
            timeout: 1000
        }, (response) => {
            response.resume();
            finish((response.statusCode ?? 500) < 500);
        });
        request.once('error', () => finish(false));
        request.once('timeout', () => {
            request.destroy();
            finish(false);
        });
    });
}

function waitForExit(child, timeout) {
    if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
    return new Promise((resolve) => {
        const timer = setTimeout(() => finish(false), timeout);
        const onClose = () => finish(true);
        const finish = (closed) => {
            clearTimeout(timer);
            child.off('close', onClose);
            resolve(closed);
        };
        child.once('close', onClose);
    });
}

async function stopOwnedServer() {
    const server = ownedServer;
    ownedServer = null;
    if (!server || server.exitCode !== null || server.signalCode !== null) return;

    server.kill();
    if (await waitForExit(server, 2000)) return;

    server.kill('SIGKILL');
    await waitForExit(server, 1000);
}

async function waitForServer(server) {
    const deadline = Date.now() + serverTimeout;
    while (Date.now() < deadline) {
        if (server.exitCode !== null || server.signalCode !== null) {
            throw new Error(`Local E2E server exited before becoming ready (code ${server.exitCode ?? 'unknown'})`);
        }
        if (await isUrlAvailable(parsedBaseURL)) return;
        await delay(100);
    }
    throw new Error(`Timed out waiting for ${baseURL}`);
}

async function prepareServer() {
    if (!shouldUseLocalServer) return;
    if (parsedBaseURL.protocol !== 'http:') {
        throw new Error('The bundled E2E server supports local HTTP URLs only');
    }

    if (await isUrlAvailable(parsedBaseURL)) {
        if (process.env.CI) throw new Error(`${baseURL} is already in use`);
        console.log(`Reusing existing E2E server at ${baseURL}`);
        return;
    }

    const port = parsedBaseURL.port || '80';
    ownedServer = spawn(process.execPath, [path.join(projectRoot, 'scripts', 'serve-public.cjs')], {
        cwd: projectRoot,
        env: { ...process.env, PORT: port },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
    });
    ownedServer.stdout.pipe(process.stdout);
    ownedServer.stderr.pipe(process.stderr);
    ownedServer.once('error', (error) => {
        console.error(`Unable to start the local E2E server: ${error.message}`);
    });

    await waitForServer(ownedServer);
}

function runPlaywright() {
    return new Promise((resolve, reject) => {
        const cliPath = require.resolve('@playwright/test/cli');
        testProcess = spawn(process.execPath, [cliPath, 'test', ...process.argv.slice(2)], {
            cwd: projectRoot,
            env: {
                ...process.env,
                E2E_BASE_URL: baseURL,
                E2E_USE_LOCAL_SERVER: 'false'
            },
            stdio: 'inherit',
            windowsHide: true
        });
        testProcess.once('error', reject);
        testProcess.once('close', (code, signal) => {
            testProcess = null;
            resolve(code ?? (signal ? 1 : 0));
        });
    });
}

async function handleSignal(signal) {
    if (handlingSignal) return;
    handlingSignal = true;
    testProcess?.kill(signal);
    await stopOwnedServer();
    process.exit(130);
}

process.once('SIGINT', () => handleSignal('SIGINT'));
process.once('SIGTERM', () => handleSignal('SIGTERM'));

(async () => {
    let exitCode = 1;
    try {
        await prepareServer();
        exitCode = await runPlaywright();
    } catch (error) {
        console.error(error.stack || error.message);
    } finally {
        await stopOwnedServer();
    }
    process.exitCode = exitCode;
})();
