// script.js (Lógica consolidada: IGDB API, Tema e Busca para o Gamepedia)

document.addEventListener('DOMContentLoaded', () => {
    
    // ==================================================================
    // 1. CONFIGURAÇÃO DA API IGDB (Funções de Serviço)
    // ==================================================================
    
    // ATENÇÃO: ESTES VALORES DEVEM SER GERADOS POR VOCÊ NA TWITCH/IGDB.
    // O TOKEN expira, você deve gerar um novo periodicamente para testes.
    const IGDB_CLIENT_ID = 'abcdefg12345'; 
    const IGDB_BEARER_TOKEN = 'Bearer access12345token'; 
    const IGDB_URL = 'https://api.igdb.com/v4/';

    /**
     * Função genérica para buscar dados da API IGDB.
     * A IGDB usa POST para consultas complexas com corpo 'data'.
     * @param {string} endpoint - O endpoint da API (ex: 'games', 'genres').
     * @param {string} adata - A string de consulta no formato 'APICALYPSE' (ex: 'fields name, rating; limit 10;').
     */
    async function fetchData(endpoint, data) {
        const url = IGDB_URL + endpoint;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    // IGDB requer o Client-ID e o Token nos cabeçalhos
                    'Client-ID': IGDB_CLIENT_ID,
                    'Authorization': IGDB_BEARER_TOKEN,
                    'Accept': 'application/json',
                },
                body: data, // O corpo contém a consulta da API
            });
            
            if (!response.ok) {
                console.error(`Erro na API IGDB: ${response.status}`);
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Falha ao buscar dados em /${endpoint}:`, error);
            return null; 
        }
    }
    
    /**
     * Função para buscar jogos populares (para index.html).
     * Nota: IGDB usa 'platforms', 'cover', etc., que requerem chamadas adicionais ou sintaxe complexa.
     * Simplificado para o front-end.
     */
    async function getPopularGames() {
        // Consulta para 8 jogos populares, com campos essenciais e o slug para o detalhe
        const query = 'fields name, rating, platforms.name, cover.url, slug; sort popularity desc; limit 8; where rating_count > 10;';
        return fetchData('games', query);
    }

    /**
     * Função para buscar jogos por termo (para resultados.html).
     */
    async function searchGames(query) {
        // Consulta para 20 resultados de busca
        const queryData = `fields name, rating, platforms.name, cover.url, slug; search "${query}"; limit 20;`;
        return fetchData('games', queryData);
    }


    // ==================================================================
    // 2. CONFIGURAÇÃO INICIAL E LOCAL STORAGE (MANTIDA)
    // ==================================================================
    
    if (!localStorage.getItem('gamepedia_favorites')) {
        localStorage.setItem('gamepedia_favorites', JSON.stringify([])); 
    }
    if (!localStorage.getItem('gamepedia_recentSearches')) {
        localStorage.setItem('gamepedia_recentSearches', JSON.stringify([])); 
    }

    // ==================================================================
    // 3. LÓGICA DE TEMA (MANTIDA)
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
    
    // ==================================================================
    // 4. LÓGICA DE BUSCA E REDIRECIONAMENTO (MANTIDA)
    // ==================================================================
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();

            if (searchTerm) {
                saveSearchTerm(searchTerm);
                // Redireciona para 'resultados.html?search=termo'
                window.location.href = `resultados.html?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    }

    function saveSearchTerm(term) {
        let recentSearches = JSON.parse(localStorage.getItem('gamepedia_recentSearches'));
        
        recentSearches = recentSearches.filter(s => s.toLowerCase() !== term.toLowerCase());
        recentSearches.unshift(term); 
        recentSearches = recentSearches.slice(0, 5); 

        localStorage.setItem('gamepedia_recentSearches', JSON.stringify(recentSearches));
    }
    
    // ==================================================================
    // 5. RENDERIZAÇÃO ESPECÍFICA DE PÁGINAS (ADAPTADA À RESPOSTA IGDB)
    // ==================================================================
    
    // Função para criar o URL completo da capa (IGDB fornece apenas o ID/caminho parcial)
    function getCoverUrl(coverUrl) {
        // A IGDB geralmente retorna URLs sem o protocolo ou um caminho relativo.
        // Simulamos uma URL de imagem comum para a IGDB (que usa o Imgur/Twitch CDN)
        if (coverUrl) {
             // O URL retornado pela IGDB muitas vezes já é completo
             return 'https:' + coverUrl.replace('t_thumb', 't_cover_big'); // Substitui o thumbnail por uma capa maior
        }
        return 'assets/images/placeholder.jpg';
    }

    // A) Lógica da Página Inicial (index.html)
    async function renderIndexPage() {
        const popularGamesContainer = document.getElementById('popular-games');
        
        if (popularGamesContainer) {
             popularGamesContainer.innerHTML = '<h3>Carregando jogos populares (via IGDB)...</h3>';
             const data = await getPopularGames(); 
        
             if (data && data.length > 0) {
                 popularGamesContainer.innerHTML = data.map(game => `
                    <div class="game-card" data-id="${game.id}" onclick="window.location.href='detalhes.html?slug=${game.slug}'"> 
                        <img src="${game.cover ? getCoverUrl(game.cover.url) : 'assets/images/placeholder.jpg'}" alt="${game.name}" class="card-image">
                        <div class="card-info">
                            <h3 class="card-title">${game.name}</h3>
                            <p class="card-platforms">Plataformas: ${game.platforms ? game.platforms.map(p => p.name).slice(0, 3).join(', ') : 'N/A'}</p>
                            <div class="card-rating">⭐ ${game.rating ? game.rating.toFixed(1) : 'N/A'}</div>
                            <span class="favorite-icon">🤍</span> 
                        </div>
                    </div>
                `).join('');
            } else {
                 popularGamesContainer.innerHTML = `<h3>Erro ao carregar jogos populares. Verifique seu Client-ID e Bearer Token no script.js.</h3>`;
            }
        }
    }

    // B) Lógica da Página de Resultados (resultados.html)
    async function renderResultsPage() {
        if (window.location.pathname.endsWith('resultados.html')) {
            const resultsContainer = document.getElementById('results-list');
            const urlParams = new URLSearchParams(window.location.search);
            const searchTerm = urlParams.get('search');
            
            if (resultsContainer) {
                document.getElementById('search-term-display').textContent = searchTerm;

                if (searchTerm) {
                    resultsContainer.innerHTML = '<h3>Buscando por: ' + searchTerm + ' (via IGDB)...</h3>';
                    const data = await searchGames(searchTerm);

                    if (data && data.length > 0) {
                        resultsContainer.innerHTML = data.map(game => `
                            <div class="game-card" data-id="${game.id}" onclick="window.location.href='detalhes.html?slug=${game.slug}'"> 
                                <img src="${game.cover ? getCoverUrl(game.cover.url) : 'assets/images/placeholder.jpg'}" alt="${game.name}" class="card-image">
                                <div class="card-info">
                                    <h3 class="card-title">${game.name}</h3>
                                    <p class="card-platforms">Plataformas: ${game.platforms ? game.platforms.map(p => p.name).slice(0, 3).join(', ') : 'N/A'}</p>
                                    <div class="card-rating">⭐ ${game.rating ? game.rating.toFixed(1) : 'N/A'}</div>
                                    <span class="favorite-icon">🤍</span> 
                                </div>
                            </div>
                        `).join('');
                    } else {
                        resultsContainer.innerHTML = '<h3>Nenhum resultado encontrado para "' + searchTerm + '".</h3>';
                    }
                } else {
                    resultsContainer.innerHTML = '<h3>Utilize a barra de busca acima para encontrar jogos.</h3>';
                }
            }
        }
    }

    // Executa as funções de renderização apropriadas
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path === '/' || path === '') {
        renderIndexPage();
    }
    if (path.endsWith('resultados.html')) {
        renderResultsPage();
    }
});