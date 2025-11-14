/**
 * detalhes.js - Página de Detalhes do Jogo (Estrutura Completa RAWG)
 */

// ==================================================================
// FUNÇÕES DE RENDERIZAÇÃO (Bloco por Bloco)
// ==================================================================

/**
 * Converte um array de objetos (ex: {name: "Ação"}) para string
 */
function formatList(items, key = 'name') {
    if (!items || items.length === 0) return 'N/A';
    // Trata o caso de plataformas: [{platform: {name: "PC"}}]
    if (items[0].platform) {
        return items.map(item => item.platform.name).join(', ');
    }
    return items.map(item => item[key]).join(', ');
}

/**
 * BLOCO 1: Informações Principais
 */
function renderMainInfo(game) {
    // Título da Página e do Jogo
    document.title = `Gamepedia | ${game.name}`;
    document.getElementById('game-title').textContent = game.name;

    // Imagem Principal
    const coverImg = document.getElementById('main-image');
    const placeholder = 'https://placehold.co/300x400/1F1F1F/EAEAEA?text=No+Image';
    coverImg.src = game.background_image || placeholder;
    coverImg.alt = game.name;
    coverImg.onerror = () => { coverImg.src = placeholder; };

    // Container de Nota (Rating)
    const ratingContainer = document.getElementById('rating-container');
    ratingContainer.innerHTML = `
        <h3 class="section-title" style="margin-bottom: 10px; font-size: 1.2em;">Nota Geral</h3>
        <span class="rating-tag" style="font-size: 1.2em;">⭐ ${game.rating} / 5</span>
        <p style="color: var(--color-text-secondary); margin-top: 10px;">Baseado em ${game.ratings_count} votos.</p>
    `;
    
    // Lista de Infos
    if (game.metacritic) {
        document.getElementById('metacritic-score').innerHTML = `<span class="metacritic">${game.metacritic}</span>`;
    }
    document.getElementById('genres').textContent = formatList(game.genres);
    document.getElementById('platforms').textContent = formatList(game.platforms);
    document.getElementById('release-date').textContent = new Date(game.released).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    document.getElementById('developers').textContent = formatList(game.developers);
    document.getElementById('publishers').textContent = formatList(game.publishers);
}

/**
 * BLOCO 2: Descrição
 */
function renderDescription(game) {
    // Usa description_raw para texto puro, ou description (com HTML)
    document.getElementById('description-text').innerHTML = game.description || game.description_raw || "Nenhuma descrição disponível.";
}

/**
 * BLOCO 3: Dados Adicionais
 */
function renderAdditionalData(game) {
    document.getElementById('playtime').textContent = game.playtime || 'N/A';
    if (game.website) {
        document.getElementById('website-link').innerHTML = `<a href="${game.website}" target="_blank" rel="noopener noreferrer">${game.website}</a>`;
    }
    
    const tagsContainer = document.getElementById('tags-container');
    if (game.tags && game.tags.length > 0) {
        tagsContainer.innerHTML = game.tags.map(tag => `<span class="tag">${tag.name}</span>`).join('');
    } else {
        tagsContainer.innerHTML = "<p>Nenhuma tag.</p>";
    }
}

/**
 * BLOCO 4: Galeria (Screenshots)
 */
function renderGallery(screenshots) {
    const grid = document.getElementById('screenshots-grid');
    if (!screenshots || screenshots.length === 0) {
        grid.innerHTML = "<p>Nenhuma screenshot disponível.</p>";
        return;
    }
    grid.innerHTML = screenshots.map(img => 
        `<a href="${img.image}" target="_blank" rel="noopener noreferrer">
            <img src="${img.image}" alt="Screenshot">
         </a>`
    ).join('');
}

/**
 * BLOCO 5: Trailers (Vídeos)
 */
function renderTrailers(movies) {
    const list = document.getElementById('trailers-list');
    if (!movies || movies.length === 0) {
        list.innerHTML = "<p>Nenhum trailer disponível.</p>";
        return;
    }
    list.innerHTML = movies.map(video => `
        <div class="trailer-item">
            <h4>${video.name}</h4>
            <video controls preload="metadata" poster="${video.preview}" class="trailer-video">
                <source src="${video.data['480']}" type="video/mp4">
                Seu navegador não suporta vídeos.
            </video>
        </div>
    `).join('');
}

/**
 * BLOCO 6: Avaliações (Reviews)
 */
function renderReviews(game, reviews) {
    // 6.1: Breakdown
    const breakdownContainer = document.getElementById('rating-breakdown');
    document.getElementById('ratings-count').textContent = game.ratings_count;
    
    if (game.ratings && game.ratings.length > 0) {
        breakdownContainer.innerHTML = game.ratings.map(rating => `
            <div class="rating-bar">
                <span class="rating-title" style="text-transform: capitalize;">${rating.title} (${rating.count})</span>
                <div class="bar-bg">
                    <div class="bar-fill" style="width: ${rating.percent}%;"></div>
                </div>
            </div>
        `).join('');
    } else {
        breakdownContainer.innerHTML = "<p>Sem breakdown de notas.</p>";
    }

    // 6.2: Reviews de Usuários
    const reviewsContainer = document.getElementById('user-reviews');
    if (!reviews || reviews.length === 0) {
        reviewsContainer.innerHTML = "<p>Nenhum review de usuário encontrado.</p>";
        return;
    }
    reviewsContainer.innerHTML = reviews.map(review => `
        <div class="user-review">
            <strong>${review.user.username} (Nota: ${review.rating})</strong>
            <p>${review.text}</p>
        </div>
    `).join('');
}

/**
 * BLOCO 7: Jogos Similares
 */
function renderSimilarGames(similarGames) {
    const grid = document.getElementById('similar-games-grid');
    if (!similarGames || similarGames.length === 0) {
        grid.innerHTML = "<p>Nenhum jogo similar encontrado.</p>";
        return;
    }
    // Reutiliza a função de card do main.js
    // Nota: A API de /suggested retorna menos dados, então adaptamos
    grid.innerHTML = similarGames.map(game => {
        const gameData = {
            id: game.id,
            name: game.name,
            cover_url: game.background_image,
            rating: game.rating,
            platforms: game.platforms ? game.platforms.map(p => p.platform.name) : ['N/A']
        };
        return UI.createGameCard(gameData);
    }).join('');
}

// =f=================================================================
// INICIALIZAÇÃO DA PÁGINA
// ==================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = parseInt(urlParams.get('id'));

    const loadingEl = document.getElementById('loading-message');
    const contentEl = document.getElementById('game-details-content');

    if (!gameId) {
        loadingEl.innerHTML = '<h2>ID do jogo não fornecido</h2>';
        return;
    }

    try {
        // Mostra o loading, esconde o conteúdo
        loadingEl.style.display = 'block';
        contentEl.style.display = 'none';

        // Busca todos os dados da API em paralelo
        const [gameData, screenshots, movies, reviews, similarGames] = await Promise.all([
            api.getGameById(gameId),
            api.getGameScreenshots(gameId),
            api.getGameTrailers(gameId),
            api.getGameReviews(gameId),
            api.getSimilarGames(gameId)
        ]);

        if (!gameData) {
            throw new Error('Jogo não encontrado.');
        }

        // --- Renderiza Bloco por Bloco ---
        renderMainInfo(gameData);
        renderDescription(gameData);
        renderAdditionalData(gameData);
        renderGallery(screenshots);
        renderTrailers(movies);
        renderReviews(gameData, reviews);
        renderSimilarGames(similarGames);

        // --- Lógica de Favoritos (Original) ---
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
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';

    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        loadingEl.innerHTML = `<h2>Erro ao carregar detalhes</h2><p>${error.message}. Verifique o console.</p>`;
    }
});