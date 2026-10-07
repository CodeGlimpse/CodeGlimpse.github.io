const { test, expect } = require('@playwright/test');
const { DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');
const demos = DEMO_REGISTRY.filter(demo => demo.caseId === 'content-dashboard');
const number = value => value.toLocaleString('zh-CN');

function sitePath(baseURL, relativePath) {
    const base = new URL(baseURL);
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    return new URL(relativePath, base).pathname;
}

async function openDashboard(page, demo, baseURL) {
    await page.goto(sitePath(baseURL, demo.path));
    await expect(page.locator('[data-dashboard]')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('body')).toHaveAttribute('data-template', demo.templateId);
}

async function showRecords(page, demo) {
    if (demo.templateId === 'workspace') {
        await page.locator('a[data-workspace-view="records"]').click();
        await expect(page.locator('[data-workspace-panel="records"]')).toBeVisible();
    } else if (demo.templateId === 'report') {
        const details = page.locator('[data-report-records]');
        if (!await details.evaluate(node => node.open)) await details.locator('summary').click();
        await expect(details).toHaveJSProperty('open', true);
    }
}

async function showOverview(page, demo) {
    if (demo.templateId === 'workspace') {
        await page.locator('a[data-workspace-view="overview"]').click();
        await expect(page.locator('[data-workspace-panel="overview"]')).toBeVisible();
    }
}

async function expectTotals(page, count, views, interactions) {
    await expect(page.locator('[data-metric=count]')).toHaveText(number(count));
    await expect(page.locator('[data-metric=views]')).toHaveText(number(views));
    await expect(page.locator('[data-metric=interactions]')).toHaveText(number(interactions));
    await expect(page.locator('[data-metric=rate]')).toHaveText(`${(views ? interactions / views * 100 : 0).toFixed(2)}%`);
    await expect(page.locator('#content-rows tr')).toHaveCount(count);
    if (await page.locator('[data-monthly-chart]').count()) {
        const sum = values => values.reduce((total, value) => total + Number(value.replace(/,/g, '')), 0);
        expect(sum(await page.locator('[data-monthly-views]').allTextContents())).toBe(views);
        expect(sum(await page.locator('[data-monthly-count]').allTextContents())).toBe(count);
    }
}

for (const demo of demos) {
    const entries = require('../' + demo.source + '/' + (demo.dataDir || 'data') + '/entries.json');
    const channels = [...new Set(entries.map(row => row.channel))];
    const months = [...new Set(entries.map(row => row.published.slice(0, 7)))].sort();
    const firstChannel = channels[0];
    const lastMonth = months.at(-1);
    const filtered = entries.filter(row => row.published.startsWith(lastMonth) && row.channel === firstChannel);
    const totalViews = entries.reduce((sum, row) => sum + row.views, 0);
    const totalInteractions = entries.reduce((sum, row) => sum + row.interactions, 0);
    const filteredViews = filtered.reduce((sum, row) => sum + row.views, 0);
    const filteredInteractions = filtered.reduce((sum, row) => sum + row.interactions, 0);
    const topEntry = entries.toSorted((a, b) => b.views - a.views)[0];
    const filteredTop = filtered.toSorted((a, b) => b.views - a.views)[0];
    const zeroEntry = entries.find(row => row.views === 0);
    const sampleEntry = entries[11];
    test.describe(demo.templateId, () => {
        test('dashboard filters link exact totals, channel bars, and table records', async ({ page, baseURL }) => {
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await openDashboard(page, demo, baseURL);
            await expectTotals(page, 24, totalViews, totalInteractions);
            expect(await page.locator('#dashboard-data').evaluate(node => JSON.parse(node.textContent))).toEqual(entries);
            expect(await page.locator('#month-filter option').evaluateAll(options => options.map(option => option.value))).toEqual(['all', ...months]);
            expect(await page.locator('#channel-filter option').evaluateAll(options => options.map(option => option.value))).toEqual(['all', ...channels]);
            await page.getByLabel('发布月份', { exact: true }).selectOption(lastMonth);
            await page.locator('#channel-filter').selectOption(firstChannel);
            await expectTotals(page, filtered.length, filteredViews, filteredInteractions);
            expect(new Set(await page.locator('#content-rows tr').evaluateAll(rows => rows.map(row => row.dataset.entryId)))).toEqual(new Set(filtered.map(row => row.id)));
            for (const channel of channels) await expect(page.locator(`[data-channel="${channel}"] .channel-total`)).toHaveText(channel === firstChannel ? number(filteredViews) : '0');
            await showOverview(page, demo);
            const widths = await page.locator(`[data-channel="${firstChannel}"] .bar-track`).evaluate(track => ({ track: track.getBoundingClientRect().width, bar: track.firstElementChild.getBoundingClientRect().width }));
            expect(widths.bar).toBeGreaterThan(0);
            expect(widths.bar).toBeCloseTo(widths.track, 1);
            if (demo.templateId !== 'classic') {
                await expect(page.locator(`[data-month="${lastMonth}"] [data-monthly-views]`)).toHaveText(number(filteredViews));
                await expect(page.locator(`[data-month="${lastMonth}"] [data-monthly-count]`)).toHaveText(String(filtered.length));
            }
            expect(errors).toEqual([]);
        });

        test('keyboard search and reset keep the selected scene records and first focus target', async ({ page, baseURL }) => {
            await openDashboard(page, demo, baseURL);
            await page.keyboard.press('Tab');
            await expect(page.locator('.skip-link')).toBeFocused();
            await showRecords(page, demo);
            const search = page.getByLabel('标题关键词');
            await search.focus();
            await search.fill(sampleEntry.title);
            await search.press('Enter');
            await expectTotals(page, 1, sampleEntry.views, sampleEntry.interactions);
            const reset = page.getByRole('button', { name: '重置', exact: true });
            await reset.focus();
            await reset.press('Enter');
            await expectTotals(page, entries.length, totalViews, totalInteractions);
            await expect(reset).toBeFocused();
        });

        test('sorting changes only row order and compares numeric rates and dates', async ({ page, baseURL }) => {
            await openDashboard(page, demo, baseURL);
            await showRecords(page, demo);
            const metricBefore = await page.locator('[data-metric]').allTextContents();
            for (const field of ['views', 'interactions', 'rate', 'published']) {
                await page.getByLabel('排序依据').selectOption(field);
                for (const direction of ['asc', 'desc']) {
                    await page.getByLabel('排序方向').selectOption(direction);
                    const ids = await page.locator('#content-rows tr').evaluateAll(rows => rows.map(row => row.dataset.entryId));
                    const ordered = ids.map(id => entries.find(row => row.id === id));
                    const value = row => field === 'rate' ? (row.views ? row.interactions / row.views : 0) : row[field];
                    for (let i = 1; i < ordered.length; i++) {
                        expect(direction === 'asc' ? value(ordered[i - 1]) <= value(ordered[i]) : value(ordered[i - 1]) >= value(ordered[i])).toBe(true);
                    }
                }
            }
            expect(await page.locator('[data-metric]').allTextContents()).toEqual(metricBefore);
        });

        test('search handles composition, empty results, zero views, and reset', async ({ page, baseURL }) => {
            await openDashboard(page, demo, baseURL);
            await showRecords(page, demo);
            const search = page.getByLabel('标题关键词');
            await search.focus();
            await search.dispatchEvent('compositionstart');
            await search.fill('不存在的标题');
            await expect(page.locator('#content-rows tr')).toHaveCount(24);
            await search.dispatchEvent('compositionend');
            await expectTotals(page, 0, 0, 0);
            await expect(page.locator('#empty-state')).toBeVisible();
            await expect(search).toBeFocused();
            await search.fill(zeroEntry.title);
            await expectTotals(page, 1, 0, 0);
            await expect(page.locator('#empty-state')).toBeHidden();
            await expect(page.locator('[data-cell=rate]')).toHaveText('0.00%');
            await page.getByRole('button', { name: '重置', exact: true }).click();
            await expectTotals(page, 24, totalViews, totalInteractions);
            await expect(search).toHaveValue('');
            await expect(page.locator('#content-rows tr').first()).toHaveAttribute('data-entry-id', topEntry.id);
        });

        test('dashboard filters offline without storage access or external requests', async ({ page, context, baseURL }) => {
            const externalRequests = [];
            page.on('request', request => {
                if (new URL(request.url()).origin !== new URL(baseURL).origin) externalRequests.push(request.url());
            });
            await page.addInitScript(() => {
                for (const key of ['localStorage', 'sessionStorage']) {
                    Object.defineProperty(window, key, { get() { throw new Error('Storage unavailable'); } });
                }
            });
            await openDashboard(page, demo, baseURL);
            await context.setOffline(true);
            await page.getByLabel('标题关键词').fill(sampleEntry.title);
            await expectTotals(page, 1, sampleEntry.views, sampleEntry.interactions);
            await context.setOffline(false);
            expect(externalRequests).toEqual([]);
        });

        test('dashboard views and explanation fit phone, tablet and desktop after rendering', async ({ page, baseURL }) => {
            await page.emulateMedia({ reducedMotion: 'reduce' });
            for (const width of [320, 390, 800, 1280]) {
                await page.setViewportSize({ width, height: 960 });
                await openDashboard(page, demo, baseURL);
                await expect(page.locator('main h1')).toHaveCount(1);
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
                if (demo.templateId === 'classic') {
                    const titleBox = await page.locator('#content-rows [data-cell=title]').first().boundingBox();
                    expect(titleBox.width).toBeGreaterThan(width <= 390 ? width * .6 : 100);
                    for (const key of ['views', 'interactions', 'rate']) {
                        const box = await page.locator(`#content-rows [data-cell=${key}]`).first().boundingBox();
                        expect(box.width).toBeGreaterThan(50);
                    }
                } else {
                    if (demo.templateId === 'workspace') {
                        const sidebar = page.getByRole('complementary', { name: '内容工作区导航与筛选' });
                        await expect(sidebar).toBeVisible();
                        const filters = page.locator('[data-workspace-filters]');
                        await expect(filters).toHaveJSProperty('open', width > 700);
                        if (width <= 700) await filters.locator('summary').click();
                        await expect(sidebar.getByLabel('标题关键词')).toBeVisible();
                        await expect(page.locator('[data-workspace]')).toHaveCSS('display', 'grid');
                        await expect(page.locator('[data-workspace-panel="overview"]')).toBeVisible();
                        await expect(page.locator('[data-workspace-panel="records"]')).toBeHidden();
                        const sidebarBox = await sidebar.boundingBox();
                        const mainBox = await page.locator('.workspace-main').boundingBox();
                        if (width >= 800) expect(sidebarBox.x + sidebarBox.width).toBeLessThanOrEqual(mainBox.x + 1);
                        else expect(sidebarBox.y + sidebarBox.height).toBeLessThanOrEqual(mainBox.y + 1);
                    }
                    await showRecords(page, demo);
                    await expect(page.locator('#content-rows tr:visible')).toHaveCount(entries.length);
                    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
                    const record = await page.locator('#content-rows tr').first().boundingBox();
                    for (const key of ['title', 'views', 'interactions', 'rate']) {
                        const cell = page.locator(`#content-rows [data-cell=${key}]`).first();
                        await expect(cell).toBeVisible();
                        const box = await cell.boundingBox();
                        expect(box.x).toBeGreaterThanOrEqual(record.x - 1);
                        expect(box.x + box.width).toBeLessThanOrEqual(record.x + record.width + 1);
                    }
                }
                await page.goto(sitePath(baseURL, demo.path + 'about/'));
                await expect(page.locator('main h1')).toHaveText('数据说明');
                await expect(page.locator('main h1')).toHaveCount(1);
                await expect(page.locator('body')).toHaveAttribute('data-template', demo.templateId);
                expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
            }
        });

        if (demo.templateId === 'workspace') {
            test('workspace navigation preserves filters and links its spotlight to the record drawer', async ({ page, baseURL }) => {
                await openDashboard(page, demo, baseURL);
                await expect(page.locator('a[data-workspace-view="overview"]')).toHaveAttribute('aria-current', 'page');
                await page.getByLabel('发布月份', { exact: true }).selectOption(lastMonth);
                await page.locator('#channel-filter').selectOption(firstChannel);
                await expectTotals(page, filtered.length, filteredViews, filteredInteractions);
                await showRecords(page, demo);
                await expect(page.locator('a[data-workspace-view="records"]')).toHaveAttribute('aria-current', 'page');
                await expect(page.locator('[data-workspace-panel="overview"]')).toBeHidden();
                await expect(page.locator('[data-workspace-count]')).toHaveText('3');
                await showOverview(page, demo);
                await expect(page.getByLabel('发布月份', { exact: true })).toHaveValue(lastMonth);
                await expect(page.locator('#channel-filter')).toHaveValue(firstChannel);
                await expectTotals(page, filtered.length, filteredViews, filteredInteractions);
                const top = filteredTop;
                await expect(page.locator('[data-spotlight-title]')).toHaveText(top.title);
                await page.locator('[data-spotlight-open]').click();
                const dialog = page.getByRole('dialog');
                await expect(dialog).toBeVisible();
                await expect(dialog.locator('[data-record-field="title"]')).toHaveText(top.title);
                await expect(dialog.locator('[data-record-rank]')).toHaveText('第 1 / 3 条');
                await expect(dialog.locator('[data-record-share]')).toHaveText(`${(top.views / filteredViews * 100).toFixed(2)}%`);
                await expect(dialog.locator('[data-record-context]')).toContainText(`当前范围整体互动率为 ${(filteredInteractions / filteredViews * 100).toFixed(2)}%`);
                await page.keyboard.press('Escape');
                await expect(dialog).toBeHidden();
                await expect(page.locator('[data-spotlight-open]')).toBeFocused();
            });

            test('native record drawer exposes exact metrics, handles zero reading, and fits 320px', async ({ page, baseURL }) => {
                await page.emulateMedia({ reducedMotion: 'reduce' });
                for (const width of [320, 1280]) {
                    await page.setViewportSize({ width, height: 960 });
                    await openDashboard(page, demo, baseURL);
                    await showRecords(page, demo);
                    const top = topEntry;
                    const opener = page.locator('#content-rows').getByRole('button', { name: '打开记录：' + top.title, exact: true });
                    await opener.click();
                    const dialog = page.getByRole('dialog');
                    await expect(dialog).toBeVisible();
                    await expect(dialog.locator('[data-record-field="id"]')).toHaveText(top.id);
                    await expect(dialog.locator('[data-record-field="published"]')).toHaveText(top.published);
                    await expect(dialog.locator('[data-record-field="channel"]')).toHaveText(top.channel);
                    await expect(dialog.locator('[data-record-field="views"]')).toHaveText(number(top.views));
                    await expect(dialog.locator('[data-record-field="interactions"]')).toHaveText(number(top.interactions));
                    await expect(dialog.locator('[data-record-field="rate"]')).toHaveText(`${(top.interactions / top.views * 100).toFixed(2)}%`);
                    await expect(dialog.locator('[data-record-share]')).toHaveText(`${(top.views / totalViews * 100).toFixed(2)}%`);
                    await expect(dialog.locator('[data-record-rank]')).toHaveText('第 1 / 24 条');
                    await expect(dialog.getByRole('button', { name: '关闭记录详情' })).toBeFocused();
                    expect(await dialog.evaluate(node => node.scrollWidth)).toBeLessThanOrEqual(width + 1);
                    const bounds = await dialog.boundingBox();
                    expect(bounds.x).toBeGreaterThanOrEqual(0);
                    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
                    await page.keyboard.press('Escape');
                    await expect(dialog).toBeHidden();
                    await expect(opener).toBeFocused();
                    const filters = page.locator('[data-workspace-filters]');
                    if (!await filters.evaluate(node => node.open)) await filters.locator('summary').click();
                    await page.getByLabel('标题关键词').fill(zeroEntry.title);
                    await expectTotals(page, 1, 0, 0);
                    await page.locator('#content-rows [data-record-open]').click();
                    await expect(dialog.locator('[data-record-field="views"]')).toHaveText('0');
                    await expect(dialog.locator('[data-record-field="rate"]')).toHaveText('0.00%');
                    await expect(dialog.locator('[data-record-share]')).toHaveText('0.00%');
                    await expect(dialog.locator('[data-record-context]')).toContainText('当前范围暂无阅读');
                    await dialog.getByRole('button', { name: '关闭记录详情' }).click();
                    await expect(dialog).toBeHidden();
                }
            });
        }

        if (demo.templateId === 'report') {
            test('report chapters navigate and record disclosure preserves filtered totals', async ({ page, baseURL }) => {
                await page.emulateMedia({ reducedMotion: 'reduce' });
                await openDashboard(page, demo, baseURL);
                const index = page.getByRole('navigation', { name: '报告章节' });
                await expect(index.locator('a')).toHaveCount(4);
                for (const section of ['summary', 'channels', 'records', 'method']) {
                    await expect(index.locator(`a[href="#report-${section}"]`)).toHaveCount(1);
                }
                const details = page.locator('[data-report-records]');
                await expect(details).toHaveJSProperty('open', false);
                await expect(page.locator('#content-rows tr:visible')).toHaveCount(0);
                await index.locator('a[href="#report-channels"]').click();
                await expect(page).toHaveURL(url => url.hash === '#report-channels');
                const position = await page.locator('#report-channels').evaluate(node => node.getBoundingClientRect().top);
                expect(position).toBeGreaterThanOrEqual(0);
                expect(position).toBeLessThan(160);
                await index.locator('a[href="#report-records"]').click();
                await details.locator('summary').focus();
                await page.keyboard.press('Enter');
                await expect(details).toHaveJSProperty('open', true);
                await expect(page.locator('#content-rows tr:visible')).toHaveCount(entries.length);
                await page.getByLabel('发布月份', { exact: true }).selectOption(lastMonth);
                await page.locator('#channel-filter').selectOption(firstChannel);
                await expectTotals(page, filtered.length, filteredViews, filteredInteractions);
                await expect(details).toHaveJSProperty('open', true);
                await expect(page.locator('[data-report-record-count]')).toHaveText('3 条记录');
                await details.locator('summary').click();
                await expect(details).toHaveJSProperty('open', false);
                await expect(page.locator('#content-rows tr:visible')).toHaveCount(0);
                await expectTotals(page, filtered.length, filteredViews, filteredInteractions);
                await showRecords(page, demo);
                await expect(page.locator('#content-rows tr:visible')).toHaveCount(3);
            });
        }

        test.describe('dashboard without JavaScript', () => {
            test.use({ javaScriptEnabled: false });
            test('retains complete visible records, readable charts, totals, and disabled controls', async ({ page, baseURL }) => {
                await page.goto(sitePath(baseURL, demo.path));
                await expectTotals(page, 24, totalViews, totalInteractions);
                await expect(page.locator('#content-rows tr:visible')).toHaveCount(entries.length);
                await expect(page.locator('.noscript-note')).toBeVisible();
                await expect(page.locator('.noscript-note')).toContainText('全部示例数据');
                await expect(page.getByLabel('发布月份', { exact: true })).toBeDisabled();
                await expect(page.locator('#channel-chart .channel-total')).toHaveCount(3);
                const channelSum = (await page.locator('#channel-chart .channel-total').allTextContents()).reduce((sum, value) => sum + Number(value.replace(/,/g, '')), 0);
                expect(channelSum).toBe(totalViews);
                if (demo.templateId === 'workspace') {
                    await expect(page.locator('[data-workspace-panel="overview"]')).toBeVisible();
                    await expect(page.locator('[data-workspace-panel="records"]')).toBeVisible();
                }
                if (demo.templateId === 'report') await expect(page.locator('[data-report-records]')).toHaveJSProperty('open', true);
                for (const control of await page.locator('main button, main select, main input').all()) await expect(control).toBeDisabled();
            });
        });
    });
}
