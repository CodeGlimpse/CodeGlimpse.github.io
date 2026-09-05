const { defineConfig, devices } = require('@playwright/test');

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';
const baseHostname = new URL(baseURL).hostname;
const useLocalServer = process.env.E2E_USE_LOCAL_SERVER === 'true'
    || (!process.env.E2E_USE_LOCAL_SERVER && ['127.0.0.1', 'localhost'].includes(baseHostname));

module.exports = defineConfig({
    testDir: './e2e',
    testMatch: '**/*.spec.cjs',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI
        ? [['dot'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
        : 'list',
    outputDir: 'test-results',
    use: {
        baseURL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        ...devices['Desktop Chrome'],
    },
    webServer: useLocalServer ? {
        command: 'node scripts/serve-public.cjs',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        gracefulShutdown: { signal: 'SIGTERM', timeout: 1000 },
        timeout: 120000,
    } : undefined,
});
