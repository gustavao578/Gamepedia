/**
 * favoritos.js - Página de Favoritos
 */

document.addEventListener('DOMContentLoaded', async () => {
    const favoritesList = document.getElementById('favorites-list');
    const emptyMessage = document.getElementById('empty-message');

    if (!favoritesList) return;

    // CORREÇÃO 3: Garantir classe de grid correta
    favoritesList.className = 'game-list';

    try {
        const favorites = Storage.getFavorites();

        if (favorites.length === 0) {
            favoritesList.style.display = 'none';
            emptyMessage.style.display = 'block';
            return;
        }

        favoritesList.innerHTML = '<p>Carregando favoritos...</p>';

        const games = [];
        for (const gameId of favorites) {
            const game = await api.getGameById(gameId);
            if (game) games.push(game);
        }

        if (games.length === 0) {
            favoritesList.style.display = 'none';
            emptyMessage.style.display = 'block';
        } else {
            favoritesList.style.display = 'grid';
            emptyMessage.style.display = 'none';
            // UI.createGameCard no main.js agora lida com os objetos de plataforma corretamente
            favoritesList.innerHTML = games
                .map(game => UI.createGameCard(game))
                .join('');
        }
    } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
        favoritesList.innerHTML = '<p>Erro ao carregar favoritos.</p>';
    }
});