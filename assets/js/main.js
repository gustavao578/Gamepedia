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
        const coverUrl = game.cover_url || 'https://via.placeholder.com/220x300?text=No+Image';

        return `
            <div class="game-card" onclick="window.location.href='detalhes.html?id=${game.id}'">
                <img src="${coverUrl}" alt="${game.name}" class="card-image" onerror="this.src='https://via.placeholder.com/220x300?text=No+Image'">
                <div class="card-info">
                    <h3 class="card-title">${game.name}</h3>
                    <p class="card-platforms">${(game.platforms && game.platforms.join(', ')) || 'Multiplataforma'}</p>
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

    updateIcons() {
        const isDark = Storage.getTheme() === 'dark';
        const icon = isDark ? '☀️' : '🌙';
        document.querySelectorAll('[id*="theme-toggle"]').forEach(btn => {
            btn.textContent = icon;
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
    const authButton = document.getElementById('auth-button');
    const authMenu = document.getElementById('auth-menu');

    function getUser() {
        try { return JSON.parse(localStorage.getItem('gamepedia_user')); }
        catch { return null; }
    }

    function renderAuth() {
        const user = getUser();
        if (!authButton) return;
        if (user && user.username) {
            authButton.textContent = user.username;
            authButton.classList.add('logged-in');
            if (authMenu) {
                authMenu.innerHTML = `
                    <a href="perfil.html" class="auth-link">Ver Perfil</a>
                    <button id="logout-btn" class="auth-logout">Sair</button>
                `;
            }
        } else {
            authButton.textContent = 'Entrar';
            authButton.classList.remove('logged-in');
            if (authMenu) {
                authMenu.innerHTML = `
                    <a href="login.html" class="auth-link">Entrar</a>
                    <a href="cadastro.html" class="auth-link">Criar Conta</a>
                `;
            }
        }
    }

    // abrir/fechar menu ao clicar
    authButton && authButton.addEventListener('click', (e) => {
        const user = getUser();
        if (!authMenu) {
            if (!user) window.location.href = 'login.html';
            return;
        }
        authMenu.style.display = authMenu.style.display === 'block' ? 'none' : 'block';
    });

    // fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!authMenu || !authButton) return;
        if (!authButton.contains(e.target) && !authMenu.contains(e.target)) {
            authMenu.style.display = 'none';
        }
    });

    // logout
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'logout-btn') {
            localStorage.removeItem('gamepedia_user');
            renderAuth();
            authMenu.style.display = 'none';
        }
    });

    Theme.init();
    Search.init();
    renderAuth();
});