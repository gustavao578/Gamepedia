/**
 * main.js - Utilidades Globais e Tema
 */

// ==================================================================
// STORAGE - Local Storage Manager
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
        const placeholder = 'https://placehold.co/220x300/1F1F1F/EAEAEA?text=No+Image';
        const coverUrl = game.cover_url || placeholder;

        return `
            <div class="game-card" onclick="window.location.href='detalhes.html?id=${game.id}'">
                <img src="${coverUrl}" alt="${game.name}" class="card-image" onerror="this.src='${placeholder}'">
                <div class="card-info">
                    <h3 class="card-title">${game.name}</h3>
                    <p class="card-platforms">${(game.platforms && game.platforms.join(', ')) || 'Multiplataforma'}</p>
                    <span class="card-rating">⭐ ${(game.rating || 0).toFixed(0)}</span>
                </div>
                <span class="favorite-icon" data-id="${game.id}" onclick="event.stopPropagation(); UI.toggleFav(this)">${isFav ? '❤️' : '🤍'}</span>
            </div>
        `;
    },

    toggleFav(element) {
        const gameId = parseInt(element.dataset.id);
        const isNowFav = Storage.toggleFavorite(gameId);
        element.textContent = isNowFav ? '❤️' : '🤍';

        // Atualiza a lista de favoritos se estivermos na página de favoritos
        if (document.body.id === 'page-favoritos' && !isNowFav) {
             // Remove o card da DOM
            element.closest('.game-card').remove();
            // Verifica se a lista ficou vazia
            const list = document.getElementById('favorites-list');
            if (list && list.children.length === 0) {
                document.getElementById('empty-message').style.display = 'block';
            }
        }
    }
};

// ==================================================================
// TEMA - Dark/Light Mode
// ==================================================================

const Theme = {
    init() {
        const theme = Storage.getTheme();
        this.apply(theme);
        this.setupToggleButtons();
    },

    apply(theme) {
        document.body.className = '';
        document.body.classList.add(theme + '-mode');
        this.updateIcons();
    },

    toggle() {
        const current = Storage.getTheme();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        Storage.setTheme(newTheme);
        this.apply(newTheme);
    },

    // ** TAREFA 4: Atualizado para usar SVGs **
    updateIcons() {
        const isDark = Storage.getTheme() === 'dark';
        // Mostra o ícone do *oposto* para indicar a ação de clique
        const sunIcon = '<img src="assets/images/sunicon.png" alt="Mudar para Modo Claro" class="theme-icon">';
        const moonIcon = '<img src="assets/images/luaicon.jpg" alt="Mudar para Modo Escuro" class="theme-icon">';
        
        const icon = isDark ? sunIcon : moonIcon;
        
        document.querySelectorAll('[id*="theme-toggle"]').forEach(btn => {
            btn.innerHTML = icon;
        });
    },

    setupToggleButtons() {
        document.querySelectorAll('[id*="theme-toggle"]').forEach(btn => {
            btn.addEventListener('click', () => this.toggle());
        });
    }
};

// ==================================================================
// BUSCA - Search Handler
// ==================================================================

const Search = {
    init() {
        const searchForm = document.getElementById('search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('search-input');
                const term = input.value.trim();
                if (term) {
                    Storage.saveSearchTerm(term);
                    window.location.href = `resultados.html?search=${encodeURIComponent(term)}`;
                }
            });
        }
    }
};

// ==================================================================
// INICIALIZAÇÃO
// ==================================================================

document.addEventListener('DOMContentLoaded', () => {
   
    Theme.init();
    Search.init();
});