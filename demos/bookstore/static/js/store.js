(function () {
    'use strict';

    const root = document.querySelector('[data-bookstore]');
    if (!root) return;
    const core = window.DemoBookstore;
    const dataNode = document.getElementById('bookstore-data');
    const category = root.querySelector('#category-filter');
    const search = root.querySelector('#book-search');
    const reset = root.querySelector('#reset-filters');
    const grid = root.querySelector('#book-grid');
    const results = root.querySelector('#result-summary');
    const empty = root.querySelector('#empty-state');
    const bagList = root.querySelector('#bag-lines');
    const bagEmpty = root.querySelector('#bag-empty');
    const bagHeading = root.querySelector('#bag-heading');
    const bagCount = root.querySelector('#bag-count');
    const bagSubtotal = root.querySelector('#bag-subtotal');
    const clear = root.querySelector('#bag-clear');
    const message = root.querySelector('#bag-message');
    const controls = [category, search, reset, clear];

    function showError() {
        if (results) results.textContent = '保留静态书目；交互暂时不可用。';
        if (message) message.textContent = '模拟购物袋暂时无法初始化，请刷新页面重试。';
    }

    if (!core || !dataNode || controls.some(control => !control)
        || !grid || !results || !empty || !bagList || !bagEmpty || !bagHeading || !bagCount || !bagSubtotal || !message) {
        showError();
        return;
    }

    let books;
    let bag;
    let cards;
    try {
        books = JSON.parse(dataNode.textContent);
        bag = core.createBag(books);
        cards = Array.from(grid.querySelectorAll('[data-book-id]'));
        const cardIDs = new Set(cards.map(card => card.dataset.bookId));
        if (cards.length !== books.length || cardIDs.size !== books.length
            || books.some(book => !cardIDs.has(book.id))
            || cards.some(card => !card.querySelector('[data-add-book="' + card.dataset.bookId + '"]'))) {
            throw new Error('The static catalog does not match its data');
        }
    } catch (error) {
        showError();
        return;
    }

    const bookByID = new Map(books.map(book => [book.id, book]));
    const lineNodes = new Map();
    let composing = false;

    function announce(text) {
        const targets = [message, ...root.querySelectorAll('[data-bag-announcement]')];
        targets.forEach(target => {
            if (target.textContent !== text) target.textContent = text;
        });
    }

    function filterCatalog() {
        const matches = core.filterBooks(books, { category: category.value, query: search.value });
        const visibleIDs = new Set(matches.map(book => book.id));
        cards.forEach(card => { card.hidden = !visibleIDs.has(card.dataset.bookId); });
        const summary = '共 ' + matches.length + ' 本书';
        if (results.textContent !== summary) results.textContent = summary;
        empty.hidden = matches.length !== 0;
        root.dispatchEvent(new CustomEvent("bookstore:filtered"));
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function quantityButton(action, symbol, book) {
        const button = element('button', 'quantity-button', symbol);
        button.type = 'button';
        button.dataset.bagAction = action;
        button.setAttribute('aria-label', (action === 'increase' ? '增加' : '减少') + '《' + book.title + '》的数量');
        return button;
    }

    function createLine(book) {
        const node = element('li', 'bag-line');
        node.dataset.bookId = book.id;
        const title = element('h3', 'bag-book-title', book.title);
        const author = element('p', 'bag-book-author', book.author + ' 著');
        const unitPrice = element('p', 'bag-unit-price', '单价 ' + core.formatMoney(book.priceCents));
        const details = element('div', 'bag-book-details');
        details.append(title, author, unitPrice);
        const remove = element('button', 'remove-button', '移除');
        remove.type = 'button';
        remove.dataset.bagAction = 'remove';
        remove.setAttribute('aria-label', '移除《' + book.title + '》');
        const top = element('div', 'bag-line-top');
        top.append(details, remove);
        const decrease = quantityButton('decrease', '−', book);
        const quantity = element('span', 'bag-quantity');
        quantity.setAttribute('aria-label', '《' + book.title + '》的数量');
        const increase = quantityButton('increase', '＋', book);
        const stepper = element('div', 'quantity-stepper');
        stepper.setAttribute('role', 'group');
        stepper.setAttribute('aria-label', '调整《' + book.title + '》的数量');
        stepper.append(decrease, quantity, increase);
        const lineTotal = element('span', 'bag-line-total');
        lineTotal.setAttribute('aria-label', '《' + book.title + '》的小计');
        const bottom = element('div', 'bag-line-bottom');
        bottom.append(stepper, lineTotal);
        node.append(top, bottom);
        return { node, quantity, increase, lineTotal };
    }

    function renderBag() {
        const active = document.activeElement;
        const activeLine = active && active.closest ? active.closest('.bag-line') : null;
        const oldOrder = Array.from(bagList.children);
        const oldIndex = activeLine ? oldOrder.indexOf(activeLine) : -1;
        const oldAction = active && active.dataset ? active.dataset.bagAction : null;
        const lines = bag.snapshot();
        const retained = new Set(lines.map(line => line.book.id));
        lineNodes.forEach((line, id) => {
            if (!retained.has(id)) {
                line.node.remove();
                lineNodes.delete(id);
            }
        });
        lines.forEach((item) => {
            let line = lineNodes.get(item.book.id);
            if (!line) {
                line = createLine(item.book);
                lineNodes.set(item.book.id, line);
                bagList.appendChild(line.node);
            }
            line.quantity.textContent = String(item.quantity);
            line.lineTotal.textContent = core.formatMoney(item.lineTotalCents);
            line.increase.setAttribute('aria-disabled', String(item.quantity >= item.book.stock));
        });
        const summary = bag.summary();
        bagCount.textContent = String(summary.count);
        bagSubtotal.textContent = core.formatMoney(summary.subtotalCents);
        bagEmpty.hidden = lines.length > 0;
        bagList.hidden = lines.length === 0;
        clear.setAttribute('aria-disabled', String(lines.length === 0));
        cards.forEach((card) => {
            const id = card.dataset.bookId;
            const button = card.querySelector('[data-add-book]');
            const book = bookByID.get(id);
            const quantity = lines.find(line => line.book.id === id)?.quantity || 0;
            button.disabled = book.stock === 0;
            button.setAttribute('aria-disabled', String(book.stock === 0 || quantity >= book.stock));
            const output = card.querySelector('[data-book-quantity]');
            const decrease = card.querySelector('[data-decrease-book]');
            if (output) output.textContent = String(quantity);
            if (decrease) {
                decrease.disabled = false;
                decrease.setAttribute('aria-disabled', String(quantity === 0));
            }
        });
        root.querySelectorAll('[data-bag-count]').forEach(node => { node.textContent = String(summary.count); });
        if (activeLine && !activeLine.isConnected) {
            const nextLine = bagList.children[Math.min(oldIndex, bagList.children.length - 1)];
            const target = nextLine ? nextLine.querySelector('[data-bag-action="' + oldAction + '"]') : bagHeading;
            (target || bagHeading).focus();
        }
    }

    function showBagResult(book, result) {
        if (result.reason === 'stock-limit') announce('《' + book.title + '》已达到示例库存上限 ' + book.stock + ' 本。');
        else if (result.reason === 'sold-out') announce('《' + book.title + '》暂时售罄。');
        else if (result.changed && result.reason === 'removed') announce('已从购物袋移除《' + book.title + '》。');
        else if (result.changed) announce('购物袋：《' + book.title + '》' + result.quantity + ' 本。');
    }

    category.addEventListener('change', filterCatalog);
    search.addEventListener('compositionstart', () => { composing = true; });
    search.addEventListener('compositionend', () => { composing = false; filterCatalog(); });
    search.addEventListener('input', (event) => { if (!composing && !event.isComposing) filterCatalog(); });
    search.addEventListener('search', () => { if (!composing) filterCatalog(); });
    reset.addEventListener('click', () => {
        composing = false;
        category.value = 'all';
        search.value = '';
        filterCatalog();
    });
    grid.addEventListener('click', (event) => {
        const button = event.target.closest('[data-add-book], [data-decrease-book]');
        if (!button || !grid.contains(button) || button.disabled) return;
        const book = bookByID.get(button.dataset.addBook || button.dataset.decreaseBook);
        if (!book) return;
        const result = button.dataset.decreaseBook ? bag.decrease(book.id) : bag.add(book.id);
        if (result.changed) renderBag();
        showBagResult(book, result);
    });
    bagList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-bag-action]');
        if (!button || !bagList.contains(button)) return;
        const book = bookByID.get(button.closest('.bag-line').dataset.bookId);
        const action = button.dataset.bagAction;
        if (!book || !['increase', 'decrease', 'remove'].includes(action)) return;
        const result = bag[action](book.id);
        if (result.changed) renderBag();
        showBagResult(book, result);
    });
    clear.addEventListener('click', () => {
        const result = bag.clear();
        if (result.changed) renderBag();
        announce(result.changed ? '模拟购物袋已清空。' : '购物袋已经是空的。');
    });

    filterCatalog();
    renderBag();
    controls.forEach(control => { control.disabled = false; });
    root.dataset.ready = 'true';
}());
