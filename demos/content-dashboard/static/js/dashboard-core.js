(function (root, factory) {
    'use strict';
    const dashboard = factory();
    if (typeof module === 'object' && module.exports) module.exports = dashboard;
    else if (typeof define === 'function' && define.amd) define(function () { return dashboard; });
    if (root) root.DemoDashboard = dashboard;
}(typeof window !== 'undefined' ? window : null, function () {
    'use strict';

    const SORT_KEYS = ['published', 'views', 'interactions', 'rate', 'title'];

    function validateRows(rows) {
        if (!Array.isArray(rows) || rows.length === 0) throw new TypeError('Dashboard records must be a non-empty array');
        const ids = new Set();
        for (const row of rows) {
            if (!row || typeof row.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id) || ids.has(row.id)) {
                throw new TypeError('Dashboard IDs must be unique lowercase names');
            }
            if (typeof row.title !== 'string' || !row.title.trim()
                || typeof row.channel !== 'string' || !row.channel.trim() || row.channel !== row.channel.trim()
                || /[\u0000-\u001f\u007f-\u009f]/.test(row.channel)) throw new TypeError('Invalid dashboard title or channel');
            if (typeof row.published !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.published)) throw new TypeError('Invalid dashboard date');
            const date = new Date(row.published + 'T00:00:00Z');
            if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== row.published) throw new TypeError('Invalid dashboard date');
            if (!Number.isSafeInteger(row.views) || row.views < 0 || !Number.isSafeInteger(row.interactions) || row.interactions < 0) {
                throw new TypeError('Dashboard counts must be non-negative safe integers');
            }
            ids.add(row.id);
        }
        summarize(rows);
        return rows;
    }

    function getChannels(rows) {
        return [...new Set(rows.map(row => row.channel))];
    }

    function getMonths(rows) {
        return [...new Set(rows.map(row => row.published.slice(0, 7)))].sort();
    }

    function normalizeQuery(value) {
        return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function rateForRow(row) {
        return row.views > 0 ? row.interactions / row.views * 100 : 0;
    }

    function filterRows(rows, { month = 'all', channel = 'all', query = '' } = {}) {
        const terms = normalizeQuery(query).split(' ').filter(Boolean);
        return rows.filter((row) => {
            if (month !== 'all' && row.published.slice(0, 7) !== month) return false;
            if (channel !== 'all' && row.channel !== channel) return false;
            const text = normalizeQuery(row.title);
            return terms.every(term => text.includes(term));
        });
    }

    function sortRows(rows, key = 'views', direction = 'desc') {
        const field = SORT_KEYS.includes(key) ? key : 'views';
        const order = direction === 'asc' ? 1 : -1;
        return rows.map((row, index) => ({ row, index })).sort((left, right) => {
            let comparison = 0;
            if (field === 'title') {
                comparison = left.row.title.localeCompare(right.row.title, 'zh-CN');
            } else if (field === 'published') {
                comparison = left.row.published < right.row.published ? -1
                    : left.row.published > right.row.published ? 1 : 0;
            } else {
                const leftValue = field === 'rate' ? rateForRow(left.row) : left.row[field];
                const rightValue = field === 'rate' ? rateForRow(right.row) : right.row[field];
                comparison = leftValue - rightValue;
            }
            return comparison === 0 ? left.index - right.index : comparison * order;
        }).map(item => item.row);
    }

    function summarize(rows) {
        const totals = rows.reduce((summary, row) => {
            summary.views += row.views;
            summary.interactions += row.interactions;
            if (!Number.isSafeInteger(summary.views) || !Number.isSafeInteger(summary.interactions)) throw new RangeError('Dashboard total exceeds safe integer range');
            return summary;
        }, { count: rows.length, views: 0, interactions: 0, rate: 0 });
        totals.rate = totals.views > 0 ? totals.interactions / totals.views * 100 : 0;
        return totals;
    }

    function groupByChannel(rows, channels = getChannels(rows)) {
        return channels.map(channel => ({
            channel,
            views: rows.reduce((total, row) => total + (row.channel === channel ? row.views : 0), 0)
        }));
    }

    return { validateRows, getChannels, getMonths, normalizeQuery, rateForRow, filterRows, sortRows, summarize, groupByChannel };
}));
