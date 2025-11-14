/**
 * resultados.js - Página de Resultados de Busca
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search') || '';
    const searchInput = document.getElementById('search-input');
    const resultsList = document.getElementById('results-list');
    const emptyResults = document.getElementById('empty-results');
    
    // ** TAREFA 3: Novos elementos de filtro **
    const genreFilter = document.getElementById('genre-filter');
    const platformFilter = document.getElementById('platform-filter');
    const dateFilter = document.getElementById('date-filter');

    if (!resultsList) return;

    document.getElementById('search-term').textContent = searchTerm;
    if (searchInput) searchInput.value = searchTerm;

    let allResults = []; // Cache para evitar buscas repetidas ao filtrar

    async function renderResults() {
        resultsList.innerHTML = '<p>Carregando...</p>';

        try {
            // Só busca na API se allResults estiver vazio
            if (allResults.length === 0) {
                allResults = await api.searchGames(searchTerm);
            }

            if (!allResults || allResults.length === 0) {
                resultsList.style.display = 'none';
                emptyResults.style.display = 'block';
                return;
            }

            // ** TAREFA 3: Lógica de filtragem atualizada **
            const selectedGenre = genreFilter?.value;
            const selectedPlatform = platformFilter?.value;
            const selectedDate = dateFilter?.value;

            const filterDate = selectedDate ? new Date(selectedDate) : null;
            if(filterDate) filterDate.setHours(0,0,0,0); // Normaliza data

            const filteredResults = allResults.filter(game => {
                // Filtro de Gênero
                const matchGenre = !selectedGenre || 
                                 (game.genres && game.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase()));

                // Filtro de Plataforma (busca parcial)
                const matchPlatform = !selectedPlatform ||
                                    (game.platforms && game.platforms.some(p => p.toLowerCase().includes(selectedPlatform.toLowerCase())));

                // Filtro de Data (Lançado após a data selecionada)
                const gameDate = game.release_date ? new Date(game.release_date * 1000) : null;
                const matchDate = !filterDate || (gameDate && gameDate >= filterDate);

                return matchGenre && matchPlatform && matchDate;
            });


            if (filteredResults.length === 0) {
                resultsList.style.display = 'none';
                emptyResults.style.display = 'block';
            } else {
                resultsList.style.display = 'grid';
                emptyResults.style.display = 'none';
                resultsList.innerHTML = filteredResults
                    .map(game => UI.createGameCard(game))
                    .join('');
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            resultsList.innerHTML = '<p>Erro ao buscar jogos.</p>';
        }
    }

    // Renderização inicial
    renderResults();

    // ** TAREFA 3: Adiciona listeners para novos filtros **
    if (genreFilter) {
        genreFilter.addEventListener('change', renderResults);
    }
    if (platformFilter) {
        platformFilter.addEventListener('change', renderResults);
    }
    if (dateFilter) {
        dateFilter.addEventListener('change', renderResults);
    }
});