/**
 * detalhes.js - Página de Detalhes do Jogo
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = parseInt(urlParams.get('id'));

    if (!gameId) {
        document.getElementById('loading-message').innerHTML = '<h2>ID do jogo não fornecido</h2>';
        return;
    }

    try {
        const game = await api.getGameById(gameId);

        if (!game) {
            document.getElementById('loading-message').innerHTML = '<h2>Jogo não encontrado</h2>';
            return;
        }

        // Atualiza título da página
        document.title = `Gamepedia | ${game.name}`;

        // Preenche detalhes
        document.getElementById('game-title').textContent = game.name;
        document.getElementById('game-rating').textContent = `⭐ ${(game.rating || 0).toFixed(1)}/5`;

        const releaseDate = game.release_date
            ? new Date(game.release_date * 1000).toLocaleDateString('pt-BR')
            : 'N/A';
        document.getElementById('game-release').textContent = `Lançamento: ${releaseDate}`;

        document.getElementById('game-genres').textContent = `Gêneros: ${(game.genres && game.genres.join(', ')) || 'N/A'}`;
        document.getElementById('game-platforms').textContent = (game.platforms && game.platforms.join(', ')) || 'N/A';
        document.getElementById('game-summary').textContent = game.summary || 'Sem descrição disponível.';
        document.getElementById('game-developer').textContent = game.developer || 'N/A';

        // Define capa do jogo
        const coverImg = document.getElementById('game-cover');
        if (game.cover_url) {
            coverImg.src = game.cover_url;
            coverImg.alt = game.name;
        }

        // Favoritos
        const favoriteBtn = document.getElementById('favorite-toggle');
        const favoriteIcon = document.getElementById('favorite-icon');

        function updateFavoriteButton() {
            const isFav = Storage.isFavorited(gameId);
            favoriteIcon.textContent = isFav ? '❤️' : '🤍';
        }

        updateFavoriteButton();

        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                Storage.toggleFavorite(gameId);
                updateFavoriteButton();
            });
        }

        // Mostra conteúdo
        document.getElementById('loading-message').style.display = 'none';
        document.getElementById('game-details-content').style.display = 'block';

    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        document.getElementById('loading-message').innerHTML = '<h2>Erro ao carregar detalhes</h2>';
    }
});