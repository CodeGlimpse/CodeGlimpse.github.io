import { matchesSearch } from './games/catalog-core.js';

const finder = document.querySelector('[data-game-finder]');
if (finder) {
    const input = finder.querySelector('[data-game-search-input]');
    const clear = finder.querySelector('[data-game-search-clear]');
    const count = finder.querySelector('[data-game-results]');
    const empty = document.querySelector('[data-game-empty]');
    const cards = [...document.querySelectorAll('[data-game-link]')];
    const en = finder.dataset.lang === 'en';
    let composing = false;

    function update() {
        let visible = 0;
        cards.forEach((card) => {
            card.hidden = !matchesSearch(card.dataset.gameSearch, input.value);
            if (!card.hidden) visible += 1;
        });
        const message = en ? 'Showing ' + visible + ' of ' + cards.length + ' games'
            : '显示 ' + visible + ' 款，共 ' + cards.length + ' 款游戏';
        if (count.textContent !== message) count.textContent = message;
        clear.hidden = input.value.length === 0;
        empty.hidden = visible !== 0;
    }
    function reset() {
        input.value = '';
        composing = false;
        update();
        input.focus();
    }
    finder.addEventListener('submit', event => event.preventDefault());
    input.addEventListener('compositionstart', () => { composing = true; });
    input.addEventListener('compositionend', () => { composing = false; update(); });
    input.addEventListener('input', event => { if (!composing && !event.isComposing) update(); });
    input.addEventListener('search', update);
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !composing && input.value) { event.preventDefault(); reset(); }
    });
    clear.addEventListener('click', reset);
    window.addEventListener('pageshow', update);
    update();
    finder.hidden = false;
}
