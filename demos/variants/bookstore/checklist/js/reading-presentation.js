(function () {
    'use strict';
    const root = document.querySelector('[data-bookstore][data-ready="true"]');
    if (!root || document.body.dataset.template !== 'catalog') return;
    const cards = [...root.querySelectorAll('#book-grid > [data-book-id]')];
    const spines = [...root.querySelectorAll('[data-select-book]')];
    const previous = root.querySelector('#previous-book'), next = root.querySelector('#next-book');
    const position = root.querySelector('#book-position'), dialog = root.querySelector('#bag-drawer');
    const open = root.querySelector('[data-open-bag]'), close = root.querySelector('[data-close-bag]');
    let selected = cards[0]?.dataset.bookId, returnFocus = open, wasOpened = false;
    function render(animate = false) {
        const matches = cards.filter(card => !card.hidden);
        if (!matches.some(card => card.dataset.bookId === selected)) selected = matches[0]?.dataset.bookId;
        cards.forEach(card => {
            const active = card.dataset.bookId === selected;
            card.dataset.active = String(active);
            card.classList.remove('is-entering');
            if (animate && active) { void card.offsetWidth; card.classList.add('is-entering'); }
        });
        const index = matches.findIndex(card => card.dataset.bookId === selected);
        previous.setAttribute('aria-disabled', String(index <= 0));
        next.setAttribute('aria-disabled', String(index < 0 || index >= matches.length - 1));
        position.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(matches.length).padStart(2, '0');
        spines.forEach(button => {
            button.hidden = !matches.some(card => card.dataset.bookId === button.dataset.selectBook);
            button.setAttribute('aria-current', String(button.dataset.selectBook === selected));
        });
    }
    function move(delta) {
        const matches = cards.filter(card => !card.hidden);
        const target = matches[matches.findIndex(card => card.dataset.bookId === selected) + delta];
        if (!target) return;
        selected = target.dataset.bookId;
        render(true);
    }
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    spines.forEach(button => button.addEventListener('click', () => { selected = button.dataset.selectBook; render(true); }));
    root.addEventListener('bookstore:filtered', () => render());
    function openBag(event) { event.preventDefault(); returnFocus = event.currentTarget; if (!dialog.open) { wasOpened = true; dialog.showModal(); } }
    open.addEventListener('click', openBag);
    document.querySelector('.bag-jump')?.addEventListener('click', openBag);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { if (wasOpened) { returnFocus.focus(); wasOpened = false; } });
    dialog.close();
    [open, close, previous, next, ...spines].forEach(button => { button.disabled = false; });
    close.hidden = false;
    root.querySelector('.room-controls').hidden = false;
    root.querySelector('.spine-shelf').hidden = false;
    render();
    root.dataset.presentation = 'ready';
}());
