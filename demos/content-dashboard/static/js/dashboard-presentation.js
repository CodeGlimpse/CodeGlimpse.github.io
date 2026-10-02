(function () {
    'use strict';

    const root = document.querySelector('[data-dashboard-presentation]');
    const core = window.DemoDashboard;
    if (!root || !core) return;

    const variant = root.dataset.dashboardPresentation;
    const number = new Intl.NumberFormat('zh-CN');
    const percentage = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const viewLinks = [...root.querySelectorAll('[data-workspace-view]')];
    const viewPanels = [...root.querySelectorAll('[data-workspace-panel]')];
    const dialog = root.querySelector('[data-record-dialog]');
    const reportRecords = root.querySelector('[data-report-records]');
    let currentRows = [];
    let initialized = false;

    function formatRate(value) {
        return percentage.format(value) + '%';
    }

    function selectView(view) {
        if (!viewPanels.some(panel => panel.dataset.workspacePanel === view)) return;
        viewPanels.forEach(panel => { panel.hidden = panel.dataset.workspacePanel !== view; });
        viewLinks.forEach(link => {
            if (link.dataset.workspaceView === view) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
        root.dataset.workspaceView = view;
    }

    function renderMonthly() {
        const columns = [...root.querySelectorAll('[data-month]')];
        const monthly = columns.map(column => core.summarize(core.filterRows(currentRows, { month: column.dataset.month })));
        const maximum = Math.max(0, ...monthly.map(summary => summary.views));
        columns.forEach((column, index) => {
            const summary = monthly[index];
            column.querySelector('[data-monthly-views]').textContent = number.format(summary.views);
            column.querySelector('[data-monthly-count]').textContent = number.format(summary.count);
            column.querySelector('[data-monthly-bar]').style.height = (maximum ? summary.views / maximum * 100 : 0) + '%';
        });
    }

    function renderSpotlight() {
        const title = root.querySelector('[data-spotlight-title]');
        if (!title) return;
        const meta = root.querySelector('[data-spotlight-meta]');
        const value = root.querySelector('[data-spotlight-value]');
        const open = root.querySelector('[data-spotlight-open]');
        const entry = core.sortRows(currentRows, 'views', 'desc')[0];
        if (!entry) {
            title.textContent = '当前范围暂无内容';
            meta.textContent = '调整筛选后再观察阅读表现';
            value.textContent = '—';
            open.disabled = true;
            delete open.dataset.recordOpen;
            return;
        }
        title.textContent = entry.title;
        meta.textContent = entry.channel + ' · ' + entry.published;
        const unit = document.createElement('small');
        unit.textContent = ' 次阅读';
        value.replaceChildren(number.format(entry.views), unit);
        open.dataset.recordOpen = entry.id;
        open.disabled = false;
    }

    function enhanceRecordTitles() {
        if (variant !== 'workspace' || !dialog || typeof dialog.showModal !== 'function') return;
        const entriesById = new Map(currentRows.map(entry => [entry.id, entry]));
        root.querySelectorAll('#content-rows tr').forEach(row => {
            const entry = entriesById.get(row.dataset.entryId);
            const title = row.querySelector('[data-cell="title"]');
            if (!entry || !title) return;
            const open = document.createElement('button');
            open.type = 'button';
            open.className = 'workspace-record-open';
            open.dataset.recordOpen = entry.id;
            open.setAttribute('aria-haspopup', 'dialog');
            open.setAttribute('aria-label', '打开记录：' + entry.title);
            open.textContent = entry.title;
            title.replaceChildren(open);
        });
    }

    function openRecord(id) {
        if (!dialog || typeof dialog.showModal !== 'function') return;
        const entry = currentRows.find(row => row.id === id);
        if (!entry) return;
        const summary = core.summarize(currentRows);
        const entryRate = core.rateForRow(entry);
        const fields = { ...entry, views: number.format(entry.views), interactions: number.format(entry.interactions), rate: formatRate(entryRate) };
        dialog.querySelectorAll('[data-record-field]').forEach(field => {
            field.textContent = fields[field.dataset.recordField];
        });
        const rank = currentRows.filter(row => row.views > entry.views).length + 1;
        dialog.querySelector('[data-record-rank]').textContent = '第 ' + number.format(rank) + ' / ' + number.format(currentRows.length) + ' 条';
        dialog.querySelector('[data-record-share]').textContent = formatRate(summary.views ? entry.views / summary.views * 100 : 0);
        const difference = entryRate - summary.rate;
        const comparison = Math.abs(difference) < 0.005 ? '与当前范围整体互动率相同。'
            : (difference > 0 ? '高于' : '低于') + '当前范围整体互动率 ' + percentage.format(Math.abs(difference)) + ' 个百分点。';
        dialog.querySelector('[data-record-context]').textContent = summary.views
            ? '当前范围整体互动率为 ' + formatRate(summary.rate) + '；本条' + comparison
            : '当前范围暂无阅读，互动率与阅读占比均按 0.00% 显示。';
        dialog.showModal();
    }

    viewLinks.forEach(link => {
        link.addEventListener('click', event => {
            if (!initialized) return;
            event.preventDefault();
            selectView(link.dataset.workspaceView);
        });
    });

    root.addEventListener('click', event => {
        const opener = event.target.closest('[data-record-open]');
        if (opener && !opener.disabled) openRecord(opener.dataset.recordOpen);
        if (event.target.closest('[data-record-close]') && dialog) dialog.close();
    });

    if (dialog) {
        dialog.addEventListener('click', event => {
            if (event.target !== dialog) return;
            const bounds = dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
        });
    }

    root.addEventListener('dashboard:render', event => {
        currentRows = event.detail.rows;
        renderMonthly();
        renderSpotlight();
        enhanceRecordTitles();
        root.querySelectorAll('[data-workspace-count], [data-report-count]').forEach(node => { node.textContent = number.format(currentRows.length); });
        const recordCount = root.querySelector('[data-report-record-count]');
        if (recordCount) recordCount.textContent = number.format(currentRows.length) + ' 条记录';
        if (!initialized) {
            if (variant === 'workspace') selectView(window.location.hash === '#workspace-records' ? 'records' : 'overview');
            if (reportRecords) reportRecords.open = false;
            if (dialog) dialog.querySelector('[data-record-close]').disabled = false;
            initialized = true;
        }
    });
}());
