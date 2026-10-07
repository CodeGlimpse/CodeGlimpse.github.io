const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../demos/content-dashboard/static/js/dashboard-core.js');
const entries = require('../demos/content-dashboard/data/entries.json');

test('dashboard sample records have unique IDs, valid dates, channels, and counts', () => {
    assert.equal(entries.length, 24);
    assert.equal(new Set(entries.map(row => row.id)).size, entries.length);
    for (const month of ['2026-07', '2026-08', '2026-09']) {
        assert.equal(entries.filter(row => row.published.startsWith(month)).length, 8);
    }
    for (const row of entries) {
        assert.ok(row.title.trim());
        assert.equal(new Date(`${row.published}T00:00:00Z`).toISOString().slice(0, 10), row.published);
        assert.ok(['博客', '视频', '社区'].includes(row.channel));
        assert.ok(Number.isSafeInteger(row.views) && row.views >= 0);
        assert.ok(Number.isSafeInteger(row.interactions) && row.interactions >= 0 && row.interactions <= row.views);
    }
});

test('filters combine month, channel, and all literal search terms', () => {
    assert.deepEqual(core.filterRows(entries, { month: '2026-08', channel: '博客', query: ' 素材  标记 ' }).map(row => row.id), ['content-202608-04']);
    assert.equal(core.filterRows(entries, { month: '2026-07', query: '不存在' }).length, 0);
    assert.equal(core.filterRows(entries, { query: '[.*]' }).length, 0);
    assert.equal(core.filterRows(entries, { query: '博客' }).length, 0);
    const sample = [{ ...entries[0], title: 'HUGO Demo 2026' }];
    assert.equal(core.filterRows(sample, { query: 'ｈｕｇｏ　ｄｅｍｏ' }).length, 1);
    assert.equal(core.filterRows(entries).length, 24);
});

test('totals use the combined denominator instead of averaging row rates', () => {
    const rows = [{ views: 100, interactions: 10 }, { views: 900, interactions: 0 }];
    assert.deepEqual(core.summarize(rows), { count: 2, views: 1000, interactions: 10, rate: 1 });
    assert.deepEqual(core.summarize([]), { count: 0, views: 0, interactions: 0, rate: 0 });
    assert.deepEqual(core.summarize([{ views: 0, interactions: 0 }]), { count: 1, views: 0, interactions: 0, rate: 0 });
    assert.equal(core.summarize([{ views: 10, interactions: 15 }]).rate, 150);
});

test('numeric and date sorting work in both directions without changing records', () => {
    const before = structuredClone(entries);
    for (const key of ['views', 'interactions', 'published', 'rate']) {
        for (const direction of ['asc', 'desc']) {
            const sorted = core.sortRows(entries, key, direction);
            for (let i = 1; i < sorted.length; i++) {
                const value = row => key === 'rate' ? row.interactions / (row.views || 1) : row[key];
                assert.ok(direction === 'asc' ? value(sorted[i - 1]) <= value(sorted[i]) : value(sorted[i - 1]) >= value(sorted[i]));
            }
        }
    }
    assert.deepEqual(entries, before);
});

test('sorting keeps ties stable and treats zero denominators as zero', () => {
    const rows = [
        { id: 'a', views: 10, interactions: 1 },
        { id: 'b', views: 10, interactions: 1 },
        { id: 'c', views: 0, interactions: 0 },
    ];
    assert.deepEqual(core.sortRows(rows, 'views').map(row => row.id), ['a', 'b', 'c']);
    assert.deepEqual(core.sortRows(rows, 'rate', 'asc').map(row => row.id), ['c', 'a', 'b']);
    assert.equal(core.rateForRow(rows[2]), 0);
});

test('channel chart reconciles with the exact filtered total including empty data', () => {
    for (const rows of [entries, core.filterRows(entries, { month: '2026-09', channel: '社区' }), []]) {
        const chart = core.groupByChannel(rows, core.getChannels(entries));
        assert.deepEqual(chart.map(item => item.channel), ['博客', '视频', '社区']);
        assert.equal(chart.reduce((sum, item) => sum + item.views, 0), core.summarize(rows).views);
        for (const item of chart) assert.ok(item.views >= 0);
    }
});

const scenes = {
    classic: entries,
    workspace: require('../demos/content-dashboard/variants/workspace/data/entries.json'),
    report: require('../demos/content-dashboard/variants/report/data/entries.json'),
};

test('independent dashboard scenes use disjoint records, months and publishing surfaces', () => {
    const expected = {
        classic: { months: ['2026-07', '2026-08', '2026-09'], channels: ['博客', '视频', '社区'] },
        workspace: { months: ['2026-04', '2026-05', '2026-06'], channels: ['官网', '社媒', '邮件'] },
        report: { months: ['2026-01', '2026-02', '2026-03'], channels: ['正片', '幕后', '预告'] },
    };
    const allIds = new Set();
    const allTitles = new Set();
    for (const [scene, rows] of Object.entries(scenes)) {
        assert.equal(core.validateRows(rows), rows);
        assert.equal(rows.length, 24);
        assert.deepEqual(core.getMonths(rows), expected[scene].months);
        assert.deepEqual(core.getChannels(rows), expected[scene].channels);
        for (const row of rows) {
            assert.equal(allIds.has(row.id), false, `ID shared by scenes: ${row.id}`);
            assert.equal(allTitles.has(row.title), false, `Title shared by scenes: ${row.title}`);
            allIds.add(row.id);
            allTitles.add(row.title);
        }
        for (const month of expected[scene].months) {
            for (const channel of expected[scene].channels) {
                const filtered = core.filterRows(rows, { month, channel });
                assert.ok(filtered.length > 0);
                assert.equal(core.groupByChannel(filtered, expected[scene].channels).reduce((sum, item) => sum + item.views, 0), core.summarize(filtered).views);
            }
        }
        const zero = rows.find(row => row.views === 0);
        assert.ok(zero, `${scene} keeps a zero-reading boundary`);
        assert.equal(core.rateForRow(zero), 0);
    }
});

test('dynamic dashboard domains keep missing channels at zero without accepting malformed records', () => {
    const row = scenes.workspace[0];
    assert.throws(() => core.validateRows([]), /non-empty/);
    assert.throws(() => core.validateRows([row, row]), /unique/);
    assert.throws(() => core.validateRows([{ ...row, published: '2026-02-30' }]), /date/);
    assert.throws(() => core.validateRows([{ ...row, published: '2026-13-01' }]), /date/);
    assert.throws(() => core.validateRows([{ ...row, channel: ' 官网' }]), /channel/);
    assert.throws(() => core.validateRows([{ ...row, channel: '' }]), /channel/);
    assert.throws(() => core.validateRows([{ ...row, views: Number.MAX_SAFE_INTEGER + 1 }]), /integers/);
    assert.throws(() => core.validateRows([{ ...row, interactions: -1 }]), /integers/);
    assert.throws(() => core.validateRows([{ ...row, views: Number.MAX_SAFE_INTEGER }, { ...row, id: 'overflow', views: 1 }]), /safe integer/);
    assert.equal(core.validateRows([{ ...row, views: 10, interactions: 15 }]).length, 1);
    assert.deepEqual(core.groupByChannel([], ['官网', '社媒', '邮件']), [{ channel: '官网', views: 0 }, { channel: '社媒', views: 0 }, { channel: '邮件', views: 0 }]);
    assert.deepEqual(core.groupByChannel([]), []);
});
