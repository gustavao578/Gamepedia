// script.js (Lógica consolidada: IGDB API, Tema e Busca para o Gamepedia)

document.addEventListener('DOMContentLoaded', () => {
    
    // ==================================================================
    // 1. CONFIGURAÇÃO DA API IGDB (Funções de Serviço)
    // ==================================================================
    
    // 🛑 AÇÃO NECESSÁRIA: SUBSTITUA POR SUAS CREDENCIAIS REAIS DA TWITCH/IGDB
    const IGDB_CLIENT_ID = 'botc0vhk45urrf6f0m4tpzrwj5hfho'; // <-- SUBSTITUIR
    const IGDB_BEARER_TOKEN = 'Bearer '; // <-- SUBSTITUIR
    const IGDB_URL = 'https://api.igdb.com/v4/';

    /**
     * Função genérica para buscar dados da API IGDB.
     * @param {string} endpoint - O endpoint da API (ex: 'games', 'genres').
     * @param {string} data - A string de consulta no formato 'APICALYPSE'.
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
                // Tratamento de erro detalhado
                const errorText = await response.text();
                console.error(`Erro na API IGDB (Status: ${response.status}):`, errorText);
                return { error: `Erro de API: Status ${response.status} - Verifique o console para detalhes.` };
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Falha na requisição ao endpoint /${endpoint}:`, error);
            return { error: `Falha na Requisição: ${error.message}` };
        }
    }
    
    async function getPopularGames() {
        const query = 'fields name, rating, platforms.name, cover.url, slug; sort popularity desc; limit 8; where rating_count > 10;';
        return fetchData('games', query);
    }

    async function searchGames(query) {
        const queryData = `fields name, rating, platforms.name, cover.url, slug; search "${query}"; limit 20;`;
        return fetchData('games', queryData);
    }
    
    // ==================================================================
    // 2. CONFIGURAÇÃO INICIAL E LOCAL STORAGE (Mantido)
    // ==================================================================
    
    if (!localStorage.getItem('gamepedia_favorites')) {
        localStorage.setItem('gamepedia_favorites', JSON.stringify([])); 
    }
    if (!localStorage.getItem('gamepedia_recentSearches')) {
        localStorage.setItem('gamepedia_recentSearches', JSON.stringify([])); 
    }

    // ==================================================================
    // 3. LÓGICA DE TEMA (Mantido)
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
    // 4. LÓGICA DE BUSCA E REDIRECIONAMENTO (Mantido)
    // ==================================================================
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();

            if (searchTerm) {
                saveSearchTerm(searchTerm);
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
    // 5. RENDERIZAÇÃO ESPECÍFICA DE PÁGINAS (Com Feedback de Erro)
    // ==================================================================
    
    function getCoverUrl(coverUrl) {
        if (coverUrl) {
             return 'https:' + coverUrl.replace('t_thumb', 't_cover_big');
        }
        return 'assets/images/placeholder.jpg';
    }

    // A) Lógica da Página Inicial (index.html)
    async function renderIndexPage() {
        const popularGamesContainer = document.getElementById('popular-games');
        
        if (popularGamesContainer) {
             popularGamesContainer.innerHTML = '<h3>Carregando jogos populares (via IGDB)...</h3>';
             const data = await getPopularGames(); 
        
             if (data && !data.error && data.length > 0) { // Verifica se não houve erro e se há dados
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
                // FEEDBACK CLARO DE ERRO NA TELA
                const errorMessage = data && data.error ? data.error : "Dados vazios. Verifique se a query IGDB retornou resultados.";
                popularGamesContainer.innerHTML = `
                    <h3 style="color: red;">❌ Erro de Integração da API ❌</h3>
                    <p>O Gamepedia não conseguiu carregar os dados. Isso geralmente acontece por:</p>
                    <ul style="list-style-type: disc; padding-left: 20px; color: var(--primary-text);">
                        <li>1. **Token Expirado/Inválido:** Você precisa gerar um novo Bearer Token na Twitch.</li>
                        <li>2. **Credenciais Erradas:** Verifique se o Client ID e o Token estão inseridos corretamente no topo do <strong>script.js</strong>.</li>
                        <li><small>Detalhes Técnicos: ${errorMessage}</small></li>
                    </ul>
                `;
            }
        }
    }

    // B) Lógica da Página de Resultados (resultados.html) - Mantida para consistência
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

                    if (data && !data.error && data.length > 0) {
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
                        resultsContainer.innerHTML = '<h3>Nenhum resultado encontrado ou falha na API.</h3>';
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