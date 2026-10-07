(function (root, factory) {
    'use strict';
    const bookstore = factory();
    if (typeof module === 'object' && module.exports) module.exports = bookstore;
    if (root) root.DemoBookstore = bookstore;
}(typeof window !== 'undefined' ? window : null, function () {
    'use strict';

    function getCategories(books) {
        return [...new Set(books.map(book => book.category))];
    }

    function validCategory(value) {
        return typeof value === 'string' && value === value.trim() && value !== 'all'
            && /^[\p{L}\p{N}][\p{L}\p{N} &-]{0,23}$/u.test(value);
    }
    const COVERS = Object.freeze(['wind', 'letter', 'rain', 'city', 'space', 'type', 'fold', 'map', 'weekend', 'plant', 'breakfast', 'repair', 'art-cut', 'art-night', 'art-frame', 'art-transit', 'art-grid', 'art-type', 'art-weave', 'art-palette', 'art-room', 'art-window', 'art-courtyard', 'art-street', 'life-soup', 'life-market', 'life-bread', 'life-tea', 'life-desk', 'life-repair', 'life-light', 'life-small', 'life-leaf', 'life-garden', 'life-bird', 'life-walk']);

    function safeTotal(value) {
        if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Money and quantities must remain safe nonnegative integers');
        return value;
    }

    function validateBooks(books) {
        if (!Array.isArray(books) || books.length === 0) throw new TypeError('A nonempty book array is required');
        const ids = new Set();
        let inventoryValue = 0;
        books.forEach((book) => {
            if (!book || typeof book.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(book.id) || ids.has(book.id)
                || ['title', 'author', 'description'].some(key => typeof book[key] !== 'string' || !book[key].trim())
                || !validCategory(book.category) || !COVERS.includes(book.cover)
                || !Number.isSafeInteger(book.priceCents) || book.priceCents < 0
                || !Number.isInteger(book.stock) || book.stock < 0 || book.stock > 9) {
                throw new TypeError('Invalid book record');
            }
            ids.add(book.id);
            inventoryValue = safeTotal(inventoryValue + safeTotal(book.priceCents * book.stock));
        });
        return true;
    }

    function normalizeQuery(value) {
        return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function filterBooks(books, { category = 'all', query = '' } = {}) {
        const terms = normalizeQuery(query).split(' ').filter(Boolean);
        return books.filter(book => (category === 'all' || book.category === category)
            && terms.every(term => normalizeQuery(book.title).includes(term)));
    }

    function formatMoney(cents) {
        safeTotal(cents);
        return '¥' + Math.floor(cents / 100) + '.' + String(cents % 100).padStart(2, '0');
    }

    function createBag(books) {
        validateBooks(books);
        const catalog = new Map(books.map(book => [book.id, Object.freeze({ ...book })]));
        const quantities = new Map();

        function result(id, changed, reason) {
            return { changed, reason, quantity: quantities.get(id) || 0 };
        }

        function change(id, delta) {
            const book = catalog.get(id);
            if (!book) return result(id, false, 'unknown-book');
            const current = quantities.get(id) || 0;
            if (delta > 0 && book.stock === 0) return result(id, false, 'sold-out');
            if (delta > 0 && current >= book.stock) return result(id, false, 'stock-limit');
            if (delta < 0 && current === 0) return result(id, false, 'empty');
            const next = current + delta;
            if (next === 0) quantities.delete(id);
            else quantities.set(id, next);
            return result(id, true, next === 0 ? 'removed' : 'updated');
        }

        function snapshot() {
            return Array.from(quantities, ([id, quantity]) => ({
                book: { ...catalog.get(id) }, quantity,
                lineTotalCents: safeTotal(catalog.get(id).priceCents * quantity),
            }));
        }

        function summary() {
            let count = 0;
            let subtotalCents = 0;
            quantities.forEach((quantity, id) => {
                count = safeTotal(count + quantity);
                subtotalCents = safeTotal(subtotalCents + safeTotal(catalog.get(id).priceCents * quantity));
            });
            return { count, subtotalCents };
        }

        return Object.freeze({
            add: id => change(id, 1),
            increase: id => change(id, 1),
            decrease: id => change(id, -1),
            remove(id) {
                if (!catalog.has(id)) return result(id, false, 'unknown-book');
                const removed = quantities.delete(id);
                return result(id, removed, removed ? 'removed' : 'empty');
            },
            clear() {
                const changed = quantities.size > 0;
                quantities.clear();
                return { changed, reason: changed ? 'cleared' : 'empty' };
            },
            snapshot,
            summary,
        });
    }

    return { getCategories, validateBooks, normalizeQuery, filterBooks, formatMoney, createBag };
}));
