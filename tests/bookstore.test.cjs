const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../demos/bookstore/static/js/store-core.js');
const fs = require('node:fs');
const path = require('node:path');
const scenes = [{"id": "classic", "folder": "demos/bookstore", "categories": ["小说", "诗歌", "散文"]}, {"id": "catalog", "folder": "demos/bookstore/variants/catalog", "categories": ["图像", "设计", "建筑"]}, {"id": "checklist", "folder": "demos/bookstore/variants/checklist", "categories": ["料理", "居家", "自然"]}];
for (const scene of scenes) {
const books = require('../' + scene.folder + '/data/books.json');

test(scene.id + ': bookstore catalog has twelve fictional records, integer cents, and bounded stock', () => {
    assert.equal(books.length, 12);
    assert.equal(new Set(books.map(book => book.id)).size, 12);
    assert.equal(new Set(books.map(book => book.cover)).size, 12);
    assert.deepEqual(core.getCategories(books), scene.categories);
    for (const category of scene.categories) {
        assert.equal(books.filter(book => book.category === category).length, 4);
    }
    for (const book of books) {
        assert.match(book.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        for (const field of ['title', 'author', 'description']) assert.ok(book[field].trim());
        assert.ok(Number.isSafeInteger(book.priceCents) && book.priceCents >= 0);
        assert.ok(Number.isInteger(book.stock) && book.stock >= 0 && book.stock <= 9);
    }
    assert.ok(books.some(book => book.stock === 0));
    assert.equal(core.validateBooks(books), true);
});

test(scene.id + ': book search combines category and literal title terms with NFKC normalization', () => {
    const before = structuredClone(books);
    const target = books[1];
    const query = target.title.slice(0, 2) + ' ' + target.title.slice(-2);
    assert.deepEqual(core.filterBooks(books, { category: target.category, query }).map(book => book.id), [target.id]);
    assert.equal(core.filterBooks(books, { category: books.find(book => book.category !== target.category).category, query }).length, 0);
    assert.equal(core.filterBooks(books, { query: books[0].author }).length, 0);
    assert.equal(core.filterBooks(books, { query: '[.*]' }).length, 0);
    assert.equal(core.filterBooks(books).length, 12);
    const sample = [{ ...books[0], title: 'Letters Field 2026' }];
    assert.equal(core.filterBooks(sample, { query: ' ｌｅｔｔｅｒｓ　２０２６ ' }).length, 1);
    assert.equal(core.filterBooks(sample, { query: 'letters missing' }).length, 0);
    assert.deepEqual(books, before);
});

test(scene.id + ': bag stops at stock, rejects sold-out and unknown books, and counts pieces', () => {
    const bag = core.createBag(books);
    const book = books[0];
    const soldOut = books.find(row => row.stock === 0);
    for (let i = 0; i < book.stock; i++) assert.equal(bag.add(book.id).changed, true);
    assert.deepEqual(bag.increase(book.id), { changed: false, reason: 'stock-limit', quantity: book.stock });
    assert.deepEqual(bag.add(soldOut.id), { changed: false, reason: 'sold-out', quantity: 0 });
    assert.deepEqual(bag.add('__proto__'), { changed: false, reason: 'unknown-book', quantity: 0 });
    assert.deepEqual(bag.summary(), { count: book.stock, subtotalCents: book.priceCents * book.stock });
    assert.equal(bag.snapshot().length, 1);
});

test(scene.id + ': decrease, removal, and clear update exact totals without exposing bag state', () => {
    const input = books.map(book => ({ ...book }));
    const bag = core.createBag(input);
    const first = books[0];
    const second = books[1];
    input[0].priceCents = 0;
    assert.equal(bag.decrease(first.id).reason, 'empty');
    bag.add(first.id);
    bag.add(first.id);
    bag.add(second.id);
    const snapshot = bag.snapshot();
    snapshot[0].quantity = 99;
    snapshot[0].book.priceCents = 0;
    assert.deepEqual(bag.summary(), { count: 3, subtotalCents: first.priceCents * 2 + second.priceCents });
    bag.decrease(first.id);
    assert.deepEqual(bag.summary(), { count: 2, subtotalCents: first.priceCents + second.priceCents });
    assert.equal(bag.decrease(first.id).reason, 'removed');
    assert.deepEqual(bag.snapshot().map(item => item.book.id), [second.id]);
    assert.equal(bag.remove(second.id).reason, 'removed');
    assert.deepEqual(bag.summary(), { count: 0, subtotalCents: 0 });
    assert.equal(bag.remove(second.id).changed, false);
    bag.add(first.id);
    bag.add(second.id);
    assert.equal(bag.clear().changed, true);
    assert.equal(bag.clear().changed, false);
    assert.deepEqual(bag.snapshot(), []);
});

test(scene.id + ': money stays in integer cents for mixed quantities and zero-price books', () => {
    const sample = [
        { ...books[0], id: 'one-cent-pattern', priceCents: 101, stock: 3 },
        { ...books[1], id: 'second-pattern', priceCents: 358, stock: 2 },
        { ...books[2], id: 'free-pattern', priceCents: 0, stock: 1 },
    ];
    const bag = core.createBag(sample);
    for (let i = 0; i < 3; i++) bag.add('one-cent-pattern');
    for (let i = 0; i < 2; i++) bag.add('second-pattern');
    bag.add('free-pattern');
    assert.deepEqual(bag.summary(), { count: 6, subtotalCents: 1019 });
    assert.deepEqual(bag.snapshot().map(item => item.lineTotalCents), [303, 716, 0]);
    assert.equal(core.formatMoney(1019), '¥10.19');
    assert.equal(core.formatMoney(4795), '¥47.95');
    assert.equal(core.formatMoney(1), '¥0.01');
    assert.equal(core.formatMoney(0), '¥0.00');
});

test(scene.id + ': invalid data and unsafe arithmetic are rejected before a bag is created', () => {
    for (const priceCents of [-1, 0.01, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        assert.throws(() => core.createBag([{ ...books[0], priceCents }]), TypeError);
    }
    for (const stock of [-1, 10, 1.5]) {
        assert.throws(() => core.validateBooks([{ ...books[0], stock }]), TypeError);
    }
    for (const change of [{ title: '' }, { author: ' ' }, { description: '' }, { category: '<b>其他</b>' }, { category: 'all' }, { category: ' ' }, { category: ' 小说' }, { category: 1 }, { id: '../escape' }, { cover: 'unknown' }]) {
        assert.throws(() => core.validateBooks([{ ...books[0], ...change }]), TypeError);
    }
    assert.throws(() => core.validateBooks([]), TypeError);
    assert.throws(() => core.validateBooks([books[0], { ...books[0] }]), TypeError);
    assert.throws(() => core.createBag([{ ...books[0], priceCents: Number.MAX_SAFE_INTEGER, stock: 9 }]), RangeError);
    assert.throws(() => core.formatMoney(0.5), RangeError);
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

test(scene.id + ': all new cover vectors exist locally', () => {
    if (scene.id !== 'classic') for (const book of books) assert.ok(fs.existsSync(path.resolve(__dirname, '../demos/bookstore/static/illustrations/covers', book.cover + '.svg')));
});
}
test('bookstore scenes have disjoint IDs, titles and descriptions', () => {
    const rows = scenes.flatMap(scene => require('../' + scene.folder + '/data/books.json'));
    for (const field of ['id', 'title', 'description']) assert.equal(new Set(rows.map(row => row[field])).size, 36);
});
