const { test, expect } = require('@playwright/test');
const books = require('../demos/bookstore/data/books.json');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');
for (const demo of DEMO_REGISTRY.filter(item => item.caseId === 'bookstore')) {
test.describe(demo.templateId, () => {
const demoPath = '/' + demo.path;
const money = cents => `¥${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
const addName = book => `加入《${book.title}》到模拟购物袋`;
const quantityName = book => `《${book.title}》的数量`;

async function openBookstore(page) {
    await page.goto(demoPath);
    await expect(page.locator('[data-bookstore]')).toHaveAttribute('data-ready', 'true');
}

async function expectBag(page, count, cents) {
    await expect(page.locator('#bag-count')).toHaveText(String(count));
    await expect(page.locator('#bag-subtotal')).toHaveText(money(cents));
}

test('bookstore combines category, multiple title terms, IME completion, empty state and reset', async ({ page }) => {
    await openBookstore(page);
    await expect(page.locator('#book-grid .book-card:visible')).toHaveCount(12);
    await page.getByLabel('图书分类', { exact: true }).selectOption('设计');
    await expect(page.locator('#book-grid .book-card:visible')).toHaveCount(4);
    const search = page.getByLabel('书名关键词', { exact: true });
    await search.fill('颜色　地图');
    await expect(page.locator('#book-grid .book-card:visible')).toHaveCount(1);
    await expect(page.getByRole('article', { name: '颜色的散步地图', exact: true })).toBeVisible();
    await search.focus();
    await search.dispatchEvent('compositionstart');
    await search.fill('不存在的书名');
    await expect(page.locator('#book-grid .book-card:visible')).toHaveCount(1);
    await search.dispatchEvent('compositionend');
    await expect(page.locator('#book-grid .book-card:visible')).toHaveCount(0);
    await expect(page.locator('#empty-state')).toBeVisible();
    await expect(search).toBeFocused();
    await page.getByRole('button', { name: '重置筛选', exact: true }).click();
    await expect(search).toHaveValue('');
    await expect(page.getByLabel('图书分类', { exact: true })).toHaveValue('all');
    await expect(page.locator('#book-grid .book-card:visible')).toHaveCount(12);
    await expect(page.locator('#result-summary')).toHaveText('共 12 本书');
});

test('bag adds pieces, computes cents, preserves keyboard focus, removes and clears', async ({ page }) => {
    await openBookstore(page);
    const first = books[0];
    const second = books.find(book => book.id === 'small-repair');
    await page.getByRole('button', { name: addName(first), exact: true }).click();
    await page.getByRole('button', { name: addName(first), exact: true }).click();
    await page.getByRole('button', { name: addName(second), exact: true }).click();
    await expectBag(page, 3, first.priceCents * 2 + second.priceCents);
    await expect(page.locator('#bag-lines > li')).toHaveCount(2);
    const increase = page.getByRole('button', { name: `增加《${first.title}》的数量`, exact: true });
    await increase.focus();
    await increase.press('Enter');
    await expect(increase).toBeFocused();
    await expect(page.getByLabel(quantityName(first), { exact: true })).toHaveText('3');
    await expectBag(page, 4, first.priceCents * 3 + second.priceCents);
    const decrease = page.getByRole('button', { name: `减少《${first.title}》的数量`, exact: true });
    await decrease.focus();
    await decrease.press('Enter');
    await expect(decrease).toBeFocused();
    await expectBag(page, 3, first.priceCents * 2 + second.priceCents);
    await page.getByLabel('图书分类', { exact: true }).selectOption('设计');
    await expectBag(page, 3, first.priceCents * 2 + second.priceCents);
    const removeSecond = page.getByRole('button', { name: `移除《${second.title}》`, exact: true });
    await removeSecond.focus();
    await removeSecond.press('Enter');
    const removeFirst = page.getByRole('button', { name: `移除《${first.title}》`, exact: true });
    await expect(removeFirst).toBeFocused();
    await expectBag(page, 2, first.priceCents * 2);
    await removeFirst.press('Enter');
    await expect(page.locator('#bag-heading')).toBeFocused();
    await expectBag(page, 0, 0);
    await expect(page.locator('#bag-empty')).toBeVisible();
    await page.getByRole('button', { name: '重置筛选', exact: true }).click();
    await page.getByRole('button', { name: addName(first), exact: true }).click();
    const clear = page.getByRole('button', { name: '清空购物袋', exact: true });
    await clear.click();
    await expect(clear).toBeFocused();
    await expectBag(page, 0, 0);
    await expect(page.locator('#bag-message')).toHaveText('模拟购物袋已清空。');
});

test('sold-out and stock limits work offline without storage, and reload resets the bag', async ({ page, context, baseURL }) => {
    const errors = [];
    const unexpectedRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
        const url = new URL(request.url());
        if (url.origin !== new URL(baseURL).origin || !url.pathname.startsWith(demoPath)) unexpectedRequests.push(request.url());
    });
    await page.addInitScript(() => {
        for (const key of ['localStorage', 'sessionStorage']) {
            Object.defineProperty(window, key, { get() { throw new Error('Storage unavailable'); } });
        }
    });
    await openBookstore(page);
    const soldOut = books.find(book => book.stock === 0);
    const limited = books.find(book => book.stock === 1);
    await expect(page.getByRole('button', { name: addName(soldOut), exact: true })).toBeDisabled();
    await context.setOffline(true);
    const add = page.getByRole('button', { name: addName(limited), exact: true });
    await add.click();
    await expect(add).toHaveAttribute('aria-disabled', 'true');
    const increase = page.getByRole('button', { name: `增加《${limited.title}》的数量`, exact: true });
    await expect(increase).toHaveAttribute('aria-disabled', 'true');
    await increase.focus();
    await increase.press('Enter');
    await expect(increase).toBeFocused();
    await expectBag(page, 1, limited.priceCents);
    await expect(page.locator('#bag-message')).toContainText('示例库存上限 1 本');
    const decrease = page.getByRole('button', { name: `减少《${limited.title}》的数量`, exact: true });
    await decrease.focus();
    await decrease.press('Enter');
    await expect(page.locator('#bag-heading')).toBeFocused();
    await expectBag(page, 0, 0);
    await add.click();
    await context.setOffline(false);
    await page.reload();
    await expect(page.locator('[data-bookstore]')).toHaveAttribute('data-ready', 'true');
    await expectBag(page, 0, 0);
    expect(errors).toEqual([]);
    expect(unexpectedRequests).toEqual([]);
});

test('skip navigation, desktop bag and both pages fit 320px and 390px screens', async ({ page }) => {
    await openBookstore(page);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '跳到正文', exact: true })).toBeFocused();
    const catalog = page.locator('a[data-demo-catalog]');
    if (await catalog.count()) {
        await page.keyboard.press('Tab');
        await expect(catalog).toBeFocused();
        await expect(catalog).toHaveText('← 返回演示目录');
    }
    for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 960 });
        await openBookstore(page);
        await expect(page.locator('main h1')).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        if (width === 1280) {
            const shelf = await page.locator('.catalog').boundingBox();
            const bag = await page.locator('.bag-panel').boundingBox();
            if (demo.templateId === 'checklist') expect(bag.y).toBeGreaterThan(shelf.y + shelf.height);
            else expect(bag.x).toBeGreaterThan(shelf.x + shelf.width);
            await expect(page.getByRole('heading', { name: '模拟购物袋', exact: true })).toBeVisible();
        }
        await page.goto(`${demoPath}about/`);
        await expect(page.locator('main h1')).toHaveText('关于这间纸上书店');
        await expect(page.locator('main h1')).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    }
});

test.describe('bookstore without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('retains twelve static books and a visible explanatory paragraph with disabled controls', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 960 });
        await page.goto(demoPath);
        await expect(page.locator('#book-grid .book-card')).toHaveCount(12);
        const note = page.locator('p.noscript-note');
        await expect(note).toBeVisible();
        await expect(note).toContainText('保留全部静态书目');
        await expect(page.getByLabel('图书分类', { exact: true })).toBeDisabled();
        await expect(page.getByLabel('书名关键词', { exact: true })).toBeDisabled();
        await expect(page.getByRole('button', { name: '重置筛选', exact: true })).toBeDisabled();
        for (const book of books) {
            const card = page.getByRole('article', { name: book.title, exact: true });
            await expect(card.locator('.book-price')).toHaveText(money(book.priceCents));
            await expect(card.getByRole('button', { name: addName(book), exact: true })).toBeDisabled();
        }
        await expectBag(page, 0, 0);
        await expect(page.getByRole('button', { name: '清空购物袋', exact: true })).toBeDisabled();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
    });
});

});
}
