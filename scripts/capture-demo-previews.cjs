const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { chromium } = require('@playwright/test');
const { DEMO_REGISTRY } = require('./demo-registry.cjs');

async function main() {
    const { values } = parseArgs({ options: {
        'base-url': { type: 'string', default: 'http://127.0.0.1:4173/' },
        'output-root': { type: 'string', default: path.resolve(__dirname, '..', 'static') },
    } });
    const baseURL = new URL(values['base-url']);
    if (!['http:', 'https:'].includes(baseURL.protocol)
        || !['127.0.0.1', 'localhost', '[::1]'].includes(baseURL.hostname)) {
        throw new Error('Preview capture expects a locally served build');
    }
    baseURL.pathname = baseURL.pathname.replace(/\/+$/, '') + '/';
    const outputRoot = path.resolve(values['output-root']);
    const browser = await chromium.launch({ headless: true });
    try {
        for (const demo of DEMO_REGISTRY) {
            const context = await browser.newContext({
                viewport: { width: demo.preview.width, height: demo.preview.height },
                deviceScaleFactor: 1,
                colorScheme: 'light',
                reducedMotion: 'reduce',
                serviceWorkers: 'block',
            });
            try {
                await context.route('**/*', route => new URL(route.request().url()).origin === baseURL.origin
                    ? route.continue() : route.abort());
                const page = await context.newPage();
                const response = await page.goto(new URL(demo.path, baseURL).toString(), { waitUntil: 'networkidle' });
                if (!response?.ok()) throw new Error(`Cannot load preview page: ${demo.id}`);
                await page.evaluate(() => document.fonts.ready);
                await page.waitForFunction(() => [...document.images].every(img => {
                    const box = img.getBoundingClientRect();
                    return box.bottom <= 0 || box.top >= innerHeight || (img.complete && img.naturalWidth > 0);
                }));
                const destination = path.join(outputRoot, demo.preview.image);
                fs.mkdirSync(path.dirname(destination), { recursive: true });
                await page.screenshot({ path: destination, type: 'jpeg', quality: 84, animations: 'disabled', fullPage: false });
                console.log(`${demo.id}: ${demo.preview.width}x${demo.preview.height}, ${fs.statSync(destination).size} bytes -> ${destination}`);
            } finally {
                await context.close();
            }
        }
    } finally {
        await browser.close();
    }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
