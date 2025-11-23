/**
 * resultados.js - Página de Resultados de Busca (Com Modal)
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search') || '';
    const searchInput = document.getElementById('search-input');
    const resultsList = document.getElementById('results-list');
    const emptyResults = document.getElementById('empty-results');
    
    // Elementos do Modal
    const modal = document.getElementById('filters-modal');
    const openBtn = document.getElementById('open-filters-btn');
    const closeBtn = document.querySelector('.close-modal');
    const applyBtn = document.getElementById('apply-filters-btn');

    // Inputs de Filtro
    const genreFilter = document.getElementById('genre-filter');
    const platformFilter = document.getElementById('platform-filter');
    const dateFilter = document.getElementById('date-filter');

    if (!resultsList) return;

    // Preenche termo de busca
    const termDisplay = document.getElementById('search-term');
    if(termDisplay) termDisplay.textContent = searchTerm;
    if (searchInput) searchInput.value = searchTerm;

    let allResults = []; // Cache dos resultados

    // --- Lógica de Renderização ---
    async function renderResults() {
        resultsList.innerHTML = '<p>Carregando...</p>';
        emptyResults.style.display = 'none';
        resultsList.style.display = 'grid';

        try {
            // Busca na API se ainda não buscou
            if (allResults.length === 0) {
                allResults = await api.searchGames(searchTerm);
            }

            if (!allResults || allResults.length === 0) {
                resultsList.style.display = 'none';
                emptyResults.style.display = 'block';
                return;
            }

            // Aplica Filtros
            const selectedGenre = genreFilter?.value;
            const selectedPlatform = platformFilter?.value;
            const selectedDate = dateFilter?.value;
 
            const filterDate = selectedDate ? new Date(selectedDate) : null;
            if(filterDate) filterDate.setHours(0,0,0,0);

            const filteredResults = allResults.filter(game => {
                // Filtro de Gênero
                const matchGenre = !selectedGenre || 
                                 (game.genres && game.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase()));

                // Filtro de Plataforma
                const matchPlatform = !selectedPlatform ||
                                    (game.platforms && game.platforms.some(p => p.toLowerCase().includes(selectedPlatform.toLowerCase())));

                // Filtro de Data
                const gameDate = game.release_date ? new Date(game.release_date) : null;
                const matchDate = !filterDate || (gameDate && gameDate >= filterDate);

                return matchGenre && matchPlatform && matchDate;
            });

            if (filteredResults.length === 0) {
                resultsList.style.display = 'none';
                emptyResults.style.display = 'block';
                // Atualiza mensagem para indicar que filtros ocultaram tudo
                emptyResults.querySelector('h3').textContent = "Nenhum jogo com esses filtros.";
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

    // --- Controles do Modal ---
    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // Botão "Aplicar" do Modal
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            renderResults(); // Re-renderiza com os valores atuais dos inputs
            modal.style.display = 'none'; // Fecha modal
        });
    }

    // Renderização inicial
    renderResults();
});