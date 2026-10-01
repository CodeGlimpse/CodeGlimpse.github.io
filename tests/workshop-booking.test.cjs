const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../demos/workshop-booking/static/js/booking-core.js');
const schedule = require('../demos/workshop-booking/data/schedule.json');

const stateFor = (session, quantity = 1) => ({ ...core.createState(), courseId: session.courseId, sessionId: session.id, quantity });

test('workshop has six original courses, twelve valid October sessions, and two courses per craft', () => {
    assert.equal(core.validateSchedule(schedule), true);
    assert.equal(schedule.courses.length, 6);
    assert.equal(schedule.sessions.length, 12);
    assert.equal(new Set(schedule.courses.map(course => course.id)).size, 6);
    assert.equal(new Set(schedule.sessions.map(session => session.id)).size, 12);
    for (const category of ['陶艺', '印刷', '花艺']) {
        assert.equal(schedule.courses.filter(course => course.category === category).length, 2);
    }
    for (const course of schedule.courses) {
        assert.equal(schedule.sessions.filter(session => session.courseId === course.id).length, 2);
        assert.ok(Number.isSafeInteger(course.priceCents) && course.priceCents > 0);
    }
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    for (const session of schedule.sessions) {
        assert.match(session.date, /^2026-10-\d{2}$/);
        const utc = new Date(`${session.date}T00:00:00Z`);
        assert.equal(utc.toISOString().slice(0, 10), session.date);
        assert.equal(core.dateLabel(session.date), `2026年10月${utc.getUTCDate()}日 ${weekdays[utc.getUTCDay()]}`);
        assert.ok(Number.isInteger(session.remaining) && session.remaining >= 0 && session.remaining <= 6);
    }
    assert.equal(core.isDate('2026-02-30'), false);
    assert.equal(core.dateLabel('not-a-date'), '');
    const duplicate = structuredClone(schedule);
    duplicate.sessions[1].id = duplicate.sessions[0].id;
    assert.equal(core.validateSchedule(duplicate), false);
});

test('capacity permits the exact remaining count and blocks excess people and sold-out sessions', () => {
    const limited = schedule.sessions.find(session => session.remaining > 0 && session.remaining < 6);
    assert.equal(core.selectionResult(schedule, stateFor(limited, limited.remaining)).ok, true);
    const excess = stateFor(limited, limited.remaining + 1);
    assert.equal(core.selectionResult(schedule, excess).code, 'capacity');
    assert.equal(core.createPreview(schedule, excess), null);
    const soldOut = schedule.sessions.filter(session => session.remaining === 0);
    assert.ok(soldOut.length > 0);
    for (const session of soldOut) {
        assert.equal(core.selectionResult(schedule, stateFor(session)).code, 'sold-out');
        assert.equal(core.createPreview(schedule, stateFor(session)), null);
        const unselected = { ...stateFor(session), sessionId: '' };
        assert.deepEqual(core.selectSession(schedule, unselected, session.id), unselected);
    }
});

test('sessions must belong to the selected course and switching courses clears the old session', () => {
    const first = schedule.sessions.find(session => session.remaining > 0);
    const other = schedule.courses.find(course => course.id !== first.courseId);
    const mismatch = { ...stateFor(first), courseId: other.id };
    assert.equal(core.selectionResult(schedule, mismatch).code, 'mismatch');
    assert.equal(core.createPreview(schedule, mismatch), null);
    assert.deepEqual(core.selectSession(schedule, { ...mismatch, sessionId: '' }, first.id), { ...mismatch, sessionId: '' });
    const changed = core.selectCourse(schedule, stateFor(first), other.id);
    assert.equal(changed.courseId, other.id);
    assert.equal(changed.sessionId, '');
    assert.equal(core.selectCourse(schedule, stateFor(first), first.courseId).sessionId, first.id);
});

test('preview includes exact course, date, time, people, and integer-cent multiplication without mutating data', () => {
    const before = structuredClone(schedule);
    for (const session of schedule.sessions.filter(item => item.remaining > 0)) {
        const course = schedule.courses.find(item => item.id === session.courseId);
        const quantity = Math.min(3, session.remaining);
        assert.deepEqual(core.createPreview(schedule, stateFor(session, quantity)), {
            courseId: course.id,
            courseTitle: course.title,
            sessionId: session.id,
            date: session.date,
            start: session.start,
            end: session.end,
            quantity,
            unitCents: course.priceCents,
            totalCents: course.priceCents * quantity
        });
    }
    assert.equal(core.formatMoney(12345), '¥123.45');
    assert.equal(core.formatMoney(0), '¥0.00');
    assert.equal(core.formatMoney(12.5), '—');
    assert.deepEqual(schedule, before);
});

test('only integer participant counts from one to six are accepted and quantity changes retain the session', () => {
    const session = schedule.sessions.find(item => item.remaining === 6);
    for (const quantity of [0, 7, -1, 1.5, '2', null, NaN, Infinity]) {
        assert.equal(core.selectionResult(schedule, stateFor(session, quantity)).code, 'quantity');
        assert.equal(core.createPreview(schedule, stateFor(session, quantity)), null);
    }
    for (let quantity = 1; quantity <= 6; quantity++) {
        assert.equal(core.selectionResult(schedule, stateFor(session, quantity)).ok, true);
    }
    const limited = schedule.sessions.find(item => item.remaining > 0 && item.remaining < 6);
    const changed = core.reconcileSelection(schedule, stateFor(limited, limited.remaining + 1));
    assert.equal(changed.sessionId, limited.id);
    assert.equal(core.selectionResult(schedule, changed).code, 'capacity');
});

test('unknown IDs cannot produce a preview and category or date changes reconcile visible selections', () => {
    const session = schedule.sessions.find(item => item.remaining > 0);
    const course = schedule.courses.find(item => item.id === session.courseId);
    assert.equal(core.createPreview(schedule, { ...stateFor(session), courseId: '__missing-course__' }), null);
    assert.equal(core.createPreview(schedule, { ...stateFor(session), sessionId: '__missing-session__' }), null);
    assert.equal(core.selectCourse(schedule, stateFor(session), '__missing-course__').courseId, '');
    assert.deepEqual(core.selectSession(schedule, stateFor(session), '__missing-session__'), stateFor(session));
    const anotherDate = schedule.sessions.find(item => item.date !== session.date).date;
    const changedDate = core.reconcileSelection(schedule, { ...stateFor(session), date: anotherDate });
    assert.equal(changedDate.courseId, course.id);
    assert.equal(changedDate.sessionId, '');
    const anotherCategory = schedule.courses.find(item => item.category !== course.category).category;
    const changedCategory = core.reconcileSelection(schedule, { ...stateFor(session), category: anotherCategory });
    assert.equal(changedCategory.courseId, '');
    assert.equal(changedCategory.sessionId, '');
    const filtered = core.visibleSessions(schedule, { category: course.category, date: session.date });
    const expected = schedule.sessions.filter(item => item.date === session.date
        && schedule.courses.find(candidate => candidate.id === item.courseId).category === course.category).map(item => item.id).sort();
    assert.deepEqual(filtered.map(item => item.id).sort(), expected);
    assert.equal(core.visibleSessions(schedule, { courseId: '__missing-course__' }).length, 0);
});
