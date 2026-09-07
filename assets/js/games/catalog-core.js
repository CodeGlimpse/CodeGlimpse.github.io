'use strict';

function normalizeSearch(value) {
    return String(value ?? '').normalize('NFKC').toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchesSearch(text, query) {
    const haystack = normalizeSearch(text);
    return normalizeSearch(query).split(' ').filter(Boolean).every(word => haystack.includes(word));
}

module.exports = { normalizeSearch, matchesSearch };
