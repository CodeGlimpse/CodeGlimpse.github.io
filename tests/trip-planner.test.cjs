const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../demos/trip-planner/static/js/planner-core.js');
const places = require('../demos/trip-planner/data/places.json');
const firstSix = ['pine-ridge', 'cloud-bridge', 'terrace-lake', 'stone-lane', 'paper-house', 'hill-studio'];

test('trip places have valid unique IDs, integer estimates, map bounds and category filters', () => {
    assert.equal(places.length, 8);
    assert.equal(new Set(places.map(place => place.id)).size, 8);
    assert.equal(core.validatePlaces(places), places);
    for (const place of places) {
        assert.ok(place.name.trim() && place.description.trim());
        assert.ok(Number.isSafeInteger(place.durationMinutes) && place.durationMinutes > 0);
        assert.ok(Number.isSafeInteger(place.costCents) && place.costCents >= 0);
        assert.ok(place.x >= 0 && place.x <= 100 && place.y >= 0 && place.y <= 100);
    }
    assert.deepEqual(core.filterPlaces(places, '自然').map(place => place.id), ['pine-ridge', 'cloud-bridge', 'terrace-lake']);
    assert.deepEqual(core.filterPlaces(places, '人文').map(place => place.id), ['stone-lane', 'paper-house', 'hill-studio']);
    assert.deepEqual(core.filterPlaces(places, '休憩').map(place => place.id), ['warm-cup', 'meadow-rest']);
    assert.equal(core.filterPlaces(places).length, 8);
});

test('adding rejects duplicates and caps the itinerary at six without mutating input', () => {
    const empty = [];
    assert.deepEqual(core.addPlace(places, empty, 'pine-ridge'), { ids: ['pine-ridge'], changed: true, reason: 'added' });
    assert.deepEqual(empty, []);
    assert.deepEqual(core.addPlace(places, ['pine-ridge'], 'pine-ridge'), { ids: ['pine-ridge'], changed: false, reason: 'duplicate' });
    let ids = [];
    for (const id of firstSix) ids = core.addPlace(places, ids, id).ids;
    assert.deepEqual(ids, firstSix);
    assert.deepEqual(core.addPlace(places, ids, 'warm-cup'), { ids: firstSix, changed: false, reason: 'full' });
    assert.deepEqual(ids, firstSix);
});

test('removal handles middle, empty and unselected stops while preserving source order', () => {
    const ids = ['pine-ridge', 'cloud-bridge', 'terrace-lake'];
    assert.deepEqual(core.removePlace(places, ids, 'cloud-bridge'), { ids: ['pine-ridge', 'terrace-lake'], changed: true, reason: 'removed' });
    assert.deepEqual(core.removePlace(places, [], 'pine-ridge'), { ids: [], changed: false, reason: 'not-selected' });
    assert.deepEqual(core.removePlace(places, ids, 'paper-house'), { ids, changed: false, reason: 'not-selected' });
    assert.deepEqual(ids, ['pine-ridge', 'cloud-bridge', 'terrace-lake']);
});

test('reordering is adjacent, bounded and immutable and route points follow its exact order', () => {
    const ids = ['pine-ridge', 'cloud-bridge', 'terrace-lake'];
    assert.equal(core.movePlace(places, ids, 'pine-ridge', -1).reason, 'boundary');
    assert.equal(core.movePlace(places, ids, 'terrace-lake', 1).reason, 'boundary');
    assert.equal(core.movePlace(places, ids, 'cloud-bridge', 0).reason, 'invalid-move');
    assert.equal(core.movePlace(places, ids, 'paper-house', -1).reason, 'not-selected');
    const result = core.movePlace(places, ids, 'terrace-lake', -1);
    assert.deepEqual(result, { ids: ['pine-ridge', 'terrace-lake', 'cloud-bridge'], changed: true, reason: 'moved' });
    assert.deepEqual(core.movePlace(places, result.ids, 'terrace-lake', 1).ids, ['pine-ridge', 'cloud-bridge', 'terrace-lake']);
    assert.deepEqual(core.routePoints(places, result.ids), [
        { id: 'pine-ridge', x: 20, y: 28 }, { id: 'terrace-lake', x: 72, y: 34 }, { id: 'cloud-bridge', x: 44, y: 20 },
    ]);
    assert.deepEqual(ids, ['pine-ridge', 'cloud-bridge', 'terrace-lake']);
});

test('totals use integer cents and add twenty minutes only between stops with an exact eight-hour limit', () => {
    assert.deepEqual(core.summarize(places, []), { count: 0, stayMinutes: 0, transferMinutes: 0, totalMinutes: 0, costCents: 0, overDay: false });
    assert.deepEqual(core.summarize(places, ['pine-ridge']), { count: 1, stayMinutes: 90, transferMinutes: 0, totalMinutes: 90, costCents: 0, overDay: false });
    assert.deepEqual(core.summarize(places, ['pine-ridge', 'cloud-bridge', 'terrace-lake']), { count: 3, stayMinutes: 275, transferMinutes: 40, totalMinutes: 315, costCents: 1200, overDay: false });
    assert.deepEqual(core.summarize(places, firstSix), { count: 6, stayMinutes: 520, transferMinutes: 100, totalMinutes: 620, costCents: 7800, overDay: true });
    const fractionalMoney = [{ ...places[0], durationMinutes: 30, costCents: 101 }, { ...places[1], durationMinutes: 40, costCents: 202 }];
    assert.deepEqual(core.summarize(fractionalMoney, ['pine-ridge', 'cloud-bridge']), { count: 2, stayMinutes: 70, transferMinutes: 20, totalMinutes: 90, costCents: 303, overDay: false });
    assert.equal(core.summarize([{ ...places[0], durationMinutes: 480 }], ['pine-ridge']).overDay, false);
    assert.equal(core.summarize([{ ...places[0], durationMinutes: 481 }], ['pine-ridge']).overDay, true);
});

test('unknown IDs and malformed or overflowing data cannot silently create an invalid itinerary', () => {
    assert.equal(core.addPlace(places, [], 'unknown-place').reason, 'unknown');
    assert.equal(core.removePlace(places, ['pine-ridge'], 'unknown-place').reason, 'unknown');
    assert.equal(core.movePlace(places, ['pine-ridge'], 'unknown-place', 1).reason, 'unknown');
    assert.throws(() => core.summarize(places, ['unknown-place']), /unknown/);
    assert.throws(() => core.summarize(places, ['pine-ridge', 'pine-ridge']), /duplicate/);
    assert.throws(() => core.summarize(places, [...firstSix, 'warm-cup']), /length/);
    assert.throws(() => core.validatePlaces([{ ...places[0], costCents: 1.1 }]), /integers/);
    assert.throws(() => core.validatePlaces([{ ...places[0], costCents: -1 }]), /integers/);
    assert.throws(() => core.validatePlaces([{ ...places[0], x: 101 }]), /coordinates/);
    assert.throws(() => core.validatePlaces([places[0], places[0]]), /unique/);
    assert.throws(() => core.filterPlaces(places, '其他'), /category/);
    assert.throws(() => core.summarize([{ ...places[0], costCents: Number.MAX_SAFE_INTEGER }, { ...places[1], costCents: 1 }], ['pine-ridge', 'cloud-bridge']), /safe integer/);
});
