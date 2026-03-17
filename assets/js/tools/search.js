document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('tool-search');
    if (!searchInput) return;

    const toolCards = document.querySelectorAll('.tools-grid .tool-card');

    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();

        toolCards.forEach(function (card) {
            const title = card.querySelector('.tool-title').textContent.toLowerCase();
            const desc = card.querySelector('.tool-desc').textContent.toLowerCase();
            const isVisible = title.includes(searchTerm) || desc.includes(searchTerm);
            card.style.display = isVisible ? '' : 'none';
        });
    });
});