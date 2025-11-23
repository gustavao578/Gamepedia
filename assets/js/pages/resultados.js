/**
 * resultados.js - Página de Resultados de Busca (Corrigido)
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search') || '';
    
    // Parâmetros de filtro iniciais via URL
    const initialGenre = urlParams.get('genre') || '';
    const initialPlatform = urlParams.get('platform') || '';
    const initialYear = urlParams.get('year') || '';

    const searchInput = document.getElementById('search-input');
    const resultsList = document.getElementById('results-list');
    const emptyResults = document.getElementById('empty-results');
    
    // Inputs do Modal (para sincronizar)
    const genreFilter = document.getElementById('genre-filter');
    const platformFilter = document.getElementById('platform-filter');
    const yearFilter = document.getElementById('year-filter');

    // Elementos de exibição
    const searchTitle = document.getElementById('search-title');
    const searchTermSpan = document.getElementById('search-term');

    if (!resultsList) return;

    // Preenche UI com valores atuais
    if(searchTermSpan) searchTermSpan.textContent = searchTerm || 'Todos os Jogos';
    if (searchInput) searchInput.value = searchTerm;
    
    if (genreFilter) genreFilter.value = initialGenre;
    if (platformFilter) platformFilter.value = initialPlatform;
    if (yearFilter) yearFilter.value = initialYear;

    let allResults = []; 

    async function renderResults() {
        resultsList.innerHTML = '<p>Carregando resultados...</p>';
        emptyResults.style.display = 'none';
        // Garante que o container use o grid definido no CSS
        resultsList.style.display = 'grid';
        // Remove classes antigas que podem atrapalhar e adiciona a classe correta
        resultsList.className = 'game-list'; 

        try {
            // Se não tiver resultados em cache, busca na API
            if (allResults.length === 0) {
                if (searchTerm) {
                    allResults = await api.searchGames(searchTerm);
                } else {
                    // Se não tem termo de busca, traz populares para não ficar vazio
                    allResults = await api.getPopularGames(20); 
                }
            }

            if (!allResults || allResults.length === 0) {
                resultsList.style.display = 'none';
                emptyResults.style.display = 'block';
                // Atualiza texto se a busca original não retornou nada
                if (emptyResults.querySelector('h3')) {
                     emptyResults.querySelector('h3').textContent = "Nenhum jogo encontrado.";
                }
                return;
            }

            // Pega valores atuais dos inputs (caso o modal tenha sido alterado sem reload)
            // ou usa os da URL se o modal não estiver aberto
            const selectedGenre = genreFilter ? genreFilter.value : initialGenre;
            const selectedPlatform = platformFilter ? platformFilter.value : initialPlatform;
            const selectedYear = yearFilter ? yearFilter.value : initialYear;

            const filteredResults = allResults.filter(game => {
                // Filtro de Gênero (case insensitive)
                const matchGenre = !selectedGenre || 
                                 (game.genres && game.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase()));

                // Filtro de Plataforma (case insensitive)
                const matchPlatform = !selectedPlatform ||
                                    (game.platforms && game.platforms.some(p => p.toLowerCase().includes(selectedPlatform.toLowerCase())));

                // Filtro de Ano
                let matchYear = true;
                if (selectedYear && game.release_date) {
                    // release_date vem como "2015-05-18"
                    const gameYear = game.release_date.split('-')[0];
                    matchYear = gameYear === selectedYear;
                } else if (selectedYear && !game.release_date) {
                    matchYear = false; // Se tem filtro de ano mas jogo não tem data, exclui
                }

                return matchGenre && matchPlatform && matchYear;
            });

            if (filteredResults.length === 0) {
                resultsList.style.display = 'none';
                emptyResults.style.display = 'block';
                if (emptyResults.querySelector('h3')) {
                    emptyResults.querySelector('h3').textContent = "Nenhum jogo encontrado com esses filtros.";
                }
            } else {
                resultsList.style.display = 'grid';
                emptyResults.style.display = 'none';
                // Renderiza os cards usando a função UI global (main.js)
                resultsList.innerHTML = filteredResults
                    .map(game => UI.createGameCard(game))
                    .join('');
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            resultsList.innerHTML = '<p>Erro ao buscar jogos. Tente novamente.</p>';
            resultsList.style.display = 'block'; // Para mostrar a mensagem de erro
        }
    }

    renderResults();
});