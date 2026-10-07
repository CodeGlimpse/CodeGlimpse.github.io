(function (root, factory) {
    'use strict';
    const booking = factory();
    if (typeof module === 'object' && module.exports) module.exports = booking;
    if (root) root.WorkshopBooking = booking;
}(typeof window !== 'undefined' ? window : null, function () {
    'use strict';

    function getCategories(schedule) {
        return [...new Set(schedule.courses.map(course => course.category))];
    }

    function validCategory(value) {
        return typeof value === 'string' && value === value.trim() && value !== 'all'
            && /^[\p{L}\p{N}][\p{L}\p{N} &-]{0,23}$/u.test(value);
    }

    const ARTS = new Set(['clay-cup', 'clay-tray', 'print-leaf', 'print-garden', 'flower-vase', 'flower-ring', 'pinch-bowl', 'coil-vase', 'wheel-cup', 'wheel-plate', 'glaze-grid', 'glaze-line', 'fold-lamp', 'paper-city', 'lino-wave', 'two-color', 'thread-book', 'accordion-book']);
    const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

    function isDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(value + 'T00:00:00Z');
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }

    function dateLabel(value) {
        if (!isDate(value)) return '';
        const date = new Date(value + 'T00:00:00Z');
        return date.getUTCFullYear() + '年' + (date.getUTCMonth() + 1) + '月' + date.getUTCDate() + '日 ' + WEEKDAYS[date.getUTCDay()];
    }

    function formatMoney(cents) {
        if (!Number.isSafeInteger(cents) || cents < 0) return '—';
        return '¥' + Math.floor(cents / 100) + '.' + String(cents % 100).padStart(2, '0');
    }

    function validateSchedule(schedule) {
        if (!schedule || typeof schedule.month !== 'string' || !/^\d{4}-\d{2}$/.test(schedule.month)
            || !isDate(schedule.month + '-01') || !Array.isArray(schedule.courses) || !schedule.courses.length
            || !Array.isArray(schedule.sessions) || !schedule.sessions.length) return false;
        const courseIds = new Set();
        for (const course of schedule.courses) {
            if (!course || typeof course.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(course.id) || courseIds.has(course.id)
                || !['title', 'description', 'materials', 'level', 'art'].every(key => typeof course[key] === 'string' && course[key].trim())
                || !validCategory(course.category) || !ARTS.has(course.art)
                || !Number.isSafeInteger(course.priceCents) || course.priceCents < 0 || !Number.isSafeInteger(course.priceCents * 6)
                || !Number.isSafeInteger(course.durationMinutes) || course.durationMinutes <= 0) return false;
            courseIds.add(course.id);
        }
        const sessionIds = new Set();
        for (const session of schedule.sessions) {
            if (!session || typeof session.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(session.id) || sessionIds.has(session.id)
                || !courseIds.has(session.courseId) || !isDate(session.date) || !session.date.startsWith(schedule.month + '-')
                || !TIME.test(session.start) || !TIME.test(session.end) || session.start >= session.end
                || !Number.isSafeInteger(session.remaining) || session.remaining < 0 || session.remaining > 6) return false;
            const minutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
            const course = schedule.courses.find(item => item.id === session.courseId);
            if (minutes(session.end) - minutes(session.start) !== course.durationMinutes) return false;
            sessionIds.add(session.id);
        }
        return schedule.courses.every(course => schedule.sessions.some(session => session.courseId === course.id));
    }

    function createState() {
        return { category: 'all', date: 'all', courseId: '', sessionId: '', quantity: 1 };
    }

    function visibleCourses(schedule, category = 'all') {
        return schedule.courses.filter(course => category === 'all' || course.category === category);
    }

    function visibleSessions(schedule, { category = 'all', date = 'all', courseId = '' } = {}) {
        const courseIds = new Set(visibleCourses(schedule, category).map(course => course.id));
        return schedule.sessions.filter(session => courseIds.has(session.courseId)
            && (!courseId || session.courseId === courseId) && (date === 'all' || session.date === date))
            .slice().sort((left, right) => {
                const leftKey = left.date + left.start + left.id;
                const rightKey = right.date + right.start + right.id;
                return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
            });
    }

    function reconcileSelection(schedule, state) {
        const next = { ...createState(), ...state };
        if (next.category !== 'all' && !getCategories(schedule).includes(next.category)) next.category = 'all';
        if (next.date !== 'all' && !schedule.sessions.some(session => session.date === next.date)) next.date = 'all';
        const course = schedule.courses.find(item => item.id === next.courseId);
        if (!course || (next.category !== 'all' && course.category !== next.category)) {
            next.courseId = '';
            next.sessionId = '';
        }
        const session = schedule.sessions.find(item => item.id === next.sessionId);
        if (!session || session.courseId !== next.courseId || session.remaining === 0
            || (next.date !== 'all' && session.date !== next.date)) next.sessionId = '';
        return next;
    }

    function selectCourse(schedule, state, courseId) {
        return reconcileSelection(schedule, {
            ...state,
            courseId,
            sessionId: state.courseId === courseId ? state.sessionId : ''
        });
    }

    function selectSession(schedule, state, sessionId) {
        const visible = visibleSessions(schedule, state).find(session => session.id === sessionId);
        if (!visible || visible.remaining === 0 || visible.courseId !== state.courseId) return { ...state };
        return { ...state, sessionId };
    }

    function selectionResult(schedule, { courseId = '', sessionId = '', quantity = 1 } = {}) {
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 6) {
            return { ok: false, code: 'quantity', message: '请选择 1–6 人的整数人数。' };
        }
        const course = schedule.courses.find(item => item.id === courseId);
        if (!course) return { ok: false, code: 'course', message: '请选择一门课程，再选一个喜欢的场次。' };
        const session = schedule.sessions.find(item => item.id === sessionId);
        if (!session) return { ok: false, code: 'session', message: '已选“' + course.title + '”，请选择对应的场次。' };
        if (session.courseId !== course.id) return { ok: false, code: 'mismatch', message: '场次不属于当前课程，请重新选择场次。' };
        if (session.remaining === 0) return { ok: false, code: 'sold-out', message: '这个示例场次已满额，请选择其他场次。' };
        if (quantity > session.remaining) {
            return { ok: false, code: 'capacity', message: '余位不足：所选场次示例余位为 ' + session.remaining + ' 人，当前选择 ' + quantity + ' 人。请减少人数或更换场次。' };
        }
        const totalCents = course.priceCents * quantity;
        if (!Number.isSafeInteger(course.priceCents) || course.priceCents < 0 || !Number.isSafeInteger(totalCents)) {
            return { ok: false, code: 'data', message: '示例金额无法读取，请刷新页面重试。' };
        }
        return { ok: true, code: 'ready', course, session, quantity, unitCents: course.priceCents, totalCents };
    }

    function createPreview(schedule, state) {
        const result = selectionResult(schedule, state);
        if (!result.ok) return null;
        return {
            courseId: result.course.id,
            courseTitle: result.course.title,
            sessionId: result.session.id,
            date: result.session.date,
            start: result.session.start,
            end: result.session.end,
            quantity: result.quantity,
            unitCents: result.unitCents,
            totalCents: result.totalCents
        };
    }

    return { getCategories, isDate, dateLabel, formatMoney, validateSchedule, createState, visibleCourses, visibleSessions, reconcileSelection, selectCourse, selectSession, selectionResult, createPreview };
}));
