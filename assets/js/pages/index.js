/**
 * index.js - Página Inicial
 */

document.addEventListener('DOMContentLoaded', async () => {
    const recentGamesContainer = document.getElementById('recent-games');
    const popularGamesContainer = document.getElementById('popular-games');

    if (!recentGamesContainer || !popularGamesContainer) return;

    try {
        // Carrega jogos recentes
        const recentGames = await api.getRecentGames(6);
        if (recentGames && recentGames.length > 0) {
            recentGamesContainer.innerHTML = recentGames
                .map(game => UI.createGameCard(game))
                .join('');
        } else {
            recentGamesContainer.innerHTML = '<p>Nenhum jogo recente encontrado.</p>';
        }

        // Carrega jogos populares
        const popularGames = await api.getPopularGames(12);
        if (popularGames && popularGames.length > 0) {
            popularGamesContainer.innerHTML = popularGames
                .map(game => UI.createGameCard(game))
                .join('');
        } else {
            popularGamesContainer.innerHTML = '<p>Nenhum jogo popular encontrado.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar jogos:', error);
        recentGamesContainer.innerHTML = '<p>Erro ao carregar jogos. Tente novamente.</p>';
    }
});