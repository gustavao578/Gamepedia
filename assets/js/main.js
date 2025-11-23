/**
 * main.js - Utilidades Globais e Tema (LocalStorage Puro)
 */

// ==================================================================
// STORAGE
// ==================================================================

const Storage = {
    getFavorites() {
        return JSON.parse(localStorage.getItem('gamepedia_favorites') || '[]');
    },

    toggleFavorite(gameId) {
        let favorites = this.getFavorites();
        const idString = gameId.toString();
        const index = favorites.indexOf(idString);

        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(idString);
        }

        localStorage.setItem('gamepedia_favorites', JSON.stringify(favorites));
        return index === -1;
    },

    isFavorited(gameId) {
        return this.getFavorites().includes(gameId.toString());
    },

    saveSearchTerm(term) {
        let searches = JSON.parse(localStorage.getItem('gamepedia_recentSearches') || '[]');
        searches = searches.filter(s => s !== term);
        searches.unshift(term);
        searches = searches.slice(0, 5);
        localStorage.setItem('gamepedia_recentSearches', JSON.stringify(searches));
    },

    getTheme() {
        return localStorage.getItem('gamepedia_theme') || 'dark';
    },

    setTheme(theme) {
        localStorage.setItem('gamepedia_theme', theme);
    }
};

// ==================================================================
// UI - Renderização de Componentes
// ==================================================================

const UI = {
    createGameCard(game) {
        const isFav = Storage.isFavorited(game.id);
        const placeholder = 'https://placehold.co/300x400/1F1F1F/EAEAEA?text=No+Image';
        // RAWG usa 'background_image', nosso cache antigo pode usar 'cover_url'
        const coverUrl = game.background_image || game.cover_url || placeholder;

        // CORREÇÃO 3: Tratamento inteligente de Plataformas
        // A API RAWG retorna array de objetos [{platform: {name: 'PC'}}]
        // Às vezes passamos array de strings ['PC', 'Xbox']
        let platformsText = 'Multiplataforma';
        
        if (game.platforms && Array.isArray(game.platforms) && game.platforms.length > 0) {
            // Se o primeiro item for objeto com propriedade 'platform', é estrutura RAWG
            if (game.platforms[0].platform) {
                platformsText = game.platforms.map(p => p.platform.name).join(', ');
            } 
            // Se for string, usa direto
            else if (typeof game.platforms[0] === 'string') {
                platformsText = game.platforms.join(', ');
            }
        }

        return `
            <div class="game-card" onclick="window.location.href='detalhes.html?id=${game.id}'">
                <img src="${coverUrl}" alt="${game.name}" class="card-image" onerror="this.src='${placeholder}'">
                <div class="card-info">
                    <h3 class="card-title">${game.name}</h3>
                    <p class="card-platforms">${platformsText}</p>
                    <span class="card-rating">⭐ ${(game.rating || 0).toFixed(1)}</span>
                </div>
                <span class="favorite-icon" data-id="${game.id}" onclick="event.stopPropagation(); UI.toggleFav(this)">${isFav ? '❤️' : '🤍'}</span>
            </div>
        `;
    },

    toggleFav(element) {
        const gameId = parseInt(element.dataset.id);
        const isNowFav = Storage.toggleFavorite(gameId);
        element.textContent = isNowFav ? '❤️' : '🤍';

        if (document.body.id === 'page-favoritos' && !isNowFav) {
            element.closest('.game-card').remove();
            const list = document.getElementById('favorites-list');
            if (list && list.children.length === 0) {
                document.getElementById('empty-message').style.display = 'block';
            }
        }
    }
};

// ==================================================================
// TEMA
// ==================================================================

const Theme = {
    init() {
        const theme = Storage.getTheme();
        this.apply(theme);
        this.setupToggleButtons();
    },

    apply(theme) {
        document.body.classList.remove('dark-mode', 'light-mode');
        document.body.classList.add(theme + '-mode');
        document.body.setAttribute('data-theme', theme);
        this.updateIcons();
    },

    toggle() {
        const current = Storage.getTheme();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        Storage.setTheme(newTheme);
        this.apply(newTheme);
    },

    updateIcons() {
        const isDark = Storage.getTheme() === 'dark';
        const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        
        const icon = isDark ? sunIcon : moonIcon;
        
        document.querySelectorAll('#theme-toggle, #theme-toggle-footer').forEach(btn => {
            btn.innerHTML = icon;
            btn.setAttribute('aria-label', isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro');
        });
    },

    setupToggleButtons() {
        const buttons = document.querySelectorAll('#theme-toggle, #theme-toggle-footer');
        buttons.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        });
        this.updateIcons();
    }
};

// ==================================================================
// BUSCA & FILTROS GLOBAIS
// ==================================================================

const Search = {
    init() {
        // Barra de busca
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');

        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performSearch(searchInput.value);
            });
        }

        // Modal de Filtros Global
        this.initFilterModal();
    },

    performSearch(term) {
        const cleanTerm = term.trim();
        if (cleanTerm) {
            Storage.saveSearchTerm(cleanTerm);
            // Mantém os filtros atuais se existirem na URL, senão apenas busca
            window.location.href = `resultados.html?search=${encodeURIComponent(cleanTerm)}`;
        }
    },

    initFilterModal() {
        const modal = document.getElementById('filters-modal');
        const openBtn = document.getElementById('open-filters-btn');
        const closeBtn = document.querySelector('.close-modal');
        const applyBtn = document.getElementById('apply-filters-btn');

        if (!modal || !openBtn) return;

        openBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            // Tenta preencher valores da URL atual se estivermos em resultados
            const urlParams = new URLSearchParams(window.location.search);
            const genre = document.getElementById('genre-filter');
            const platform = document.getElementById('platform-filter');
            const year = document.getElementById('year-filter');

            if (genre && urlParams.get('genre')) genre.value = urlParams.get('genre');
            if (platform && urlParams.get('platform')) platform.value = urlParams.get('platform');
            if (year && urlParams.get('year')) year.value = urlParams.get('year');
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const genre = document.getElementById('genre-filter').value;
                const platform = document.getElementById('platform-filter').value;
                const year = document.getElementById('year-filter').value;
                const searchInput = document.getElementById('search-input');
                const currentSearch = searchInput ? searchInput.value : (new URLSearchParams(window.location.search).get('search') || '');

                // Monta URL com parâmetros
                const params = new URLSearchParams();
                if (currentSearch) params.set('search', currentSearch);
                if (genre) params.set('genre', genre);
                if (platform) params.set('platform', platform);
                if (year) params.set('year', year);

                window.location.href = `resultados.html?${params.toString()}`;
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Search.init();
});