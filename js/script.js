// script.js (Lógica consolidada: IGDB API, Tema e Busca para o Gamepedia)

document.addEventListener('DOMContentLoaded', () => {
    
    // ==================================================================
    // 1. CONFIGURAÇÃO DA API IGDB (Funções de Serviço)
    // ==================================================================
    
    // 🛑 AÇÃO CRÍTICA: SUBSTITUA POR SUAS CREDENCIAIS REAIS DA TWITCH/IGDB
    // ID do cliente (Client ID)
    const IGDB_CLIENT_ID = 'botc0vhk45urrf6f0m4tpzrwj5hfho'; 
    // Bearer Token: Deve ser gerado usando o Client Secret (e expira)
    const IGDB_BEARER_TOKEN = 'Bearer SEU_NOVO_TOKEN_MUITO_LONGO_AQUI_...'; 
    const IGDB_URL = 'https://api.igdb.com/v4/';

    /**
     * Função genérica para buscar dados da API IGDB.
     */
    async function fetchData(endpoint, data) {
        const url = IGDB_URL + endpoint;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Client-ID': IGDB_CLIENT_ID,
                    'Authorization': IGDB_BEARER_TOKEN,
                    'Accept': 'application/json',
                },
                body: data, 
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Erro na API IGDB (Status: ${response.status}):`, errorText);
                return { error: `Erro de API: Status ${response.status} - Verifique o console.` };
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Falha na requisição ao endpoint /${endpoint}:`, error);
            return { error: `Falha na Requisição: ${error.message}` };
        }
    }
    
    // Funções de Consulta
    async function getPopularGames() {
        const query = 'fields name, rating, platforms.name, cover.url, slug; sort popularity desc; limit 8; where rating_count > 10;';
        return fetchData('games', query);
    }
    async function searchGames(query) {
        const queryData = `fields name, rating, platforms.name, cover.url, slug; search "${query}"; limit 20;`;
        return fetchData('games', queryData);
    }
    async function getGameDetails(slug) {
        // Campos estendidos para a página de detalhes
        const query = `fields name, summary, rating, first_release_date, platforms.name, genres.name, cover.url, screenshots.url, videos.video_id, involved_companies.company.name; where slug = "${slug}";`;
        const result = await fetchData('games', query);
        return result && result.length > 0 ? result[0] : null;
    }


    // ==================================================================
    // 2. CONFIGURAÇÃO INICIAL E LOCAL STORAGE
    // ==================================================================
    
    if (!localStorage.getItem('gamepedia_favorites')) {
        localStorage.setItem('gamepedia_favorites', JSON.stringify([])); 
    }
    if (!localStorage.getItem('gamepedia_recentSearches')) {
        localStorage.setItem('gamepedia_recentSearches', JSON.stringify([])); 
    }

    // Lógica de Favoritos (adicionada para uso em detalhes.html e favoritos.html)
    function toggleFavorite(gameId) {
        let favorites = JSON.parse(localStorage.getItem('gamepedia_favorites')); 
        const idString = gameId.toString();
        const isFavorited = favorites.includes(idString);
        
        if (isFavorited) {
            favorites = favorites.filter(id => id !== idString);
        } else {
            favorites.push(idString);
        }

        localStorage.setItem('gamepedia_favorites', JSON.stringify(favorites));
        return !isFavorited; 
    }
    function isGameFavorited(gameId) {
        const favorites = JSON.parse(localStorage.getItem('gamepedia_favorites'));
        return favorites.includes(gameId.toString());
    }
    function getCoverUrl(coverUrl) {
        if (coverUrl) {
             return 'https:' + coverUrl.replace('t_thumb', 't_cover_big');
        }
        return 'assets/images/placeholder.jpg';
    }


    // ==================================================================
    // 3. LÓGICA DE TEMA E BUSCA (Mantida)
    // ==================================================================
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    function loadTheme() {
        const savedTheme = localStorage.getItem('gamepedia_theme') || 'dark';
        body.classList.add(savedTheme + '-mode');
        if (themeToggle) {
            themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙'; 
        }
    }

    function toggleTheme() {
        const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.classList.remove(currentTheme + '-mode');
        body.classList.add(newTheme + '-mode');
        localStorage.setItem('gamepedia_theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme); 
    }
    loadTheme();
    
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();

            if (searchTerm) {
                // ... (Lógica de saveSearchTerm) ...
                window.location.href = `resultados.html?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    }

    // ... (função saveSearchTerm deve ser mantida aqui) ...

    // ==================================================================
    // 4. RENDERIZAÇÃO DE PÁGINAS (Com Feedback de Erro IGDB)
    // ==================================================================
    
    // A) Lógica da Página Inicial (index.html)
    async function renderIndexPage() {
        const popularGamesContainer = document.getElementById('popular-games');
        
        if (popularGamesContainer) {
             popularGamesContainer.innerHTML = '<h3>Carregando jogos populares (via IGDB)...</h3>';
             const data = await getPopularGames(); 
        
             if (data && !data.error && data.length > 0) { 
                 popularGamesContainer.innerHTML = data.map(game => {
                    const gameId = game.id;
                    const isFav = isGameFavorited(gameId);
                    return `
                        <div class="game-card" data-id="${gameId}" onclick="window.location.href='detalhes.html?slug=${game.slug}'"> 
                            <img src="${game.cover ? getCoverUrl(game.cover.url) : 'assets/images/placeholder.jpg'}" alt="${game.name}" class="card-image">
                            <div class="card-info">
                                <h3 class="card-title">${game.name}</h3>
                                <p class="card-platforms">Plataformas: ${game.platforms ? game.platforms.map(p => p.name).slice(0, 3).join(', ') : 'N/A'}</p>
                                <div class="card-rating">⭐ ${game.rating ? game.rating.toFixed(1) : 'N/A'}</div>
                                <span class="favorite-icon" data-id="${gameId}">${isFav ? '❤️' : '🤍'}</span> 
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                // FEEDBACK CLARO DE ERRO NA TELA
                const errorMessage = data && data.error ? data.error : "Dados vazios.";
                popularGamesContainer.innerHTML = `
                    <h3 style="color: var(--accent-color);">❌ Erro de Integração da API ❌</h3>
                    <p>O Gamepedia não conseguiu carregar os dados. Isso geralmente acontece por:</p>
                    <ul style="list-style-type: disc; padding-left: 20px; color: var(--primary-text);">
                        <li>1. **Token Expirado/Inválido:** Você precisa gerar um novo Bearer Token na Twitch.</li>
                        <li>2. **Credenciais Erradas:** Verifique o Client ID e o Token no topo do <strong>script.js</strong>.</li>
                        <li><small>Detalhes Técnicos: ${errorMessage}</small></li>
                    </ul>
                `;
            }
        }
    }

    // B) Lógica da Página de Resultados (resultados.html)
    async function renderResultsPage() {
        if (window.location.pathname.endsWith('resultados.html')) {
            // ... (Lógica de renderização de resultados a ser completada usando searchGames) ...
        }
    }
    
    // C) Lógica da Página de Detalhes (detalhes.html)
    async function renderDetailsPage() {
        if (window.location.pathname.endsWith('detalhes.html')) {
            // ... (Lógica de renderização de detalhes a ser completada usando getGameDetails) ...
        }
    }
    
    // D) Lógica da Página de Favoritos (favoritos.html)
    async function renderFavoritesPage() {
        if (window.location.pathname.endsWith('favoritos.html')) {
            // ... (Lógica de renderização de favoritos a ser completada) ...
        }
    }


    // EXECUÇÃO FINAL
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path === '/' || path === '') {
        renderIndexPage();
    }
    if (path.endsWith('resultados.html')) {
        renderResultsPage();
    }
    if (path.endsWith('detalhes.html')) {
        renderDetailsPage();
    }
    if (path.endsWith('favoritos.html')) {
        renderFavoritesPage();
    }
});