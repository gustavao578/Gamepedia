/**
 * API Service - Gamepedia
 * Gerencia todas as chamadas à API RAWG.io
 *
 * NOTA: Migrado da IGDB para a RAWG para ser mais amigável
 * ao frontend (sem CORS, chave de API simples).
 */

const API_CONFIG = {
    RAWG_BASE_URL: 'https://api.rawg.io/api',
    // ! COLE SUA CHAVE DE API DA RAWG.IO AQUI
    RAWG_API_KEY: 'aa342ec7cbfd4929acc7ccfc090d5db5',
    // IDs das tags para excluir (71 = Sexual Content, 237 = Erotic, 472 = NSFW)
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
            console.warn('⚠️ RAWG API Key não configurada. Verifique api.js.');
            return null;
        }

        // Adiciona a chave de API à URL
        let url = `${API_CONFIG.RAWG_BASE_URL}/${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${API_CONFIG.RAWG_API_KEY}`;

         url += `&lang=${API_CONFIG.LANGUAGE}`;

        
        // Adiciona a exclusão de tags em todas as chamadas para 'games'
        if (endpoint.startsWith('games')) {
            url += `&exclude_tags=${API_CONFIG.EXCLUDE_TAGS}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`RAWG Error: ${response.status} ${response.statusText}`);
                throw new Error(`RAWG Error: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição RAWG:', error);
            return null;
        }
    }

    /**
     * Processa os dados brutos do jogo da RAWG para o formato do nosso App
     */
    processGameData(game) {
        return {
            id: game.id,
            name: game.name,
            summary: game.description_raw || game.description, // description_raw é melhor (sem HTML)
            cover_url: game.background_image,
            rating: game.rating, // Nota é de 0 a 5
            release_date: game.released, // Formato YYYY-MM-DD
            genres: game.genres ? game.genres.map(g => g.name) : ['N/A'],
            platforms: game.platforms ? game.platforms.map(p => p.platform.name) : ['N/A'],
            developer: game.developers ? game.developers.map(d => d.name).join(', ') : 'N/A',
            // Screenshots e vídeos são tratados em chamadas separadas
        };
    }

    /**
     * Busca jogos populares
     */
    async getPopularGames(limit = 20) {
        const cacheKey = `popular_${limit}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // O filtro de exclusão de tags será adicionado automaticamente pelo fetchFromRAWG
        const data = await this.fetchFromRAWG(`games?ordering=-rating&page_size=${limit}`);
        if (data && data.results) {
            const processedResult = data.results.map(this.processGameData);
            this.cache.set(cacheKey, processedResult);
            return processedResult;
        }
        return [];
    }

    /**
     * Busca jogos recentes
     */
    async getRecentGames(limit = 20) {
        const cacheKey = `recent_${limit}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Pega data de hoje e 3 meses atrás para "recentes"
        const today = new Date().toISOString().split('T')[0];
        const threeMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0];

        // O filtro de exclusão de tags será adicionado automaticamente pelo fetchFromRAWG
        const data = await this.fetchFromRAWG(`games?dates=${threeMonthsAgo},${today}&ordering=-released&page_size=${limit}`);
        if (data && data.results) {
            const processedResult = data.results.map(this.processGameData);
            this.cache.set(cacheKey, processedResult);
            return processedResult;
        }
        return [];
    }

    /**
     * Busca um jogo específico por ID
     */
    async getGameById(id) {
        const cacheKey = `game_${id}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const gameData = await this.fetchFromRAWG(`games/${id}`);
        if (!gameData) return null;

        // NOTA: Screenshots e trailers são buscados separadamente pela página
        // para melhor controle de carregamento.

        // ! CORREÇÃO: Não processar o gameData aqui.
        // A página de detalhes precisa do objeto "cru" (raw) da API
        // para ter acesso a todos os campos (metacritic, description, ratings_count, etc.)
        // A função processGameData() é só para os cards das listas.
        // const processedGame = this.processGameData(gameData);
        
        // Retorna o dado bruto e salva em cache
        this.cache.set(cacheKey, gameData);
        return gameData;
    }

    /**
     * Busca screenshots de um jogo
     */
    async getGameScreenshots(id) {
        const data = await this.fetchFromRAWG(`games/${id}/screenshots`);
        return data ? data.results : [];
    }

    /**
     * Busca trailers de um jogo
     */
    async getGameTrailers(id) {
        const data = await this.fetchFromRAWG(`games/${id}/movies`);
        return data ? data.results : [];
    }

    /**
     * Busca reviews de usuários de um jogo
     */
    async getGameReviews(id) {
        const data = await this.fetchFromRAWG(`games/${id}/reviews`);
        return data ? data.results : [];
    }

    /**
     * Busca jogos similares
     */
    async getSimilarGames(id) {
        const data = await this.fetchFromRAWG(`games/${id}/suggested`);
        return data ? data.results : [];
    }


    /**
     * Busca jogos por termo de busca
     */
    async searchGames(searchTerm, limit = 50) {
        // O filtro de exclusão de tags será adicionado automaticamente pelo fetchFromRAWG
        const data = await this.fetchFromRAWG(`games?search=${encodeURIComponent(searchTerm)}&page_size=${limit}`);
        if (data && data.results) {
            return data.results.map(this.processGameData);
        }
        return [];
    }

    /**
     * Limpa cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Exporta instância única
const api = new GamepadiaAPI();