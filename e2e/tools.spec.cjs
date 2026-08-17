const { test, expect } = require('@playwright/test');

test.describe('online tools', () => {
    test('formats JSON on the Chinese page', async ({ page }) => {
        await page.goto('/tools/json/');

        await expect(page.locator('#tool-json')).toBeVisible();
        await page.locator('#json-input').fill('{"name":"Fernweh","items":[1,true]}');
        await page.locator('[data-action="format"]').click();

        await expect(page.locator('#json-output')).toHaveValue(
            '{\n  "name": "Fernweh",\n  "items": [\n    1,\n    true\n  ]\n}',
        );
        await expect(page.locator('#json-status')).toContainText('JSON 格式有效');
    });

    test('formats JSON on the English page', async ({ page }) => {
        await page.goto('/en/tools/json/');

        await expect(page.locator('#tool-json')).toBeVisible();
        await expect(page.locator('label[for="json-input"]')).toHaveText('Input JSON');
        await page.locator('#json-input').fill('{"enabled":true}');
        await page.locator('[data-action="format"]').click();

        await expect(page.locator('#json-output')).toHaveValue('{\n  "enabled": true\n}');
        await expect(page.locator('#json-status')).toContainText('Valid JSON');
    });

    test('encodes and clears Unicode Base64 content', async ({ page }) => {
        await page.goto('/tools/base64/');

        await page.locator('#base64-input').fill('你好, Web');
        await page.locator('#base64-encode').click();
        await expect(page.locator('#base64-output')).toHaveValue('5L2g5aW9LCBXZWI=');

        await page.locator('#base64-clear').click();
        await expect(page.locator('#base64-input')).toHaveValue('');
        await expect(page.locator('#base64-result-group')).toBeHidden();
    });

    test('shows inline Base64 errors without a browser dialog', async ({ page }) => {
        await page.goto('/en/tools/base64/');

        await page.locator('#base64-input').fill('not base64!');
        await page.locator('#base64-decode').click();

        await expect(page.locator('#base64-status')).toContainText('Invalid Base64');
        await expect(page.locator('#base64-result-group')).toBeHidden();
    });

    test('converts binary values and exposes invalid input inline', async ({ page }) => {
        await page.goto('/tools/binary/');

        await page.locator('#binary-input').fill('255');
        await expect(page.locator('#res-2')).toHaveValue('11111111');
        await expect(page.locator('#res-16')).toHaveValue('FF');
        await expect(page.getByRole('button', { name: '复制: 二进制 (2)' })).toBeEnabled();

        await page.locator('#binary-input').fill('12z');
        await expect(page.locator('#binary-status')).toContainText('无效输入');
        await expect(page.getByRole('button', { name: '复制: 二进制 (2)' })).toBeDisabled();
    });

    test('calculates and clears BMI with keyboard-friendly fields', async ({ page }) => {
        await page.goto('/tools/bmi/');

        await page.getByLabel('身高 (cm)').fill('175');
        await page.getByLabel('体重 (kg)').fill('70');
        await page.getByLabel('体重 (kg)').press('Enter');

        await expect(page.locator('#bmi-result')).toContainText('BMI: 22.9');
        await expect(page.locator('#bmi-result')).toContainText('正常');

        await page.locator('#bmi-clear').click();
        await expect(page.locator('#bmi-result')).toBeHidden();
    });

    test('converts and resets colors with validation feedback', async ({ page }) => {
        await page.goto('/en/tools/color/');

        await page.locator('#hex-input').fill('#FF0000');
        await expect(page.locator('#rgb-string')).toHaveValue('rgb(255, 0, 0)');

        await page.locator('#hex-input').fill('#XYZ');
        await expect(page.locator('#color-status')).toContainText('valid 6-digit HEX');

        await page.locator('#color-reset').click();
        await expect(page.locator('#hex-input')).toHaveValue('#3B82F6');
        await expect(page.locator('#color-status')).toContainText('Default color restored');
    });

    test('generates MD5 and SHA hashes', async ({ page }) => {
        await page.goto('/en/tools/md5/');
        await page.getByLabel('Input Content').fill('hello');
        await expect(page.locator('#md5-output')).toHaveValue('5d41402abc4b2a76b9719d911017c592');

        await page.goto('/en/tools/sha/');
        await page.getByLabel('Input Content').fill('hello');
        await expect(page.locator('#sha-output')).toHaveValue(
            '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        );
    });

    test('converts timestamps and reports invalid values inline', async ({ page }) => {
        await page.goto('/tools/time/');

        await page.getByLabel('时间戳 (Timestamp)').fill('0');
        await page.locator('#btn-to-dt').click();
        await expect(page.locator('#time-status')).toContainText('转换完成');

        await page.getByLabel('时间戳 (Timestamp)').fill('invalid');
        await page.locator('#btn-to-dt').click();
        await expect(page.locator('#time-status')).toContainText('无效的输入格式');
    });

    test('localizes tool search and shows its empty state', async ({ page }) => {
        await page.goto('/en/tools/');

        const search = page.getByLabel('Search tools');
        await expect(search).toHaveAttribute('placeholder', 'Search tools...');
        await search.fill('definitely-not-a-tool');
        await expect(page.locator('#tool-search-empty')).toBeVisible();
        await expect(page.locator('#tool-search-empty')).toContainText('No matching tools found');
    });

    test('searches published content', async ({ page }) => {
        await page.goto('/search/');

        const input = page.locator('input[name="keyword"]');
        await input.fill('OpenClaw');
        await expect(page.locator('.search-result--list')).toContainText('OpenClaw');
        await expect(page).toHaveURL(/keyword=OpenClaw/);
    });
});

test.describe('mobile tool layout', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('keeps JSON controls usable without horizontal overflow', async ({ page }) => {
        await page.goto('/tools/json/');

        const metrics = await page.evaluate(() => {
            const wrapper = document.querySelector('.tool-wrapper').getBoundingClientRect();
            const input = document.querySelector('#json-input').getBoundingClientRect();
            return {
                viewportWidth: window.innerWidth,
                documentWidth: document.documentElement.scrollWidth,
                wrapperWidth: wrapper.width,
                inputWidth: input.width
            };
        });

        expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
        expect(metrics.wrapperWidth).toBeGreaterThan(300);
        expect(metrics.inputWidth).toBeGreaterThan(260);
    });
});
