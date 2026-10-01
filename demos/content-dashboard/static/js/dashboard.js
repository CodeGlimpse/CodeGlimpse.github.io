(function () {
    'use strict';

    const root = document.querySelector('[data-dashboard]');
    if (!root) return;

    const core = window.DemoDashboard;
    const dataNode = document.getElementById('dashboard-data');
    const month = root.querySelector('#month-filter');
    const channel = root.querySelector('#channel-filter');
    const search = root.querySelector('#search-filter');
    const sortField = root.querySelector('#sort-field');
    const sortDirection = root.querySelector('#sort-direction');
    const reset = root.querySelector('#reset-filters');
    const chart = root.querySelector('#channel-chart');
    const contentRows = root.querySelector('#content-rows');
    const resultSummary = root.querySelector('#result-summary');
    const emptyState = root.querySelector('#empty-state');
    const metricKeys = ['count', 'views', 'interactions', 'rate'];
    const metrics = metricKeys.map(key => root.querySelector('[data-metric="' + key + '"]'));
    const controls = [month, channel, search, sortField, sortDirection, reset];

    function showDataError() {
        if (resultSummary) resultSummary.textContent = '示例数据暂时无法读取，请刷新页面重试。';
    }

    if (!core || !dataNode || controls.some(control => !control)
        || metrics.some(metric => !metric) || !chart || !contentRows || !resultSummary || !emptyState) {
        showDataError();
        return;
    }

    let rows;
    try {
        rows = JSON.parse(dataNode.textContent);
        const ids = new Set();
        const valid = Array.isArray(rows) && rows.every((row) => {
            if (!row || typeof row.id !== 'string' || !row.id.trim() || ids.has(row.id)
                || typeof row.title !== 'string' || !row.title.trim()
                || typeof row.published !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.published)
                || !['博客', '视频', '社区'].includes(row.channel)
                || !Number.isInteger(row.views) || row.views < 0
                || !Number.isInteger(row.interactions) || row.interactions < 0) {
                return false;
            }
            ids.add(row.id);
            return true;
        });
        if (!valid) throw new Error('Invalid dashboard data');
    } catch (error) {
        showDataError();
        return;
    }

    const numberFormat = new Intl.NumberFormat('zh-CN');
    const rateFormat = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let filteredRows = [];
    let composing = false;

    function formatRate(value) {
        return rateFormat.format(value) + '%';
    }

    function renderMetrics() {
        const summary = core.summarize(filteredRows);
        metricKeys.forEach((key, index) => {
            metrics[index].textContent = key === 'rate' ? formatRate(summary[key]) : numberFormat.format(summary[key]);
        });
        const message = '共 ' + filteredRows.length + ' 条内容';
        if (resultSummary.textContent !== message) resultSummary.textContent = message;
        emptyState.hidden = filteredRows.length !== 0;
    }

    function renderChart() {
        const totals = core.groupByChannel(filteredRows);
        const maximum = Math.max(0, ...totals.map(item => item.views));
        const fragment = document.createDocumentFragment();
        totals.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'channel-row channel-' + index;
            row.dataset.channel = item.channel;
            const name = document.createElement('span');
            name.className = 'channel-name';
            const dot = document.createElement('span');
            dot.className = 'channel-dot';
            dot.setAttribute('aria-hidden', 'true');
            name.append(dot, item.channel);
            const track = document.createElement('div');
            track.className = 'bar-track';
            track.setAttribute('aria-hidden', 'true');
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.width = (maximum > 0 ? item.views / maximum * 100 : 0) + '%';
            track.appendChild(bar);
            const total = document.createElement('span');
            total.className = 'channel-total';
            total.textContent = numberFormat.format(item.views);
            row.append(name, track, total);
            fragment.appendChild(row);
        });
        chart.replaceChildren(fragment);
    }

    function appendCell(row, value, key, label) {
        const cell = document.createElement('td');
        cell.textContent = value;
        cell.dataset.cell = key;
        cell.dataset.label = label;
        if (key === 'title') cell.className = 'content-title';
        if (['views', 'interactions', 'rate'].includes(key)) cell.className = 'numeric';
        if (key === 'rate') cell.classList.add('rate-cell');
        if (key === 'channel') {
            const badge = document.createElement('span');
            badge.className = 'channel-badge ' + ({ 博客: 'badge-blog', 视频: 'badge-video', 社区: 'badge-community' }[value]);
            badge.textContent = value;
            cell.replaceChildren(badge);
        }
        row.appendChild(cell);
    }

    function renderTable() {
        const sortedRows = core.sortRows(filteredRows, sortField.value, sortDirection.value);
        const fragment = document.createDocumentFragment();
        sortedRows.forEach((entry) => {
            const row = document.createElement('tr');
            row.dataset.entryId = entry.id;
            appendCell(row, entry.title, 'title', '内容');
            const dateCell = document.createElement('td');
            dateCell.className = 'date-cell';
            dateCell.dataset.cell = 'published';
            dateCell.dataset.label = '发布日期';
            const date = document.createElement('time');
            date.dateTime = entry.published;
            date.textContent = entry.published;
            dateCell.appendChild(date);
            row.appendChild(dateCell);
            appendCell(row, entry.channel, 'channel', '渠道');
            appendCell(row, numberFormat.format(entry.views), 'views', '阅读量');
            appendCell(row, numberFormat.format(entry.interactions), 'interactions', '互动次数');
            appendCell(row, formatRate(core.rateForRow(entry)), 'rate', '互动率');
            fragment.appendChild(row);
        });
        contentRows.replaceChildren(fragment);
    }

    function update() {
        filteredRows = core.filterRows(rows, { month: month.value, channel: channel.value, query: search.value });
        renderMetrics();
        renderChart();
        renderTable();
    }

    root.addEventListener('submit', event => event.preventDefault());
    month.addEventListener('change', update);
    channel.addEventListener('change', update);
    sortField.addEventListener('change', renderTable);
    sortDirection.addEventListener('change', renderTable);
    search.addEventListener('compositionstart', () => { composing = true; });
    search.addEventListener('compositionend', () => { composing = false; update(); });
    search.addEventListener('input', (event) => {
        if (!composing && !event.isComposing) update();
    });
    search.addEventListener('search', () => { if (!composing) update(); });
    reset.addEventListener('click', (event) => {
        event.preventDefault();
        month.value = 'all';
        channel.value = 'all';
        search.value = '';
        sortField.value = 'views';
        sortDirection.value = 'desc';
        composing = false;
        update();
    });

    update();
    controls.forEach(control => { control.disabled = false; });
    root.dataset.ready = 'true';
}());
