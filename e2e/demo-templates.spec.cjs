const { test, expect } = require('@playwright/test');
const { createHash } = require('node:crypto');
const { DEMO_CASES, DEMO_REGISTRY } = require('../scripts/demo-registry.cjs');

const embeddedData = {
    'content-dashboard': { id: 'dashboard-data', source: require('../demos/content-dashboard/data/entries.json') },
    bookstore: { id: 'bookstore-data', source: require('../demos/bookstore/data/books.json') },
    'workshop-booking': { id: 'booking-data', source: require('../demos/workshop-booking/data/schedule.json') },
    'trip-planner': { id: 'planner-data', source: require('../demos/trip-planner/data/places.json') },
};
const portfolioCases = DEMO_CASES.filter(demo => !embeddedData[demo.id] && !demo.differentContent);
const detailPattern = /^(?:works|projects)\/[^/]+\/$/;

function versionsFor(demoCase) {
    return DEMO_REGISTRY.filter(demo => demo.caseId === demoCase.id);
}

function sitePath(baseURL, relativePath) {
    const base = new URL(baseURL);
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    return new URL(relativePath, base).pathname;
}

function pagePath(demo, route, baseURL) {
    return sitePath(baseURL, demo.path + route);
}

function representativeRoute(demoCase) {
    return demoCase.checks.pages.includes('about/') ? 'about/'
        : demoCase.checks.pages.find(route => detailPattern.test(route));
}

function switchRoutes(demoCase) {
    const detail = demoCase.checks.pages.find(route => detailPattern.test(route));
    const project = demoCase.checks.pages.find(route => /^projects\/[^/]+\/$/.test(route));
    return [...new Set(['', representativeRoute(demoCase), detail, project].filter(route => route !== undefined))];
}

async function openDemo(page, demo, route, baseURL) {
    const target = pagePath(demo, route, baseURL);
    const response = await page.goto(target);
    expect(response?.ok(), `${target} must exist`).toBe(true);
    await expect(page.locator('body')).toHaveAttribute('data-template', demo.templateId);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main h1')).toBeVisible();
}

async function expectTemplateNavigation(page, demo, route, baseURL) {
    const nav = page.locator('nav[data-demo-templates]');
    await expect(nav).toHaveCount(1);
    await expect(nav).toBeVisible();
    await expect(nav.locator('a[data-demo-template]')).toHaveCount(demo.siblings.length);
    for (const sibling of demo.siblings) {
        const link = nav.locator(`a[data-demo-template="${sibling.id}"]`);
        await expect(link).toHaveText(sibling.label);
        await expect(link).toHaveAttribute('href', sitePath(baseURL, sibling.path + (demo.differentContent ? '' : route)));
        if (sibling.id === demo.templateId) await expect(link).toHaveAttribute('aria-current', 'page');
    }
    await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
    const catalog = page.locator('a[data-demo-catalog]');
    await expect(catalog).toHaveCount(1);
    await expect(catalog).toHaveText('← 返回演示目录');
    await expect(catalog).toHaveAttribute('href', sitePath(baseURL, 'demos/'));
    await expect(catalog).toBeVisible();
}

async function embeddedJSON(page, id) {
    const data = page.locator(`script#${id}[type="application/json"]`);
    await expect(data).toHaveCount(1);
    return JSON.parse(await data.textContent());
}

async function workLinks(page, demo, baseURL, detailRoutes) {
    const prefix = sitePath(baseURL, demo.path);
    const expectedOrigin = new URL(page.url()).origin;
    const links = await page.locator('main a[href]').evaluateAll((anchors, options) => {
        return anchors.map(anchor => {
            const url = new URL(anchor.href);
            const route = url.pathname.startsWith(options.prefix) ? url.pathname.slice(options.prefix.length) : null;
            return { route, origin: url.origin };
        }).filter(link => options.routes.includes(link.route));
    }, { prefix, routes: detailRoutes });
    expect(links.every(link => link.origin === expectedOrigin), 'Work detail links must stay on this site').toBe(true);
    return [...new Set(links.map(link => link.route))].sort();
}

async function originalImages(page, demo, route, baseURL) {
    const selector = demo.caseId === 'photo-portfolio' ? 'main .detail-figure img' : 'main .detail-cover img, main .prose img';
    const images = page.locator(selector);
    expect(await images.count(), `${demo.caseId} ${route} must retain its original media`).toBeGreaterThan(0);
    const prefix = sitePath(baseURL, demo.path);
    const expectedOrigin = new URL(page.url()).origin;
    const records = [];
    for (const image of await images.all()) {
        const source = new URL(await image.getAttribute('src'), page.url());
        expect(source.origin).toBe(expectedOrigin);
        expect(source.pathname.startsWith(prefix), 'Original media must stay within its demo').toBe(true);
        const response = await page.request.get(source.href);
        expect(response.ok(), `${source.pathname} must load`).toBe(true);
        const body = await response.body();
        expect(body.length).toBeGreaterThan(0);
        records.push({
            path: source.pathname.slice(prefix.length),
            alt: await image.getAttribute('alt'),
            sha256: createHash('sha256').update(body).digest('hex'),
        });
    }
    return records.sort((left, right) => left.path.localeCompare(right.path));
}

for (const demoCase of DEMO_CASES.filter(demo => embeddedData[demo.id])) {
    test(`${demoCase.id} templates embed the same complete source data`, async ({ page, baseURL }) => {
        const versions = versionsFor(demoCase);
        expect(versions).toHaveLength(demoCase.templates.length);
        const fixture = embeddedData[demoCase.id];
        const data = [];
        for (const demo of versions) {
            await openDemo(page, demo, '', baseURL);
            data.push(await embeddedJSON(page, fixture.id));
        }
        expect(data[0]).toEqual(fixture.source);
        for (const versionData of data) expect(versionData).toEqual(fixture.source);
    });
}

for (const demoCase of portfolioCases) {
    const detailRoutes = demoCase.checks.pages.filter(route => detailPattern.test(route));
    test(`${demoCase.id} templates retain the same homepage title and work links`, async ({ page, baseURL }) => {
        const versions = versionsFor(demoCase);
        expect(versions).toHaveLength(demoCase.templates.length);
        expect(detailRoutes.length).toBeGreaterThan(0);
        const records = [];
        for (const demo of versions) {
            await openDemo(page, demo, '', baseURL);
            const links = await workLinks(page, demo, baseURL, detailRoutes);
            expect(links).toEqual([...detailRoutes].sort());
            // Compare authored content independently of presentation-only line breaks.
            records.push({ title: (await page.locator('main h1').textContent()).trim(), links });
        }
        for (const record of records) expect(record).toEqual(records[0]);
    });

    for (const route of detailRoutes) {
        test(`${demoCase.id} ${route} retains its title and original image content in every template`, async ({ page, baseURL }) => {
            const records = [];
            for (const demo of versionsFor(demoCase)) {
                await openDemo(page, demo, route, baseURL);
                await expectTemplateNavigation(page, demo, route, baseURL);
                records.push({
                    title: await page.locator('main h1').innerText(),
                    images: await originalImages(page, demo, route, baseURL),
                });
            }
            expect(records).toHaveLength(demoCase.templates.length);
            for (const record of records) expect(record).toEqual(records[0]);
        });
    }
}

for (const demoCase of DEMO_CASES) {
    const versions = versionsFor(demoCase);
    for (const route of [...new Set(versions.flatMap(demo => switchRoutes(demo)))]) {
        test(`${demoCase.id} templates switch between every pair on ${route || 'home'} with skip and catalog first`, async ({ page, baseURL }) => {
            expect(versions).toHaveLength(demoCase.templates.length);
            for (const demo of versions.filter(demo => demo.checks.pages.includes(route))) {
                await openDemo(page, demo, route, baseURL);
                await expectTemplateNavigation(page, demo, route, baseURL);
                await page.keyboard.press('Tab');
                await expect(page.locator('a.skip-link')).toBeFocused();
                await page.keyboard.press('Tab');
                await expect(page.locator('a[data-demo-catalog]')).toBeFocused();
                for (const sibling of versions.filter(candidate => candidate.templateId !== demo.templateId)) {
                    const destinationRoute = demo.differentContent ? '' : route;
                    await openDemo(page, demo, route, baseURL);
                    await page.locator("[data-demo-template-menu] > summary").click();
                    await page.locator(`nav[data-demo-templates] a[data-demo-template="${sibling.templateId}"]`).click();
                    await expect(page).toHaveURL(url => url.pathname === pagePath(sibling, destinationRoute, baseURL));
                    await expect(page.locator('body')).toHaveAttribute('data-template', sibling.templateId);
                    await expectTemplateNavigation(page, sibling, destinationRoute, baseURL);
                    await expect(page.locator('main h1')).toHaveCount(1);
                }
            }
        });
    }
}

for (const demo of DEMO_REGISTRY) {
    for (const width of [320, 390, 1280]) {
        test(`${demo.id} home and ${representativeRoute(demo)} fit ${width}px`, async ({ page, baseURL }, testInfo) => {
            await page.setViewportSize({ width, height: 960 });
            await page.emulateMedia({ reducedMotion: 'reduce' });
            for (const route of ['', representativeRoute(demo)]) {
                await openDemo(page, demo, route, baseURL);
                await expectTemplateNavigation(page, demo, route, baseURL);
                for (const image of await page.locator('main img').all()) {
                    if (!await image.isVisible()) continue;
                    await image.scrollIntoViewIfNeeded();
                    await expect(image).toHaveJSProperty('complete', true);
                    await expect.poll(() => image.evaluate(node => node.naturalWidth)).toBeGreaterThan(0);
                }
                await page.evaluate(() => window.scrollTo(0, 0));
                const dimensions = await page.evaluate(() => ({
                    viewport: document.documentElement.clientWidth,
                    page: document.documentElement.scrollWidth,
                }));
                expect(dimensions.viewport).toBeGreaterThan(0);
                expect(dimensions.viewport).toBeLessThanOrEqual(width);
                expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
                if (route === '') {
                    await testInfo.attach(`${demo.caseId}-${demo.templateId}-${width}px`, {
                        body: await page.screenshot({ fullPage: true }),
                        contentType: 'image/png',
                    });
                }
            }
        });
    }
}

test.describe('new templates without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    for (const demo of DEMO_REGISTRY) {
        const demoCase = DEMO_CASES.find(candidate => candidate.id === demo.caseId);
        test(`${demoCase.id} ${demo.templateId} retains content and usable template navigation`, async ({ page, baseURL }) => {
            await page.setViewportSize({ width: 320, height: 960 });
            await openDemo(page, demo, '', baseURL);
            await expectTemplateNavigation(page, demo, '', baseURL);
            const fixture = embeddedData[demoCase.id];
            if (fixture) {
                expect(await embeddedJSON(page, fixture.id)).toEqual(fixture.source);
                await expect(page.locator('p.noscript-note')).toBeVisible();
                if (demo.caseId === 'content-dashboard') await expect(page.locator('#content-rows > tr')).toHaveCount(fixture.source.length);
                if (demo.caseId === 'bookstore') await expect(page.locator('#book-grid > .book-card')).toHaveCount(fixture.source.length);
                if (demo.caseId === 'workshop-booking') {
                    await expect(page.locator('[data-course-id]')).toHaveCount(fixture.source.courses.length);
                    await expect(page.locator('[data-session-id]')).toHaveCount(fixture.source.sessions.length);
                }
                if (demo.caseId === 'trip-planner') {
                    await expect(page.locator('[data-place-card]')).toHaveCount(fixture.source.length);
                    await expect(page.locator('[data-map-id]')).toHaveCount(fixture.source.length);
                }
                for (const control of await page.locator('main button, main select, main input').all()) await expect(control).toBeDisabled();
            } else {
                const routes = demo.checks.pages.filter(route => detailPattern.test(route));
                expect(await workLinks(page, demo, baseURL, routes)).toEqual([...routes].sort());
                for (const route of routes) await expect(page.locator(`main a[href="${pagePath(demo, route, baseURL)}"]`).first()).toBeVisible();
                await expect(page.locator('main img').first()).toBeVisible();
            }
            const classic = versionsFor(demoCase).find(candidate => candidate.templateId === demoCase.defaultTemplate);
            await page.locator("[data-demo-template-menu] > summary").click();
            await page.locator(`nav[data-demo-templates] a[data-demo-template="${classic.templateId}"]`).click();
            await expect(page).toHaveURL(url => url.pathname === pagePath(classic, '', baseURL));
            await expect(page.locator('body')).toHaveAttribute('data-template', classic.templateId);
            const route = representativeRoute(classic);
            await openDemo(page, classic, route, baseURL);
            await page.locator("[data-demo-template-menu] > summary").click();
            await page.locator(`nav[data-demo-templates] a[data-demo-template="${demo.templateId}"]`).click();
            await expect(page).toHaveURL(url => url.pathname === pagePath(demo, demo.differentContent ? '' : route, baseURL));
            await expect(page.locator('body')).toHaveAttribute('data-template', demo.templateId);
            await expect(page.locator('main h1')).toBeVisible();
        });
    }
});

test('trip journal cumulative ranges follow reordering and end at the total minutes', async ({ page, baseURL }) => {
    const demo = DEMO_REGISTRY.find(candidate => candidate.caseId === 'trip-planner' && candidate.templateId === 'journal');
    const places = embeddedData['trip-planner'].source;
    const selected = places.slice(0, 3);
    await openDemo(page, demo, '', baseURL);
    await expect(page.locator('[data-trip-planner]')).toHaveAttribute('data-ready', 'true');
    for (const place of selected) await page.getByRole('button', { name: `加入${place.name}`, exact: true }).click();

    async function expectRanges(ordered) {
        let elapsed = 0;
        const expected = ordered.map((place, index) => {
            const start = elapsed + (index === 0 ? 0 : 20);
            elapsed = start + place.durationMinutes;
            return { id: place.id, text: `累计 ${start} — ${elapsed} 分钟` };
        });
        const actual = await page.locator('#itinerary-list > li').evaluateAll(items => items.map(item => ({
            id: item.dataset.stopId,
            text: item.querySelector('.stop-time')?.textContent,
        })));
        expect(actual).toEqual(expected);
        const total = ordered.reduce((sum, place) => sum + place.durationMinutes, 0) + Math.max(0, ordered.length - 1) * 20;
        expect(elapsed).toBe(total);
        await expect(page.locator('[data-total="totalMinutes"]')).toHaveText(String(total));
        const finalRange = await page.locator('#itinerary-list .stop-time').last().innerText();
        expect(Number(finalRange.match(/—\s*(\d+)\s*分钟$/)[1])).toBe(total);
    }

    await expectRanges(selected);
    await page.getByRole('button', { name: `上移${selected[2].name}`, exact: true }).click();
    await expectRanges([selected[0], selected[2], selected[1]]);
});
