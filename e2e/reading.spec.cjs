const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('yaml');

const ANALYTICS_URL = /^https:\/\/(?:www\.googletagmanager\.com|www\.clarity\.ms|hm\.baidu\.com)\//i;
const INTERNAL_REVIEW_PATTERN = /\breview_(?:date|scope)\b|article-review|资料复核|Documentation review/i;

test.beforeEach(async ({ page }) => {
    await page.route(ANALYTICS_URL, (route) => route.fulfill({
        body: '/* analytics disabled during local verification */',
        contentType: 'application/javascript',
    }));
});

function publishedTitles(language) {
    const root = path.join(__dirname, '..', 'content', language, 'post');
    return fs.readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
            const source = fs.readFileSync(path.join(root, entry.name, 'index.md'), 'utf8');
            return yaml.parse(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
        })
        .filter((entry) => !entry.draft && new Date(entry.date) <= new Date())
        .map((entry) => entry.title).sort();
}

for (const language of ['zh-cn', 'en']) {
    const prefix = language === 'en' ? '/en' : '';

    test(`publishes the author page and visible reading links in ${language}`, async ({ page }) => {
        await page.goto(`${prefix}/about/`);
        await expect(page.locator('h1')).toHaveText(language === 'en' ? 'About Fernweh' : '关于 Fernweh');
        await expect(page.locator(`#main-menu a[href="${prefix}/about/"]`)).toHaveAttribute('aria-current', 'page');
        await expect(page.locator('.article-content a[href="https://github.com/CodeGlimpse"]')).toBeVisible();
        await expect(page.locator('.article-content a[href="mailto:libochen@codeglimpse.top"]')).toBeVisible();
        await expect(page.locator(`.menu-social a[href="${prefix}/index.xml"]`)).toBeVisible();
        await expect(page.locator('.article-translations a')).toHaveAttribute('href', `https://blog.codeglimpse.top${language === 'en' ? '' : '/en'}/about/`);
        await expect(page.locator(`#main-menu a[href="${prefix}/series/"]`)).toHaveCount(0);
        expect(await page.locator('main').innerText()).not.toMatch(INTERNAL_REVIEW_PATTERN);
        await page.locator(`.article-content a[href="${prefix}/categories/"]`).click();
        await expect(page).toHaveURL(new RegExp(`${prefix}/categories/$`));
        await expect(page.locator('main')).toBeVisible();
    });

    test(`follows the complete OpenClaw reading order in ${language}`, async ({ page }) => {
        await page.goto(`${prefix}/series/openclaw/`);
        const chapters = page.locator('.article-content ol a');
        await expect(chapters).toHaveCount(3);
        const paths = await chapters.evaluateAll((links) => links.map((link) => new URL(link.href).pathname));
        await page.goto(paths[0]);
        for (let index = 0; index < paths.length; index += 1) {
            await expect(page).toHaveURL(new RegExp(`${paths[index]}$`));
            await expect(page.locator('h1')).toHaveCount(1);
            await expect(page.locator('.article-review')).toHaveCount(0);
            await expect(page.locator('.article-series ol a')).toHaveCount(3);
            await expect(page.locator('.article-series [aria-current="page"]')).toHaveAttribute('href', paths[index]);
            await expect(page.locator(`#main-menu a[href="${prefix}/series/"]`)).toHaveCount(0);
            const previous = page.locator('.article-series a[rel="prev"]');
            if (index === 0) await expect(previous).toHaveCount(0);
            else await expect(previous).toHaveAttribute('href', paths[index - 1]);
            const next = page.locator('.article-series a[rel="next"]');
            if (index < paths.length - 1) {
                await expect(next).toHaveAttribute('href', paths[index + 1]);
                await next.click();
            } else await expect(next).toHaveCount(0);
        }
        await page.goto(`${prefix}/p/openclaw-install/`);
        await expect(page.locator(`.tool-related a[href="${prefix}/tools/json/"]`)).toBeVisible();
    });

    test(`keeps maintainer review notes out of ${language} articles and search`, async ({ page, request }) => {
        expect((await request.get(`${prefix}/docs/tutorial-review-records.json`)).status()).toBe(404);
        const response = await request.get(`${prefix}/search/index.json`);
        expect(response.ok()).toBe(true);
        const entries = await response.json();
        expect(JSON.stringify(entries)).not.toMatch(INTERNAL_REVIEW_PATTERN);
        const articles = entries.filter((entry) => new URL(entry.permalink).pathname.includes('/p/'));
        expect(articles).toHaveLength(publishedTitles(language).length);
        for (const article of articles) {
            await page.goto(new URL(article.permalink).pathname);
            await expect(page.locator('.article-review')).toHaveCount(0);
            expect(await page.locator('main').innerText()).not.toMatch(INTERNAL_REVIEW_PATTERN);
        }
    });

    test(`keeps the ${language} RSS feed valid and limited to published articles`, async ({ page, request }) => {
        const response = await request.get(`${prefix}/index.xml`);
        expect(response.ok()).toBe(true);
        expect(await response.text()).not.toMatch(INTERNAL_REVIEW_PATTERN);
        const result = await page.evaluate((source) => {
            const document = new DOMParser().parseFromString(source, 'application/xml');
            return {
                error: document.querySelector('parsererror')?.textContent || null,
                root: document.documentElement.localName,
                language: document.querySelector('channel > language')?.textContent,
                entries: [...document.querySelectorAll('channel > item')].map((item) => ({
                    title: item.querySelector('title')?.textContent,
                    link: item.querySelector('link')?.textContent,
                    description: item.querySelector('description')?.textContent,
                })),
            };
        }, await response.text());
        expect(result.error).toBeNull();
        expect(result.root).toBe('rss');
        expect(result.language).toBe(language);
        expect(result.entries.map((entry) => entry.title).sort()).toEqual(publishedTitles(language));
        for (const entry of result.entries) {
            expect(new URL(entry.link).pathname).toMatch(new RegExp(`^${prefix}/p/`));
            expect(entry.description).toContain('<');
        }
    });
}

test('keeps reading pages and series navigation usable on a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const url of ['/about/', '/series/openclaw/', '/p/openclaw-chrome/']) {
        await page.goto(url);
        await expect(page.locator('h1')).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.locator('#toggle-menu').click();
    await expect(page.locator('#main-menu a[href="/about/"]')).toBeVisible();
    await page.locator('#main-menu a[href="/about/"]').click();
    await expect(page.locator('h1')).toHaveText('关于 Fernweh');
});
