const { test, expect } = require('@playwright/test');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');

function demoFor(caseId, templateId) {
    const demo = DEMO_REGISTRY.find(item => item.caseId === caseId && item.templateId === templateId);
    if (!demo) throw new Error(`Missing portfolio template ${caseId}/${templateId}`);
    return demo;
}

function targetPath(demo, route, baseURL) {
    const base = new URL(baseURL);
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    return new URL(demo.path + route, base).pathname;
}

async function openPortfolio(page, demo, route, baseURL) {
    const response = await page.goto(targetPath(demo, route, baseURL));
    expect(response?.ok()).toBe(true);
    await expect(page.locator('body')).toHaveAttribute('data-template', demo.templateId);
    await expect(page.locator('main h1')).toHaveCount(1);
}

test.use({ reducedMotion: 'reduce' });

const CREATOR_SCENES = {
    classic: {
        brand: '岛页插画', heading: '把寻常日子画成小小的岛',
        works: ['风从窗沿经过', '纸上潮线', '雨天邮差', '庭院四季'],
        details: ['works/window-light/', 'works/paper-tide/', 'projects/rain-notes/', 'projects/leaf-atlas/'],
    },
    editorial: {
        brand: '拾度', heading: '让一个想法成为可辨认的形状',
        works: ['折光剧场', '丘原咖啡', '行间书展', '渡口公共标识'],
        details: ['works/window-light/', 'works/paper-tide/', 'projects/rain-notes/', 'projects/leaf-atlas/'],
    },
    archive: {
        brand: '回声单元', heading: '把规则留下，把偶然展开',
        works: ['相位花园', '折叠频谱', '流场切片', '轨道信号'],
        details: ['works/window-light/', 'works/paper-tide/', 'projects/rain-notes/', 'projects/leaf-atlas/'],
    },
};

for (const width of [1280, 320]) {
    for (const [templateId, scene] of Object.entries(CREATOR_SCENES)) {
        test(`${scene.brand} keeps its independent artworks and stable details at ${width}px`, async ({ page, baseURL }) => {
            const demo = demoFor('creator-portfolio', templateId);
            await page.setViewportSize({ width, height: 960 });
            await openPortfolio(page, demo, '', baseURL);
            await expect(page.locator('main h1')).toHaveText(scene.heading);
            await expect(page).toHaveTitle(new RegExp(scene.brand));
            await expect(page.locator('header .brand, header .editorial-wordmark, header .archive-brand')).toContainText(scene.brand);
            for (const title of scene.works) await expect(page.locator('main')).toContainText(title);
            for (const [otherId, other] of Object.entries(CREATOR_SCENES)) {
                if (otherId === templateId) continue;
                for (const title of other.works) await expect(page.locator('main')).not.toContainText(title);
            }
            await expect(page.locator('body')).not.toContainText('弧光');
            await page.keyboard.press('Tab');
            await expect(page.locator('.skip-link')).toBeFocused();
            await page.keyboard.press('Enter');
            await expect(page).toHaveURL(url => url.hash === '#main');
            await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
            for (let index = 0; index < scene.details.length; index++) {
                await openPortfolio(page, demo, scene.details[index], baseURL);
                await expect(page.locator('main h1')).toHaveText(scene.works[index]);
                await expect(page).toHaveTitle(new RegExp(scene.brand));
                if (templateId === 'editorial') {
                    await expect(page.locator('.editorial-case-facts')).toBeVisible();
                    await expect(page.locator('.editorial-case-facts dt')).toHaveText(['命题类型', '制作年份', '设计内容']);
                    for (const fact of await page.locator('.editorial-case-facts dd').all()) await expect(fact).toHaveText(/\S/);
                }
                await expect(page.locator('main .detail-cover img')).toBeVisible();
                await expect(page.locator('main .prose img')).toHaveCount(1);
                const images = page.locator('main img');
                await expect(images).toHaveCount(2);
                for (const image of await images.all()) {
                    await expect(image).toHaveAttribute('alt', /\S/);
                    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
                }
                await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
            }
        });
    }

    test(`Echo Unit previews a source record by keyboard and opens its actual detail at ${width}px`, async ({ page, baseURL }) => {
        const demo = demoFor('creator-portfolio', 'archive');
        await page.setViewportSize({ width, height: 960 });
        await openPortfolio(page, demo, '', baseURL);
        const root = page.locator('[data-archive]');
        await expect(root).toHaveAttribute('data-archive-ready', 'true');
        const record = root.locator('[data-archive-entry]').last();
        const sourceLink = record.locator('[data-archive-detail]');
        const title = await sourceLink.innerText();
        expect(title).toBe('轨道信号');
        const detailURL = new URL(await sourceLink.getAttribute('href'), page.url());
        const sourceImage = record.locator('.archive-entry-media img');
        const source = await sourceImage.getAttribute('src');
        const alt = await sourceImage.getAttribute('alt');
        const previewButton = record.locator('[data-archive-preview-button]');
        await expect(previewButton).toBeEnabled();
        await previewButton.focus();
        await page.keyboard.press('Enter');
        await expect(previewButton).toHaveAttribute('aria-pressed', 'true');
        await expect(root.locator('[data-archive-preview-button][aria-pressed="true"]')).toHaveCount(1);
        await expect(root.locator('[data-archive-preview-title]')).toHaveText(title);
        await expect(root.locator('[data-archive-preview-media] img')).toHaveAttribute('src', source);
        await expect(root.locator('[data-archive-preview-media] img')).toHaveAttribute('alt', alt);
        await expect(root.locator('[data-archive-preview-detail]')).toHaveAttribute('href', detailURL.href);
        await root.locator('[data-archive-preview-detail]').click();
        await expect(page).toHaveURL(url => url.pathname === detailURL.pathname);
        await expect(page.locator('main h1')).toHaveText(title);
        await expect(page.locator('.archive-dossier-meta dt')).toHaveText(['记录编号', '媒介', '构成规则', '画布', '制作年份']);
        await expect(page.locator('.archive-dossier-meta dd')).toHaveText(['E-04', '静态矢量生成图', '旋转椭圆 / 24 条轨道', '1200 × 800', '2026']);
    });

    test(`nature photo stories open their authored detail and full original at ${width}px`, async ({ page, baseURL }) => {
        const demo = demoFor('photo-portfolio', 'gallery');
        await page.setViewportSize({ width, height: 960 });
        await openPortfolio(page, demo, '', baseURL);
        const stories = page.locator('.nature-stories .story-card');
        await expect(stories).toHaveCount(2);
        const detailLink = stories.last().locator('h2 a');
        const title = await detailLink.innerText();
        const detailURL = new URL(await detailLink.getAttribute('href'), page.url());
        await detailLink.click();
        await expect(page).toHaveURL(url => url.pathname === detailURL.pathname);
        await expect(page.locator('main h1')).toHaveText(title);
        const image = page.locator('.detail-figure img');
        await expect(image).toBeVisible();
        const opener = page.locator('button[data-image]');
        await expect(opener).toBeVisible();
        const original = await opener.getAttribute('data-image');
        await opener.click();
        await expect(page.locator('.image-dialog')).toBeVisible();
        await expect(page.locator('.image-dialog img')).toHaveAttribute('src', original);
        await expect(page.locator('.image-dialog img')).toHaveAttribute('alt', await image.getAttribute('alt'));
        await page.keyboard.press('Escape');
        await expect(page.locator('.image-dialog')).toBeHidden();
        await expect(opener).toBeFocused();
    });

    test(`Shidu design chapters follow keyboard selection and scroll location at ${width}px`, async ({ page, baseURL }) => {
        const demo = demoFor('creator-portfolio', 'editorial');
        await page.setViewportSize({ width, height: 960 });
        await openPortfolio(page, demo, '', baseURL);
        const root = page.locator('[data-editorial]');
        await expect(root).toHaveAttribute('data-editorial-ready', 'true');
        await expect(root.locator('.editorial-chapter-copy h3')).toHaveText(CREATOR_SCENES.editorial.works);
        const links = root.locator('[data-editorial-target]');
        const last = links.last();
        const target = await last.getAttribute('data-editorial-target');
        await expect(last).toHaveAttribute('href', `#${target}`);
        await last.focus();
        await page.keyboard.press('Enter');
        await expect(root.locator(`#${target}`)).toBeInViewport();
        await expect(last).toHaveAttribute('aria-current', 'location');
        await expect(root).toHaveAttribute('data-editorial-current', target);
        await expect(root.locator('[data-editorial-target][aria-current="location"]')).toHaveCount(1);
        await page.evaluate(() => window.scrollTo(0, 0));
        await expect(links.first()).toHaveAttribute('aria-current', 'location');
        await expect(root.locator('[data-editorial-status]')).toHaveText('01 / 04');
    });

    test(`astronomy photography keeps complete image framing and readable source facts at ${width}px`, async ({ page, baseURL }) => {
        const demo = demoFor('photo-portfolio', 'filmstrip');
        await page.setViewportSize({ width, height: 960 });
        await openPortfolio(page, demo, '', baseURL);
        await expect(page.locator('.astro-cover img')).toBeVisible();
        await expect(page.locator('.astro-cover img')).toHaveCSS('object-fit', 'contain');
        const detailLink = page.locator('.astro-title a');
        const destination = new URL(await detailLink.getAttribute('href'), page.url());
        await detailLink.click();
        await expect(page).toHaveURL(url => url.pathname === destination.pathname);
        await expect(page.locator('.detail-figure img')).toBeVisible();
        await expect(page.locator('.detail-figure img')).toHaveCSS('object-fit', 'contain');
        await expect(page.locator('.photo-facts')).toBeVisible();
        await expect(page.locator('.photo-facts dt')).toHaveText(['作者 / 机构', '拍摄 / 发布', '使用许可']);
        for (const fact of await page.locator('.photo-facts dd').all()) await expect(fact).toHaveText(/\S/);
    });
}

test('each photography genre retains readable author and licence source links on its detail page', async ({ page, baseURL }) => {
    for (const templateId of ['classic', 'gallery', 'filmstrip']) {
        const demo = demoFor('photo-portfolio', templateId);
        const detail = demo.checks.pages.find(route => /^works\/[^/]+\/$/.test(route));
        expect(detail).toBeDefined();
        await openPortfolio(page, demo, detail, baseURL);
        const sources = page.locator('.photo-facts .source-credit a');
        await expect(sources).toHaveCount(2);
        await expect(sources.nth(0)).toHaveText('原始作品与署名');
        await expect(sources.nth(1)).toHaveText('查看授权说明');
        for (const source of await sources.all()) {
            await expect(source).toBeVisible();
            await expect(source).toHaveAttribute('href', /^https?:\/\//);
        }
    }
});

test.describe('portfolio presentation controls without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('archive controls stay unavailable while their source content remains visible', async ({ page, baseURL }) => {
        await openPortfolio(page, demoFor('creator-portfolio', 'archive'), '', baseURL);
        await expect(page.locator('[data-archive-preview]')).toBeHidden();
        for (const button of await page.locator('[data-archive-preview-button]').all()) {
            await expect(button).toBeHidden();
            await expect(button).toBeDisabled();
        }
        for (const record of await page.locator('[data-archive-entry]').all()) await expect(record).toBeVisible();
        await expect(page.locator('[data-archive-detail]')).toHaveText(CREATOR_SCENES.archive.works);
    });
});
