/**
 * resultados.js - Página de Resultados de Busca
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search') || '';
    const searchInput = document.getElementById('search-input');
    const resultsList = document.getElementById('results-list');
    const emptyResults = document.getElementById('empty-results');
    const genreFilter = document.getElementById('genre-filter');

    if (!resultsList) return;

    document.getElementById('search-term').textContent = searchTerm;
    if (searchInput) searchInput.value = searchTerm;

    async function renderResults() {
        resultsList.innerHTML = '<p>Carregando...</p>';

        try {
            let results = await api.searchGames(searchTerm);

            if (!results || results.length === 0) {
                resultsList.style.display = 'none';
                emptyResults.style.display = 'block';
                return;
            }

            const selectedGenre = genreFilter?.value;

            if (selectedGenre) {
                results = results.filter(game =>
                    game.genres && game.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase())
                );
            }

            if (results.length === 0) {
                resultsList.style.display = 'none';
                emptyResults.style.display = 'block';
            } else {
                resultsList.style.display = 'grid';
                emptyResults.style.display = 'none';
                resultsList.innerHTML = results
                    .map(game => UI.createGameCard(game))
                    .join('');
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            resultsList.innerHTML = '<p>Erro ao buscar jogos.</p>';
        }
    }

    renderResults();
    if (genreFilter) {
        genreFilter.addEventListener('change', renderResults);
    }
});