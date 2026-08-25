document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('tool-search');
    if (!searchInput) return;

    const toolCards = Array.from(document.querySelectorAll('.tools-grid .tool-card'));
    const emptyState = document.getElementById('tool-search-empty');
    const categorySelect = document.getElementById('tool-category');
    const favoritesOnly = document.getElementById('tool-favorites-only');
    const countElement = document.getElementById('tool-catalog-count');
    const recentSection = document.getElementById('tool-recent');
    const recentList = document.getElementById('tool-recent-list');
    const storageKey = 'codeglimpse.tool-preferences';
    const language = document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
    const countText = (visible, total) => language === 'zh'
        ? visible + ' / ' + total + ' 个工具'
        : visible + ' / ' + total + ' tools';
    const savedText = language === 'zh' ? '已收藏' : 'Saved';
    const removedText = language === 'zh' ? '已取消收藏' : 'Removed';

    function readPreferences() {
        try {
            const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
            return {
                favorites: Array.isArray(value.favorites) ? value.favorites : [],
                recent: Array.isArray(value.recent) ? value.recent : []
            };
        } catch {
            return { favorites: [], recent: [] };
        }
    }

    function writePreferences(preferences) {
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                favorites: preferences.favorites.slice(0, 50),
                recent: preferences.recent.slice(0, 20)
            }));
        } catch {
            // Private browsing may reject localStorage; the catalog remains usable.
        }
    }

    function updateFavoriteButtons(favorites) {
        toolCards.forEach((card) => {
            const id = card.dataset.toolId;
            const button = card.querySelector('[data-tool-favorite]');
            const saved = favorites.includes(id);
            card.dataset.favorite = String(saved);
            if (!button) return;
            button.setAttribute('aria-pressed', String(saved));
            button.textContent = saved ? '★' : '☆';
            button.title = saved
                ? (language === 'zh' ? '取消收藏' : 'Remove favorite')
                : (language === 'zh' ? '收藏工具' : 'Favorite tool');
        });
    }

    function updateRecent(recent) {
        if (!recentSection || !recentList) return;
        recentList.replaceChildren();
        const cardsById = new Map(toolCards.map((card) => [card.dataset.toolId, card]));
        recent.slice(0, 5).forEach((id) => {
            const card = cardsById.get(id);
            const sourceLink = card?.querySelector('[data-tool-link]');
            if (!sourceLink) return;
            const link = document.createElement('a');
            link.className = 'tool-recent-link';
            link.href = sourceLink.href;
            link.textContent = card.querySelector('.tool-title')?.textContent || id;
            link.addEventListener('click', () => {
                const preferences = readPreferences();
                preferences.recent = [id, ...preferences.recent.filter((item) => item !== id)];
                writePreferences(preferences);
            });
            recentList.appendChild(link);
        });
        recentSection.hidden = recentList.childElementCount === 0;
    }

    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const category = categorySelect?.value || 'all';
        const preferences = readPreferences();
        const onlyFavorites = favoritesOnly?.getAttribute('aria-pressed') === 'true';
        let visibleCount = 0;

        toolCards.forEach((card) => {
            const isVisible = (!searchTerm || card.dataset.search.includes(searchTerm))
                && (category === 'all' || card.dataset.category === category)
                && (!onlyFavorites || preferences.favorites.includes(card.dataset.toolId));
            card.hidden = !isVisible;
            if (isVisible) visibleCount += 1;
        });

        if (emptyState) emptyState.hidden = visibleCount > 0;
        if (countElement) countElement.textContent = countText(visibleCount, toolCards.length);
    }

    toolCards.forEach((card) => {
        const links = card.querySelectorAll('[data-tool-link]');
        const favorite = card.querySelector('[data-tool-favorite]');
        links.forEach((link) => link.addEventListener('click', () => {
            const preferences = readPreferences();
            preferences.recent = [card.dataset.toolId, ...preferences.recent.filter((id) => id !== card.dataset.toolId)];
            writePreferences(preferences);
            updateRecent(preferences.recent);
        }));
        favorite?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const preferences = readPreferences();
            const index = preferences.favorites.indexOf(card.dataset.toolId);
            if (index >= 0) preferences.favorites.splice(index, 1);
            else preferences.favorites.unshift(card.dataset.toolId);
            writePreferences(preferences);
            updateFavoriteButtons(preferences.favorites);
            applyFilters();
            favorite.setAttribute('aria-label', index >= 0 ? removedText : savedText);
        });
    });

    searchInput.addEventListener('input', applyFilters);
    categorySelect?.addEventListener('change', applyFilters);
    favoritesOnly?.addEventListener('click', () => {
        const pressed = favoritesOnly.getAttribute('aria-pressed') !== 'true';
        favoritesOnly.setAttribute('aria-pressed', String(pressed));
        applyFilters();
    });

    const preferences = readPreferences();
    updateFavoriteButtons(preferences.favorites);
    updateRecent(preferences.recent);
    applyFilters();
});
