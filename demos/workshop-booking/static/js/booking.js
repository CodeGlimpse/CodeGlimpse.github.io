(function () {
    'use strict';

    const root = document.querySelector('[data-workshop]');
    if (!root) return;
    const core = window.WorkshopBooking;
    const dataNode = document.getElementById('booking-data');
    const category = root.querySelector('#category-filter');
    const date = root.querySelector('#date-filter');
    const quantity = root.querySelector('#booking-quantity');
    const reset = root.querySelector('#reset-booking');
    const previewButton = root.querySelector('#preview-booking');
    const preview = root.querySelector('#booking-preview');
    const status = root.querySelector('#booking-status');
    const courseCount = root.querySelector('#course-count');
    const sessionCount = root.querySelector('#schedule-count');
    const empty = root.querySelector('#empty-sessions');
    const unitPrice = root.querySelector('[data-unit-price]');
    const estimate = root.querySelector('[data-estimate]');
    const courseButtons = Array.from(root.querySelectorAll('[data-course-id]'));
    const sessionRows = Array.from(root.querySelectorAll('[data-session-id]'));
    const calendarMode = document.body.dataset.template === 'calendar';
    const agendaMode = document.body.dataset.template === 'agenda';
    const agendaSteps = Array.from(root.querySelectorAll('[data-agenda-step]'));
    const agendaNavigation = Array.from(root.querySelectorAll('[data-agenda-goto]'));
    const agendaNext = Array.from(root.querySelectorAll('[data-agenda-next]'));
    const agendaBack = Array.from(root.querySelectorAll('[data-agenda-back]'));
    const agendaNote = root.querySelector('[data-agenda-note]');
    const calendar = root.querySelector('[data-booking-calendar]');
    const calendarDetails = root.querySelector('[data-calendar-details]');
    const calendarPrompt = root.querySelector('[data-calendar-prompt]');
    const calendarSummary = root.querySelector('[data-calendar-summary]');
    const calendarButtons = Array.from(root.querySelectorAll('[data-calendar-date]'));
    const controls = [category, date, quantity, reset];
    const summaryKeys = ['course', 'date', 'time'];
    const summary = Object.fromEntries(summaryKeys.map(key => [key, root.querySelector('[data-selection="' + key + '"]')]));
    const previewKeys = ['course', 'date', 'time', 'quantity', 'unit', 'total'];
    const previewFields = Object.fromEntries(previewKeys.map(key => [key, root.querySelector('[data-preview="' + key + '"]')]));

    function showDataError() {
        if (status) status.textContent = '本地示例数据暂时无法读取。当前可只读浏览课程与排期，请刷新页面重试。';
    }

    if (!core || !dataNode || controls.some(control => !control)
        || !previewButton || !preview || !status || !courseCount || !sessionCount || !empty || !unitPrice || !estimate
        || (calendarMode && (!calendar || !calendarDetails || !calendarPrompt || !calendarSummary || !calendarButtons.length))
        || (agendaMode && (agendaSteps.length !== 3 || agendaNavigation.length !== 3 || !agendaNote))
        || Object.values(summary).some(element => !element) || Object.values(previewFields).some(element => !element)) {
        showDataError();
        return;
    }

    let schedule;
    try {
        schedule = JSON.parse(dataNode.textContent);
        if (!core.validateSchedule(schedule) || courseButtons.length !== schedule.courses.length || sessionRows.length !== schedule.sessions.length
            || courseButtons.some(button => !schedule.courses.some(course => course.id === button.dataset.courseId))
            || sessionRows.some(row => !schedule.sessions.some(session => session.id === row.dataset.sessionId) || !row.querySelector('[data-session-choice]'))) {
            throw new Error('Invalid workshop schedule');
        }
    } catch (error) {
        showDataError();
        return;
    }

    let state = core.createState();
    let agendaStep = 0;

    function updateAgenda() {
        if (!agendaMode) return;
        const reachableStep = state.courseId ? (state.sessionId ? 2 : 1) : 0;
        agendaStep = Math.min(agendaStep, reachableStep);
        agendaSteps.forEach(step => { step.hidden = Number(step.dataset.agendaStep) !== agendaStep; });
        agendaNavigation.forEach(button => {
            const step = Number(button.dataset.agendaGoto);
            button.disabled = step > reachableStep;
            button.classList.toggle('is-complete', step < reachableStep);
            if (step === agendaStep) button.setAttribute('aria-current', 'step');
            else button.removeAttribute('aria-current');
        });
        agendaNext.forEach(button => { button.disabled = Number(button.dataset.agendaNext) > reachableStep; });
        agendaBack.forEach(button => { button.disabled = false; });
        agendaNote.textContent = agendaStep === 0
            ? (state.courseId ? '课程已选好。点击下一步，挑选对应场次。' : '第 1 步：选择一门喜欢的课程。')
            : agendaStep === 1
                ? (state.sessionId ? '场次已选好。点击下一步，核对人数与费用。' : '第 2 步：选择一个有余位的场次。')
                : '第 3 步：核对人数和费用，再查看预约单预览。';
        root.dataset.agendaStep = String(agendaStep);
    }

    function navigateAgenda(step) {
        agendaStep = step;
        updateAgenda();
        const active = agendaSteps.find(panel => Number(panel.dataset.agendaStep) === agendaStep);
        active.querySelector('[data-agenda-heading]').focus();
    }

    function clearPreview() {
        preview.hidden = true;
        previewKeys.forEach(key => { previewFields[key].textContent = '—'; });
    }

    function update() {
        const focused = document.activeElement;
        let visibleCourses = core.visibleCourses(schedule, state.category);
        if (calendarMode && state.date !== 'all') {
            const dayCourseIds = new Set(schedule.sessions.filter(session => session.date === state.date).map(session => session.courseId));
            visibleCourses = visibleCourses.filter(course => dayCourseIds.has(course.id));
        }
        const visibleCourseIds = new Set(visibleCourses.map(course => course.id));
        courseButtons.forEach((button) => {
            button.hidden = !visibleCourseIds.has(button.dataset.courseId);
            const selected = button.dataset.courseId === state.courseId;
            button.setAttribute('aria-pressed', String(selected));
            button.querySelector('[data-course-state-text]').textContent = selected ? '已选这门课' : '选择这门课';
        });
        courseCount.textContent = '共 ' + visibleCourses.length + ' 门课程';

        const sessions = core.visibleSessions(schedule, state);
        const visibleSessionIds = new Set(sessions.map(session => session.id));
        sessionRows.forEach((row) => {
            const session = schedule.sessions.find(item => item.id === row.dataset.sessionId);
            const selected = session.id === state.sessionId;
            const button = row.querySelector('[data-session-choice]');
            row.hidden = !visibleSessionIds.has(session.id);
            row.classList.toggle('is-selected', selected);
            button.disabled = session.remaining === 0;
            button.setAttribute('aria-pressed', String(selected));
            button.textContent = session.remaining === 0 ? '已满额' : selected ? '已选此场' : '选择此场';
        });
        empty.hidden = sessions.length !== 0;

        const calendarExpanded = calendarMode && date.value !== '';
        if (calendarMode) {
            calendarDetails.hidden = !calendarExpanded;
            calendarPrompt.hidden = calendarExpanded;
            calendarSummary.textContent = state.date === 'all' ? '十月完整课程与排期' : core.dateLabel(state.date) + ' · 当日手作';
            calendarButtons.forEach(button => {
                button.setAttribute('aria-pressed', String(date.value === button.dataset.calendarDate));
            });
        }

        const course = schedule.courses.find(item => item.id === state.courseId);
        const session = schedule.sessions.find(item => item.id === state.sessionId);
        sessionCount.textContent = (course ? course.title + ' · ' : '') + sessions.length + ' 个示例场次 · 按日期排列';
        summary.course.textContent = course ? course.title : '尚未选课';
        summary.date.textContent = session ? core.dateLabel(session.date) : '尚未选场';
        summary.time.textContent = session ? session.start + ' — ' + session.end : '—';
        unitPrice.textContent = course ? core.formatMoney(course.priceCents) + ' / 人 × ' + state.quantity + ' 人' : '选定课程后显示单价';
        estimate.textContent = course ? core.formatMoney(course.priceCents * state.quantity) : '—';

        const result = core.selectionResult(schedule, state);
        previewButton.disabled = !result.ok;
        status.dataset.tone = ['capacity', 'quantity', 'sold-out', 'mismatch', 'data'].includes(result.code) ? 'warning' : 'normal';
        status.textContent = calendarMode && !calendarExpanded
            ? '请先在日历中选择日期，再选择当天课程与场次。'
            : result.ok ? '课程、场次和 ' + state.quantity + ' 人已选好，可查看预约单预览。' : result.message;
        updateAgenda();
        if (focused && root.contains(focused) && (focused.closest('[hidden]') || focused.disabled)) {
            if (agendaMode) agendaSteps[agendaStep].querySelector('[data-agenda-heading]').focus();
            else (calendarMode && !calendarExpanded ? date : category).focus();
        }
    }

    courseButtons.forEach((button) => {
        button.addEventListener('click', () => {
            state = core.selectCourse(schedule, state, button.dataset.courseId);
            clearPreview();
            update();
        });
    });
    sessionRows.forEach((row) => {
        const button = row.querySelector('[data-session-choice]');
        button.addEventListener('click', () => {
            const session = schedule.sessions.find(item => item.id === button.dataset.sessionChoice);
            if (!session || session.remaining === 0) return;
            if (!state.courseId) state = core.selectCourse(schedule, state, session.courseId);
            state = core.selectSession(schedule, state, session.id);
            clearPreview();
            update();
        });
    });
    category.addEventListener('change', () => {
        state = core.reconcileSelection(schedule, { ...state, category: category.value });
        clearPreview();
        update();
    });
    date.addEventListener('change', () => {
        const nextDate = date.value || 'all';
        const next = calendarMode && (state.date !== nextDate || date.value === '')
            ? { ...state, courseId: '', sessionId: '', date: nextDate }
            : { ...state, date: nextDate };
        state = core.reconcileSelection(schedule, next);
        clearPreview();
        update();
    });
    if (calendarMode) {
        const dayButtons = calendarButtons.filter(button => button.dataset.calendarDate !== 'all');
        calendarButtons.forEach((button) => {
            button.addEventListener('click', () => {
                date.value = button.dataset.calendarDate;
                date.dispatchEvent(new Event('change', { bubbles: true }));
            });
            button.addEventListener('keydown', (event) => {
                if (button.dataset.calendarDate === 'all' || event.altKey || event.ctrlKey || event.metaKey) return;
                const index = dayButtons.indexOf(button);
                let target = null;
                if (event.key === 'ArrowLeft') target = dayButtons[Math.max(0, index - 1)];
                if (event.key === 'ArrowRight') target = dayButtons[Math.min(dayButtons.length - 1, index + 1)];
                if (event.key === 'Home') target = dayButtons[0];
                if (event.key === 'End') target = dayButtons[dayButtons.length - 1];
                if (event.key === 'ArrowUp') {
                    const day = Number(button.dataset.calendarDay) - 7;
                    target = dayButtons.filter(candidate => Number(candidate.dataset.calendarDay) <= day).pop() || dayButtons[0];
                }
                if (event.key === 'ArrowDown') {
                    const day = Number(button.dataset.calendarDay) + 7;
                    target = dayButtons.find(candidate => Number(candidate.dataset.calendarDay) >= day) || dayButtons[dayButtons.length - 1];
                }
                if (target) {
                    event.preventDefault();
                    target.focus();
                }
            });
        });
    }
    quantity.addEventListener('change', () => {
        state = { ...state, quantity: Number(quantity.value) };
        clearPreview();
        update();
    });
    reset.addEventListener('click', () => {
        state = core.createState();
        category.value = 'all';
        date.value = calendarMode ? '' : 'all';
        quantity.value = '1';
        clearPreview();
        update();
        if (agendaMode) category.focus();
    });
    previewButton.addEventListener('click', () => {
        const plan = core.createPreview(schedule, state);
        if (!plan) {
            clearPreview();
            update();
            return;
        }
        previewFields.course.textContent = plan.courseTitle;
        previewFields.date.textContent = core.dateLabel(plan.date);
        previewFields.time.textContent = plan.start + ' — ' + plan.end;
        previewFields.quantity.textContent = plan.quantity + ' 人';
        previewFields.unit.textContent = core.formatMoney(plan.unitCents) + ' / 人';
        previewFields.total.textContent = core.formatMoney(plan.totalCents);
        preview.hidden = false;
        status.dataset.tone = 'normal';
        status.textContent = '预约单预览已生成，仅在本页展示，没有提交任何信息。';
    });

    if (agendaMode) {
        agendaNavigation.forEach(button => button.addEventListener('click', () => navigateAgenda(Number(button.dataset.agendaGoto))));
        agendaNext.forEach(button => button.addEventListener('click', () => navigateAgenda(Number(button.dataset.agendaNext))));
        agendaBack.forEach(button => button.addEventListener('click', () => navigateAgenda(Number(button.dataset.agendaBack))));
    }

    controls.forEach(control => { control.disabled = false; });
    courseButtons.forEach(button => { button.disabled = false; });
    calendarButtons.forEach(button => { button.disabled = false; });
    update();
    root.dataset.ready = 'true';
}());
