/**
 * favoritos.js - Página de Favoritos
 */

document.addEventListener('DOMContentLoaded', async () => {
    const favoritesList = document.getElementById('favorites-list');
    const emptyMessage = document.getElementById('empty-message');

    if (!favoritesList) return;

    try {
        const favorites = Storage.getFavorites();

        if (favorites.length === 0) {
            favoritesList.style.display = 'none';
            emptyMessage.style.display = 'block';
            return;
        }

        favoritesList.innerHTML = '<p>Carregando favoritos...</p>';

        // Carrega detalhes de cada jogo favoritado
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
            favoritesList.innerHTML = games
                .map(game => UI.createGameCard(game))
                .join('');
        }
    } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
        favoritesList.innerHTML = '<p>Erro ao carregar favoritos.</p>';
    }
});