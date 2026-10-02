(function (root, factory) {
    'use strict';
    const dashboard = factory();
    if (typeof module === 'object' && module.exports) module.exports = dashboard;
    else if (typeof define === 'function' && define.amd) define(function () { return dashboard; });
    if (root) root.DemoDashboard = dashboard;
}(typeof window !== 'undefined' ? window : null, function () {
    'use strict';

    const CHANNELS = ['博客', '视频', '社区'];
    const SORT_KEYS = ['published', 'views', 'interactions', 'rate', 'title'];

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
            return summary;
        }, { count: rows.length, views: 0, interactions: 0, rate: 0 });
        totals.rate = totals.views > 0 ? totals.interactions / totals.views * 100 : 0;
        return totals;
    }

    function groupByChannel(rows) {
        return CHANNELS.map(channel => ({
            channel,
            views: rows.reduce((total, row) => total + (row.channel === channel ? row.views : 0), 0)
        }));
    }

    return { normalizeQuery, rateForRow, filterRows, sortRows, summarize, groupByChannel };
}));
