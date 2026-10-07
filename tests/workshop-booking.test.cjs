const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../demos/workshop-booking/static/js/booking-core.js');
const fs = require('node:fs');
const path = require('node:path');
const scenes = [{"id": "classic", "folder": "demos/workshop-booking", "categories": ["陶艺", "印刷", "花艺"]}, {"id": "calendar", "folder": "demos/workshop-booking/variants/calendar", "categories": ["手捏", "拉坯", "施釉"]}, {"id": "agenda", "folder": "demos/workshop-booking/variants/agenda", "categories": ["纸艺", "版画", "装帧"]}];
for (const scene of scenes) {
const schedule = require('../' + scene.folder + '/data/schedule.json');

const stateFor = (session, quantity = 1) => ({ ...core.createState(), courseId: session.courseId, sessionId: session.id, quantity });

test(scene.id + ': workshop has six original courses, twelve valid scenario sessions, and two courses per craft', () => {
    assert.equal(core.validateSchedule(schedule), true);
    assert.equal(schedule.courses.length, 6);
    assert.equal(schedule.sessions.length, 12);
    assert.equal(new Set(schedule.courses.map(course => course.id)).size, 6);
    assert.equal(new Set(schedule.sessions.map(session => session.id)).size, 12);
    assert.deepEqual(core.getCategories(schedule), scene.categories);
    for (const category of scene.categories) {
        assert.equal(schedule.courses.filter(course => course.category === category).length, 2);
    }
    for (const course of schedule.courses) {
        assert.equal(schedule.sessions.filter(session => session.courseId === course.id).length, 2);
        assert.ok(Number.isSafeInteger(course.priceCents) && course.priceCents > 0);
    }
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    for (const session of schedule.sessions) {
        assert.ok(session.date.startsWith(schedule.month + '-'));
        const utc = new Date(`${session.date}T00:00:00Z`);
        assert.equal(utc.toISOString().slice(0, 10), session.date);
        assert.equal(core.dateLabel(session.date), `${utc.getUTCFullYear()}年${utc.getUTCMonth() + 1}月${utc.getUTCDate()}日 ${weekdays[utc.getUTCDay()]}`);
        assert.ok(Number.isInteger(session.remaining) && session.remaining >= 0 && session.remaining <= 6);
    }
    assert.equal(core.isDate('2026-02-30'), false);
    assert.equal(core.dateLabel('not-a-date'), '');
    const duplicate = structuredClone(schedule);
    duplicate.sessions[1].id = duplicate.sessions[0].id;
    assert.equal(core.validateSchedule(duplicate), false);
});

test(scene.id + ': capacity permits the exact remaining count and blocks excess people and sold-out sessions', () => {
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

test(scene.id + ': sessions must belong to the selected course and switching courses clears the old session', () => {
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

test(scene.id + ': preview includes exact course, date, time, people, and integer-cent multiplication without mutating data', () => {
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
    assert.equal(core.formatMoney(Number.MAX_SAFE_INTEGER), '¥90071992547409.91');
    assert.equal(core.formatMoney(0), '¥0.00');
    assert.equal(core.formatMoney(12.5), '—');
    assert.deepEqual(schedule, before);
});

test(scene.id + ': only integer participant counts from one to six are accepted and quantity changes retain the session', () => {
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

test(scene.id + ': unknown IDs cannot produce a preview and category or date changes reconcile visible selections', () => {
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

test(scene.id + ': malformed records, unsafe prices and cross-month sessions are rejected', () => {
    const invalid = [
        copy => { copy.month = '2026-13'; },
        copy => { copy.courses[0].category = '<b>陶艺</b>'; },
        copy => { copy.courses[0].category = 'all'; },
        copy => { copy.courses[0].category = 0; },
        copy => { copy.courses[0].art = 'unknown'; },
        copy => { copy.courses[0].priceCents = -1; },
        copy => { copy.courses[0].priceCents = Number.MAX_SAFE_INTEGER; },
        copy => { copy.courses[0].id = '../escape'; },
        copy => { copy.courses[1].id = copy.courses[0].id; },
        copy => { copy.sessions[0].id = '../escape'; },
        copy => { copy.sessions[0].date = '2027-01-01'; },
        copy => { copy.sessions[0].end = '23:59'; },
        copy => { copy.sessions[0].remaining = 7; },
        copy => { copy.sessions[0].remaining = -1; },
        copy => { copy.sessions[0].remaining = 1.5; },
        copy => { copy.sessions = []; },
        copy => { copy.sessions = copy.sessions.filter(session => session.courseId !== copy.courses[0].id); },
    ];
    for (const mutate of invalid) {
        const copy = structuredClone(schedule);
        mutate(copy);
        assert.equal(core.validateSchedule(copy), false);
    }
});

test(scene.id + ': home and standalone config select the complete scene', () => {
    const home = fs.readFileSync(path.resolve(__dirname, '..', scene.folder, 'content/_index.md'), 'utf8');
    assert.match(home, /title = /);
    for (const category of scene.categories) assert.ok(home.includes(category));
    if (scene.id !== 'classic') {
        const config = fs.readFileSync(path.resolve(__dirname, '..', scene.folder, 'config.toml'), 'utf8');
        for (const key of ["demoTemplate = '" + scene.id + "'", "contentDir = 'variants/" + scene.id + "/content'", "dataDir = 'variants/" + scene.id + "/data'"]) assert.ok(config.includes(key));
    }
});

}
test('workshop scenes have disjoint courses, sessions and separate periods', () => {
    const schedules = scenes.map(scene => require('../' + scene.folder + '/data/schedule.json'));
    const courses = schedules.flatMap(schedule => schedule.courses);
    for (const field of ['id', 'title', 'description']) assert.equal(new Set(courses.map(row => row[field])).size, 18);
    assert.equal(new Set(schedules.flatMap(schedule => schedule.sessions.map(session => session.id))).size, 36);
    assert.equal(new Set(schedules.map(schedule => schedule.month)).size, 3);
});
