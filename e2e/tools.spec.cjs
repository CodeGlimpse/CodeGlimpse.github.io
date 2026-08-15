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

    test('searches published content', async ({ page }) => {
        await page.goto('/search/');

        const input = page.locator('input[name="keyword"]');
        await input.fill('OpenClaw');
        await expect(page.locator('.search-result--list')).toContainText('OpenClaw');
        await expect(page).toHaveURL(/keyword=OpenClaw/);
    });
});
