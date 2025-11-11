/**
 * API Service - Gamepedia
 * Gerencia todas as chamadas à IGDB API e ao banco de dados local
 */

const API_CONFIG = {
    IGDB_BASE_URL: 'https://api.igdb.com/v4',
    IGDB_CLIENT_ID: 'botc0vhk45urrf6f0m4tpzrwj5hfho', // Substitua pela sua chave
    IGDB_ACCESS_TOKEN: 'YOUR_IGDB_ACCESS_TOKEN', // Substitua pelo seu token
    USE_LOCAL_DATA: true // Mude para false quando configurar IGDB
};

class GamepadiaAPI {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 3600000; // 1 hora
    }

    /**
     * Faz requisição à IGDB API
     */
    async fetchFromIGDB(endpoint, body) {
        if (!API_CONFIG.IGDB_CLIENT_ID || !API_CONFIG.IGDB_ACCESS_TOKEN) {
            console.warn('⚠️ IGDB não configurado. Usando dados locais.');
            return null;
        }

        try {
            const response = await fetch(`${API_CONFIG.IGDB_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Client-ID': API_CONFIG.IGDB_CLIENT_ID,
                    'Authorization': `Bearer ${API_CONFIG.IGDB_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`IGDB Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição IGDB:', error);
            return null;
        }
    }

    /**
     * Busca jogos populares
     */
    async getPopularGames(limit = 20) {
        const cacheKey = `popular_${limit}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        if (API_CONFIG.USE_LOCAL_DATA) {
            return await this.loadLocalGames();
        }

        const query = `
            fields id, name, cover.url, rating, release_dates.y, genres.name, platforms.name;
            where rating > 70;
            sort rating desc;
            limit ${limit};
        `;

        const result = await this.fetchFromIGDB('games', { query });
        if (result) {
            this.cache.set(cacheKey, result);
        }
        return result;
    }

    /**
     * Busca jogos recentes
     */
    async getRecentGames(limit = 20) {
        const cacheKey = `recent_${limit}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        if (API_CONFIG.USE_LOCAL_DATA) {
            return await this.loadLocalGames();
        }

        const query = `
            fields id, name, cover.url, rating, release_dates.y, genres.name, platforms.name;
            sort release_dates.y desc;
            limit ${limit};
        `;

        const result = await this.fetchFromIGDB('games', { query });
        if (result) {
            this.cache.set(cacheKey, result);
        }
        return result;
    }

    /**
     * Busca um jogo específico por ID
     */
    async getGameById(id) {
        const cacheKey = `game_${id}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        if (API_CONFIG.USE_LOCAL_DATA) {
            return await this.getLocalGameById(id);
        }

        const query = `
            fields id, name, summary, cover.url, rating, release_dates.y, genres.name, platforms.name, companies.name, screenshots.url, videos.video_id;
            where id = ${id};
        `;

        const result = await this.fetchFromIGDB('games', { query });
        if (result && result.length > 0) {
            this.cache.set(cacheKey, result[0]);
            return result[0];
        }
        return null;
    }

    /**
     * Busca jogos por termo de busca
     */
    async searchGames(searchTerm, limit = 50) {
        if (API_CONFIG.USE_LOCAL_DATA) {
            return await this.searchLocalGames(searchTerm);
        }

        const query = `
            fields id, name, cover.url, rating, release_dates.y, genres.name, platforms.name;
            search "${searchTerm}";
            limit ${limit};
        `;

        return await this.fetchFromIGDB('games', { query });
    }

    /**
     * Carrega dados locais (fallback)
     */
    async loadLocalGames() {
        try {
            const response = await fetch('assets/js/data/games.json');
            return await response.json();
        } catch (error) {
            console.error('Erro ao carregar games.json:', error);
            return [];
        }
    }

    /**
     * Busca jogo local por ID
     */
    async getLocalGameById(id) {
        const games = await this.loadLocalGames();
        return games.find(g => g.id === parseInt(id));
    }

    /**
     * Busca jogos locais por termo
     */
    async searchLocalGames(searchTerm) {
        const games = await this.loadLocalGames();
        const term = searchTerm.toLowerCase();
        return games.filter(game =>
            game.name.toLowerCase().includes(term) ||
            game.genres?.some(g => g.toLowerCase().includes(term))
        );
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