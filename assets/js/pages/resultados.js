/**
 * resultados.js - Busca, Filtros e Paginação (Server-Side Logic)
 */

document.addEventListener('DOMContentLoaded', async () => {
    let currentPage = 1;
    const pageSize = 20;
    let totalResults = 0;
    let currentFilters = {};

    const resultsList = document.getElementById('results-list');
    const emptyResults = document.getElementById('empty-results');
    const paginationContainer = document.getElementById('pagination-controls');
    const searchTitle = document.getElementById('search-term');
    
    // Elementos do Modal
    const genreFilter = document.getElementById('genre-filter');
    const platformFilter = document.getElementById('platform-filter');
    const yearFilter = document.getElementById('year-filter');
    const applyBtn = document.getElementById('apply-filters-btn');
    const modal = document.getElementById('filters-modal');
    const openBtn = document.getElementById('open-filters-btn');
    const closeBtn = document.querySelector('.close-modal');

    // Lê parâmetros iniciais da URL
    const urlParams = new URLSearchParams(window.location.search);
    currentFilters = {
        search: urlParams.get('search') || '',
        genre: urlParams.get('genre') || '',
        platform: urlParams.get('platform') || '',
        year: urlParams.get('year') || ''
    };
    currentPage = parseInt(urlParams.get('page')) || 1;

    // Sincroniza UI
    if (searchTitle) searchTitle.textContent = currentFilters.search || 'Filtros Aplicados';
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
        resultsList.style.display = 'block';
        emptyResults.style.display = 'none';
        if(paginationContainer) paginationContainer.innerHTML = '';

        try {
            // CORREÇÃO 4: Chama a API com todos os filtros combinados
            const response = await api.getFilteredGames(currentFilters, currentPage, pageSize);
            
            const games = response.results;
            totalResults = response.count;

            if (!games || games.length === 0) {
                resultsList.style.display = 'none';
                emptyResults.style.display = 'block';
                if (emptyResults.querySelector('h3')) {
                    emptyResults.querySelector('h3').textContent = "Nenhum jogo encontrado com esses filtros.";
                }
                return;
            }

            // Renderiza Cards (Sem filtragem extra no cliente)
            resultsList.style.display = 'grid';
            resultsList.className = 'game-list';
            resultsList.innerHTML = games
                .map(game => UI.createGameCard(game))
                .join('');

            renderPagination();
            
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Erro ao buscar:', error);
            resultsList.innerHTML = '<p class="error-msg">Erro ao carregar jogos. Tente novamente.</p>';
        }
    }

    function renderPagination() {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        if (totalResults <= pageSize) return;

        const totalPages = Math.ceil(totalResults / pageSize);
        const maxPages = Math.min(totalPages, 100); 

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '&#10094; Anterior';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => changePage(currentPage - 1);
        paginationContainer.appendChild(prevBtn);

        const info = document.createElement('span');
        info.className = 'page-info';
        info.textContent = `Página ${currentPage}`;
        paginationContainer.appendChild(info);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = 'Próximo &#10095;';
        nextBtn.disabled = currentPage >= maxPages;
        nextBtn.onclick = () => changePage(currentPage + 1);
        paginationContainer.appendChild(nextBtn);
    }

    function changePage(newPage) {
        if (newPage < 1) return;
        currentPage = newPage;
        updateURL();
        fetchAndRender();
    }

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

    // --- Controles do Modal ---
    if (openBtn && modal) {
        openBtn.addEventListener('click', () => { modal.style.display = 'block'; });
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    }
    window.addEventListener('click', (event) => {
        if (event.target == modal) modal.style.display = 'none';
    });

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            currentFilters.genre = genreFilter.value;
            currentFilters.platform = platformFilter.value;
            currentFilters.year = yearFilter.value;
            
            // Se usou filtro, pode querer limpar a busca textual antiga ou mantê-la.
            // Aqui mantemos a busca textual se o input da navbar não foi alterado.
            const navSearch = document.getElementById('search-input');
            if(navSearch) currentFilters.search = navSearch.value;

            currentPage = 1;
            updateURL();
            fetchAndRender();
            if (modal) modal.style.display = 'none';
        });
    }

    fetchAndRender();
});