const { test, expect } = require('@playwright/test');
const { TOOL_IDS } = require('../scripts/tool-registry.cjs');

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

    test('publishes every registered tool in both languages', async ({ page }) => {
        for (const toolId of TOOL_IDS) {
            for (const route of [`/tools/${toolId}/`, `/en/tools/${toolId}/`]) {
                await page.goto(route);
                await expect(page.locator(`#tool-${toolId}`)).toBeVisible();
                await expect(page.locator('main')).toBeVisible();
                await expect(page.locator('h1')).toHaveCount(1);
            }
        }
    });

    test('localizes complex tool controls in both languages', async ({ page }) => {
        await page.goto('/tools/csv/');
        await expect(page.getByRole('button', { name: 'CSV 转 JSON' })).toBeVisible();
        await expect(page.getByLabel('输入 CSV')).toBeVisible();

        await page.goto('/en/tools/csv/');
        await expect(page.getByRole('button', { name: 'CSV to JSON' })).toBeVisible();
        await expect(page.getByLabel('Input CSV')).toBeVisible();

        await page.goto('/tools/regex/');
        await expect(page.getByRole('button', { name: '测试并替换' })).toBeVisible();
        await page.goto('/en/tools/regex/');
        await expect(page.getByRole('button', { name: 'Test and Replace' })).toBeVisible();
    });

    test('publishes bilingual tool metadata without unused third-party assets', async ({ page }) => {
        await page.goto('/tools/json/');

        await expect(page).toHaveTitle('JSON 格式化工具 | Fernweh的个人博客');
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('h1')).toHaveText('JSON 格式化工具');
        await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-default\.png$/);
        await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', /og-default\.png$/);

        const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) => (
            links.map((link) => link.getAttribute('hreflang')).sort()
        ));
        expect(alternates).toEqual(['en', 'x-default', 'zh-cn']);

        const structuredData = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
        expect(structuredData['@type']).toBe('WebApplication');
        expect(structuredData.inLanguage).toBe('zh-cn');
        expect(structuredData.isAccessibleForFree).toBe(true);

        await expect(page.locator('script[src*="photoswipe" i]')).toHaveCount(0);
        await expect(page.locator('script[src*="vibrant" i]')).toHaveCount(0);
        await expect(page.locator('link[href*="fonts.googleapis.com" i]')).toHaveCount(0);
        await expect(page.locator('script[src*="/js/tools/json."]')).toHaveCount(1);
    });

    test('supports keyboard navigation and exposes theme state', async ({ page }) => {
        await page.goto('/tools/json/');

        const skipLink = page.locator('.skip-link');
        await page.keyboard.press('Tab');
        await expect(skipLink).toBeFocused();
        await expect(skipLink).toBeVisible();
        await skipLink.press('Enter');
        await expect(page.locator('#main-content')).toBeFocused();

        const themeToggle = page.getByRole('button', { name: '暗色模式' });
        const initialState = await themeToggle.getAttribute('aria-pressed');
        expect(['true', 'false']).toContain(initialState);
        await themeToggle.press('Enter');
        await expect(themeToggle).toHaveAttribute('aria-pressed', initialState === 'true' ? 'false' : 'true');

        await expect(page.getByLabel('选择语言')).toBeVisible();
        await expect(page.getByRole('link', { name: '工具', exact: true })).toHaveAttribute('aria-current', 'location');
        await expect(page.locator('svg:not([aria-hidden="true"])')).toHaveCount(0);
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

    test('encodes and decodes URL components in form mode', async ({ page }) => {
        await page.goto('/en/tools/url/');

        await page.locator('#url-input').fill('hello world+code');
        await page.locator('#url-form-mode').check();
        await page.locator('#url-encode').click();
        await expect(page.locator('#url-output')).toHaveValue('hello+world%2Bcode');

        await page.locator('#url-input').fill('hello+world%2Bcode');
        await page.locator('#url-decode').click();
        await expect(page.locator('#url-output')).toHaveValue('hello world+code');
    });

    test('decodes JWT content while keeping the signature warning visible', async ({ page }) => {
        await page.goto('/en/tools/jwt/');

        await expect(page.getByText('does not verify the signature')).toBeVisible();
        await page.locator('#jwt-example').click();
        await expect(page.locator('#jwt-header')).toHaveValue(/"alg": "none"/);
        await expect(page.locator('#jwt-payload')).toHaveValue(/"name": "CodeGlimpse"/);
        await expect(page.locator('#jwt-status')).toContainText('signature not verified');
    });

    test('generates and validates version 4 UUIDs', async ({ page }) => {
        await page.goto('/tools/uuid/');

        await page.locator('#uuid-count').selectOption('1');
        await page.locator('#uuid-generate').click();
        const generated = await page.locator('#uuid-output').inputValue();
        expect(generated).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

        await page.locator('#uuid-validate-input').fill(generated);
        await page.locator('#uuid-validate').click();
        await expect(page.locator('#uuid-validation-status')).toContainText('版本 4');
    });

    test('tests regular expressions in a worker and previews replacement', async ({ page }) => {
        await page.goto('/en/tools/regex/');

        await page.locator('#regex-pattern').fill('(\\w+)=(\\d+)');
        await page.locator('#regex-input').fill('a=1 b=22');
        await page.locator('#regex-replacement').fill('$1:[$2]');
        await page.locator('#regex-run').click();

        await expect(page.locator('#regex-status')).toContainText('2 matches');
        await expect(page.locator('#regex-match-output')).toHaveValue(/#2 @ 4: "b=22"/);
        await expect(page.locator('#regex-replacement-output')).toHaveValue('a:[1] b:[22]');
    });

    test('analyzes and transforms text', async ({ page }) => {
        await page.goto('/tools/text/');

        await page.locator('#text-input').fill('hello world\n\u4f60\u597d');
        await expect(page.locator('#text-characters')).toHaveText('14');
        await expect(page.locator('#text-lines')).toHaveText('2');
        await expect(page.locator('#text-words')).toHaveText('3');

        await page.getByRole('button', { name: '标题格式' }).click();
        await expect(page.locator('#text-output')).toHaveValue('Hello World\n\u4f60\u597d');
    });

    test('converts quoted CSV rows to JSON', async ({ page }) => {
        await page.goto('/en/tools/csv/');

        await page.locator('#csv-input').fill('name,note\nAlice,"hello, world"');
        await page.locator('#csv-convert').click();
        await expect(page.locator('#csv-output')).toHaveValue(
            '[\n  {\n    "name": "Alice",\n    "note": "hello, world"\n  }\n]',
        );
        await expect(page.locator('#csv-status')).toContainText('Conversion complete');
    });

    test('encodes and decodes HTML entities as text', async ({ page }) => {
        await page.goto('/en/tools/html/');

        await page.locator('#html-input').fill('<strong>Tom & Jerry</strong>');
        await page.locator('#html-encode').click();
        await expect(page.locator('#html-output')).toHaveValue('&lt;strong&gt;Tom &amp; Jerry&lt;/strong&gt;');

        await page.locator('#html-input').fill('&lt;strong&gt;safe&lt;/strong&gt;');
        await page.locator('#html-decode').click();
        await expect(page.locator('#html-output')).toHaveValue('<strong>safe</strong>');
    });

    test('generates password batches with the selected secure options', async ({ page }) => {
        await page.goto('/en/tools/password/');

        await page.locator('#password-length-number').fill('24');
        await page.locator('#password-count').selectOption('5');
        await page.locator('#password-generate').click();

        const generated = (await page.locator('#password-output').inputValue()).split('\n');
        expect(generated).toHaveLength(5);
        expect(generated.every((value) => value.length === 24)).toBe(true);
        expect(generated.every((value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value))).toBe(true);
        await expect(page.locator('#password-status')).toContainText('generated locally');
    });

    test('localizes tool search and shows its empty state', async ({ page }) => {
        await page.goto('/en/tools/');

        const search = page.getByLabel('Search tools');
        await expect(search).toHaveAttribute('placeholder', 'Search tools...');
        await search.fill('definitely-not-a-tool');
        await expect(page.locator('#tool-search-empty')).toBeVisible();
        await expect(page.locator('#tool-search-empty')).toContainText('No matching tools found');
    });

    test('filters the catalog by category and persists favorites locally', async ({ page }) => {
        await page.goto('/tools/');
        await page.evaluate(() => localStorage.clear());

        await page.locator('#tool-category').selectOption('data');
        await expect(page.locator('.tool-card:not([hidden])')).not.toHaveCount(0);
        await expect(page.locator('.tool-card:not([hidden])[data-category="data"]')).toHaveCount(5);

        await page.locator('[data-tool-id="json"] [data-tool-favorite]').click();
        await expect(page.locator('[data-tool-id="json"] [data-tool-favorite]')).toHaveAttribute('aria-pressed', 'true');
        await page.locator('#tool-favorites-only').click();
        await expect(page.locator('.tool-card:not([hidden])')).toHaveCount(1);
        await expect(page.locator('.tool-card:not([hidden])')).toHaveAttribute('data-tool-id', 'json');

        await page.locator('[data-tool-id="json"] [data-tool-link]').first().click();
        await page.goto('/tools/');
        await expect(page.locator('#tool-recent')).toBeVisible();
        await expect(page.locator('#tool-recent-list')).toContainText('JSON');

        await page.reload();
        await expect(page.locator('[data-tool-id="json"] [data-tool-favorite]')).toHaveAttribute('aria-pressed', 'true');
    });

    test('runs the first bilingual product expansion tools', async ({ page }) => {
        await page.goto('/tools/diff/');
        await page.locator('#diff-left').fill('one\ntwo');
        await page.locator('#diff-right').fill('one\nthree');
        await page.locator('#diff-compare').click();
        await expect(page.locator('.tool-diff-line--added')).toHaveCount(1);

        await page.goto('/en/tools/xml/');
        await page.locator('#xml-input').fill('<root><item>Text</item></root>');
        await page.locator('#xml-format').click();
        await expect(page.locator('#xml-output')).toHaveValue('<root>\n  <item>\n    Text\n  </item>\n</root>');

        await page.goto('/tools/yaml/');
        await page.locator('#yaml-input').fill('name: CodeGlimpse\nenabled: true');
        await page.locator('#yaml-convert').click();
        await expect(page.locator('#yaml-output')).toHaveValue('{\n  "name": "CodeGlimpse",\n  "enabled": true\n}');

        await page.goto('/en/tools/markdown/');
        await page.locator('#markdown-example').click();
        await expect(page.locator('#markdown-preview')).toContainText('CodeGlimpse');
        await expect(page.locator('#markdown-preview strong')).toContainText('local-first');

        await page.goto('/tools/sql/');
        await page.locator('#sql-input').fill('select id,name from users where active=true;');
        await page.locator('#sql-format').click();
        await expect(page.locator('#sql-output')).toHaveValue(/SELECT id, name/);

        await page.goto('/en/tools/jsonpath/');
        await page.locator('#jsonpath-input').fill('{"users":[{"name":"Alice"},{"name":"Bob"}]}');
        await page.locator('#jsonpath-expression').fill('$.users[*].name');
        await page.locator('#jsonpath-query').click();
        await expect(page.locator('#jsonpath-output')).toHaveValue(/Alice/);
        await expect(page.locator('#jsonpath-output')).toHaveValue(/Bob/);
    });

    test('shows a visible focus indicator on tool cards', async ({ page }) => {
        await page.goto('/tools/');

        const firstCard = page.locator('.tool-card').first();
        await firstCard.focus();
        const focusStyle = await firstCard.evaluate((card) => {
            const style = window.getComputedStyle(card);
            return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
        });

        expect(focusStyle.outlineStyle).not.toBe('none');
        expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(3);
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

    test('keeps long-form tools within the mobile viewport', async ({ page }) => {
        for (const route of ['/tools/csv/', '/en/tools/regex/', '/tools/password/', '/en/tools/time/']) {
            await page.goto(route);
            const metrics = await page.evaluate(() => {
                const selectors = [
                    '.tool-wrapper',
                    '.tool-wrapper input',
                    '.tool-wrapper textarea',
                    '.tool-wrapper select',
                    '.tool-wrapper .tool-output-panel',
                ];
                const widths = selectors.flatMap((selector) => (
                    [...document.querySelectorAll(selector)].map((element) => element.getBoundingClientRect().right)
                ));
                return {
                    viewportWidth: window.innerWidth,
                    documentWidth: document.documentElement.scrollWidth,
                    maxRight: Math.max(0, ...widths),
                };
            });

            expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
            expect(metrics.maxRight).toBeLessThanOrEqual(metrics.viewportWidth + 1);
        }
    });

    test('stacks CSV output and actions without overflow', async ({ page }) => {
        await page.goto('/tools/csv/');
        await page.locator('#csv-input').fill('name,age\nAlice,30');
        await page.locator('#csv-convert').click();
        await expect(page.locator('#csv-output')).toBeVisible();

        const metrics = await page.evaluate(() => ({
            viewportWidth: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            outputRight: document.querySelector('#csv-output').getBoundingClientRect().right,
        }));
        expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
        expect(metrics.outputRight).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    });
});
