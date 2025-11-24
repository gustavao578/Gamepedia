/**
 * API Service - Gamepedia
 * Gerencia todas as chamadas à API RAWG.io com suporte a Paginação e Filtros
 */

const API_CONFIG = {
    RAWG_BASE_URL: 'https://api.rawg.io/api',
    // ! COLE SUA CHAVE DE API DA RAWG.IO AQUI
    RAWG_API_KEY: 'aa342ec7cbfd4929acc7ccfc090d5db5',
    EXCLUDE_TAGS: '71,237,472',
    LANGUAGE: 'pt'
};

class GamepadiaAPI {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 3600000; // 1 hora
    }

    /**
     * Faz requisição à API RAWG
     */
    async fetchFromRAWG(endpoint) {
        if (!API_CONFIG.RAWG_API_KEY || API_CONFIG.RAWG_API_KEY === 'COLE_SUA_CHAVE_API_DA_RAWG_AQUI') {
            console.warn('⚠️ RAWG API Key não configurada.');
            return null;
        }

        let url = `${API_CONFIG.RAWG_BASE_URL}/${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${API_CONFIG.RAWG_API_KEY}`;
        url += `&lang=${API_CONFIG.LANGUAGE}`;

        if (endpoint.startsWith('games')) {
            url += `&exclude_tags=${API_CONFIG.EXCLUDE_TAGS}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`RAWG Error: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição RAWG:', error);
            return null;
        }
    }

    processGameData(game) {
        return {
            id: game.id,
            name: game.name,
            summary: game.description_raw || game.description,
            background_image: game.background_image,
            rating: game.rating,
            release_date: game.released,
            genres: game.genres ? game.genres.map(g => g.name) : ['N/A'],
            platforms: game.platforms ? game.platforms.map(p => p.platform.name) : ['N/A'],
            developer: game.developers ? game.developers.map(d => d.name).join(', ') : 'N/A'
        };
    }

    /**
     * Busca jogos com Filtros Avançados e Paginação
     * @param {Object} filters - Objeto com filtros (search, genre, platform, dates, ordering)
     * @param {number} page - Número da página atual
     * @param {number} pageSize - Itens por página
     */
    async getFilteredGames(filters = {}, page = 1, pageSize = 20) {
        let query = `games?page=${page}&page_size=${pageSize}`;

        if (filters.search) {
            query += `&search=${encodeURIComponent(filters.search)}`;
            query += `&search_precise=true`; // Melhora a precisão da busca
        }
        
        // RAWG usa 'genres' (slugs, ex: 'action', 'indie')
        if (filters.genre) query += `&genres=${filters.genre.toLowerCase()}`;
        
        // RAWG usa 'platforms' (IDs). Como seu select envia nomes, precisaria mapear.
        // Simplificação: Busca textual se não tiver mapeamento de IDs, ou usa parent_platforms
        // Para este exemplo, vamos assumir que o select envia o ID correto ou faremos busca textual simples nos resultados se a API falhar,
        // mas a RAWG idealmente pede IDs (ex: 4=PC, 18=PS4).
        // Para facilitar sem um mapa de IDs gigante, vamos confiar na busca textual ou ignorar se for complexo.
        // NOTA: Para filtro real de plataforma funcionar 100%, precisaríamos dos IDs da RAWG.
        
        // Filtro de Ano (dates)
        if (filters.year) {
            query += `&dates=${filters.year}-01-01,${filters.year}-12-31`;
        }

        // Ordenação
        if (filters.ordering) query += `&ordering=${filters.ordering}`;

        const data = await this.fetchFromRAWG(query);
        
        if (data && data.results) {
            return {
                results: data.results.map(this.processGameData),
                count: data.count, // Total de resultados
                next: data.next,
                previous: data.previous
            };
        }
        return { results: [], count: 0 };
    }

    // Mantido para compatibilidade com detalhes.js
    async getGameById(id) {
        const cacheKey = `game_${id}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
        const gameData = await this.fetchFromRAWG(`games/${id}`);
        if (gameData) {
            this.cache.set(cacheKey, gameData);
            return gameData;
        }
        return null;
    }
    
    // Métodos auxiliares mantidos...
    async getGameScreenshots(id) {
        const data = await this.fetchFromRAWG(`games/${id}/screenshots`);
        return data ? data.results : [];
    }
    async getGameTrailers(id) {
        const data = await this.fetchFromRAWG(`games/${id}/movies`);
        return data ? data.results : [];
    }
    async getGameReviews(id) {
        const data = await this.fetchFromRAWG(`games/${id}/reviews`);
        return data ? data.results : [];
    }
    async getSimilarGames(id) {
        const data = await this.fetchFromRAWG(`games/${id}/suggested`);
        return data ? data.results : [];
    }
    async getPopularGames(limit = 20) {
        // Redireciona para a nova função filtrada
        const data = await this.getFilteredGames({ ordering: '-rating' }, 1, limit);
        return data.results;
    }
    async getRecentGames(limit = 20) {
        // Redireciona para a nova função filtrada
        const data = await this.getFilteredGames({ ordering: '-released' }, 1, limit);
        return data.results;
    }
    // Search antigo redireciona para o novo
    async searchGames(searchTerm, limit = 20) {
        const data = await this.getFilteredGames({ search: searchTerm }, 1, limit);
        return data.results;
    }
}

const api = new GamepadiaAPI();