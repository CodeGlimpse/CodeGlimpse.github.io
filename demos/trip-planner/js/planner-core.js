(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.TripPlannerCore = api;
})(typeof window === 'object' ? window : null, function () {
    'use strict';
    const MAX_STOPS = 6;
    const TRANSFER_MINUTES = 20;
    const DAY_LIMIT_MINUTES = 480;
    const categories = ['自然', '人文', '休憩'];

    function validatePlaces(places) {
        if (!Array.isArray(places) || !places.length) throw new TypeError('Places must be a non-empty array');
        const seen = new Set();
        for (const place of places) {
            if (!place || typeof place.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(place.id) || seen.has(place.id)) {
                throw new TypeError('Place IDs must be unique lowercase names');
            }
            if (typeof place.name !== 'string' || !place.name.trim() || typeof place.description !== 'string' || !place.description.trim()
                || !categories.includes(place.category)) throw new TypeError('Invalid place description or category');
            if (!Number.isSafeInteger(place.durationMinutes) || place.durationMinutes <= 0
                || !Number.isSafeInteger(place.costCents) || place.costCents < 0) throw new TypeError('Place minutes and cents must be safe integers');
            if (![place.x, place.y].every(value => Number.isFinite(value) && value >= 0 && value <= 100)) {
                throw new TypeError('Map coordinates must be between 0 and 100');
            }
            seen.add(place.id);
        }
        return places;
    }

    function resolveItinerary(places, ids) {
        validatePlaces(places);
        if (!Array.isArray(ids) || ids.length > MAX_STOPS) throw new TypeError('Invalid itinerary length');
        const byId = new Map(places.map(place => [place.id, place]));
        const seen = new Set();
        return ids.map(id => {
            if (!byId.has(id) || seen.has(id)) throw new TypeError('Itinerary contains an unknown or duplicate ID');
            seen.add(id);
            return byId.get(id);
        });
    }

    function unchanged(ids, reason) {
        return { ids: ids.slice(), changed: false, reason };
    }

    function filterPlaces(places, category = 'all') {
        validatePlaces(places);
        if (category !== 'all' && !categories.includes(category)) throw new TypeError('Unknown place category');
        return places.filter(place => category === 'all' || place.category === category);
    }

    function addPlace(places, ids, id) {
        resolveItinerary(places, ids);
        if (!places.some(place => place.id === id)) return unchanged(ids, 'unknown');
        if (ids.includes(id)) return unchanged(ids, 'duplicate');
        if (ids.length === MAX_STOPS) return unchanged(ids, 'full');
        return { ids: [...ids, id], changed: true, reason: 'added' };
    }

    function removePlace(places, ids, id) {
        resolveItinerary(places, ids);
        if (!places.some(place => place.id === id)) return unchanged(ids, 'unknown');
        if (!ids.includes(id)) return unchanged(ids, 'not-selected');
        return { ids: ids.filter(value => value !== id), changed: true, reason: 'removed' };
    }

    function movePlace(places, ids, id, direction) {
        resolveItinerary(places, ids);
        if (!places.some(place => place.id === id)) return unchanged(ids, 'unknown');
        const index = ids.indexOf(id);
        if (index === -1) return unchanged(ids, 'not-selected');
        if (direction !== -1 && direction !== 1) return unchanged(ids, 'invalid-move');
        const target = index + direction;
        if (target < 0 || target >= ids.length) return unchanged(ids, 'boundary');
        const next = ids.slice();
        [next[index], next[target]] = [next[target], next[index]];
        return { ids: next, changed: true, reason: 'moved' };
    }

    function safeSum(places, key) {
        return places.reduce((sum, place) => {
            const next = sum + place[key];
            if (!Number.isSafeInteger(next)) throw new RangeError('Itinerary total exceeds safe integer range');
            return next;
        }, 0);
    }

    function summarize(places, ids = []) {
        const selected = resolveItinerary(places, ids);
        const stayMinutes = safeSum(selected, 'durationMinutes');
        const transferMinutes = Math.max(0, selected.length - 1) * TRANSFER_MINUTES;
        const totalMinutes = stayMinutes + transferMinutes;
        if (!Number.isSafeInteger(totalMinutes)) throw new RangeError('Itinerary time exceeds safe integer range');
        return {
            count: selected.length,
            stayMinutes,
            transferMinutes,
            totalMinutes,
            costCents: safeSum(selected, 'costCents'),
            overDay: totalMinutes > DAY_LIMIT_MINUTES,
        };
    }

    function routePoints(places, ids = []) {
        return resolveItinerary(places, ids).map(place => ({ id: place.id, x: place.x, y: place.y }));
    }

    return Object.freeze({ MAX_STOPS, TRANSFER_MINUTES, DAY_LIMIT_MINUTES, validatePlaces, filterPlaces, addPlace, removePlace, movePlace, summarize, routePoints });
});
