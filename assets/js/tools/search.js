document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('tool-search');
    if (!searchInput) return;

    const toolCards = document.querySelectorAll('.tools-grid .tool-card');
    const emptyState = document.getElementById('tool-search-empty');

    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();
        let visibleCount = 0;

        toolCards.forEach(function (card) {
            const title = card.querySelector('.tool-title').textContent.toLowerCase();
            const desc = card.querySelector('.tool-desc').textContent.toLowerCase();
            const isVisible = title.includes(searchTerm) || desc.includes(searchTerm);
            card.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount += 1;
        });

        if (emptyState) emptyState.hidden = visibleCount > 0;
    });
});
