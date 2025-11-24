/**
 * resultados.js - Busca, Filtros e Paginação (Server-Side Logic)
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Estado da Página
    let currentPage = 1;
    const pageSize = 20;
    let totalResults = 0;
    let currentFilters = {};

    // Elementos DOM
    const resultsList = document.getElementById('results-list');
    const emptyResults = document.getElementById('empty-results');
    const paginationContainer = document.getElementById('pagination-controls'); // Novo container
    const searchTitle = document.getElementById('search-term');
    
    // Elementos do Modal de Filtros
    const genreFilter = document.getElementById('genre-filter');
    const platformFilter = document.getElementById('platform-filter');
    const yearFilter = document.getElementById('year-filter');
    const applyBtn = document.getElementById('apply-filters-btn');
    const modal = document.getElementById('filters-modal');

    // Lê parâmetros iniciais da URL
    const urlParams = new URLSearchParams(window.location.search);
    currentFilters = {
        search: urlParams.get('search') || '',
        genre: urlParams.get('genre') || '',
        platform: urlParams.get('platform') || '', // Nota: Idealmente seriam IDs
        year: urlParams.get('year') || ''
    };
    currentPage = parseInt(urlParams.get('page')) || 1;

    // Sincroniza UI com filtros iniciais
    if (searchTitle) searchTitle.textContent = currentFilters.search || 'Todos os Jogos';
    if (document.getElementById('search-input')) document.getElementById('search-input').value = currentFilters.search;
    if (genreFilter) genreFilter.value = currentFilters.genre;
    if (platformFilter) platformFilter.value = currentFilters.platform;
    if (yearFilter) yearFilter.value = currentFilters.year;

    /**
     * Função Principal: Busca e Renderiza
     */
    async function fetchAndRender() {
        if (!resultsList) return;
        
        resultsList.innerHTML = '<div class="loading-spinner">Carregando jogos...</div>';
        resultsList.style.display = 'block'; // Remove grid temporariamente para loading
        emptyResults.style.display = 'none';
        renderPagination(); // Limpa paginação antiga

        try {
            // Chama a API com todos os filtros e página atual
            const response = await api.getFilteredGames(currentFilters, currentPage, pageSize);
            
            const games = response.results;
            totalResults = response.count;

            if (!games || games.length === 0) {
                resultsList.style.display = 'none';
                emptyResults.style.display = 'block';
                if (emptyResults.querySelector('h3')) {
                    emptyResults.querySelector('h3').textContent = "Nenhum jogo encontrado.";
                }
                return;
            }

            // Renderiza Cards
            resultsList.style.display = 'grid';
            resultsList.className = 'game-list';
            resultsList.innerHTML = games
                .map(game => UI.createGameCard(game))
                .join('');

            // Renderiza Controles de Paginação Atualizados
            renderPagination();
            
            // Scroll suave para o topo dos resultados
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Erro ao buscar:', error);
            resultsList.innerHTML = '<p class="error-msg">Erro ao carregar jogos. Tente novamente.</p>';
        }
    }

    /**
     * Renderiza Botões de Paginação
     */
    function renderPagination() {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        if (totalResults <= pageSize) return; // Não precisa de paginação

        const totalPages = Math.ceil(totalResults / pageSize);
        // Limita o número máximo de páginas visíveis para não quebrar a API (RAWG limita offsets muito altos as vezes)
        const maxPages = Math.min(totalPages, 100); 

        // Botão Anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '&#10094; Anterior';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => changePage(currentPage - 1);
        paginationContainer.appendChild(prevBtn);

        // Texto "Página X de Y" (Simplificado para mobile)
        const info = document.createElement('span');
        info.className = 'page-info';
        info.textContent = `Página ${currentPage}`;
        paginationContainer.appendChild(info);

        // Botão Próximo
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = 'Próximo &#10095;';
        nextBtn.disabled = currentPage >= maxPages;
        nextBtn.onclick = () => changePage(currentPage + 1);
        paginationContainer.appendChild(nextBtn);
    }

    /**
     * Muda a página e atualiza a URL sem recarregar tudo (se possível)
     */
    function changePage(newPage) {
        if (newPage < 1) return;
        currentPage = newPage;
        updateURL();
        fetchAndRender();
    }

    /**
     * Atualiza a URL do navegador para permitir compartilhamento/favoritos
     */
    function updateURL() {
        const params = new URLSearchParams();
        if (currentFilters.search) params.set('search', currentFilters.search);
        if (currentFilters.genre) params.set('genre', currentFilters.genre);
        if (currentFilters.platform) params.set('platform', currentFilters.platform);
        if (currentFilters.year) params.set('year', currentFilters.year);
        if (currentPage > 1) params.set('page', currentPage);
        
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    }

    // --- Eventos ---

    // Aplica Filtros do Modal
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            // Atualiza filtros globais
            currentFilters.genre = genreFilter.value;
            currentFilters.platform = platformFilter.value;
            currentFilters.year = yearFilter.value;
            
            // Reseta para página 1
            currentPage = 1;
            
            updateURL();
            fetchAndRender();
            
            // Fecha modal
            if (modal) modal.style.display = 'none';
        });
    }

    // Inicialização
    fetchAndRender();
});