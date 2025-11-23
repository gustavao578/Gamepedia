/**
 * detalhes.js - Página de Detalhes do Jogo (Estrutura Completa RAWG)
 */

// ==================================================================
// FUNÇÕES DE RENDERIZAÇÃO
// ==================================================================

function formatList(items, key = 'name') {
    if (!items || items.length === 0) return 'N/A';
    if (items[0].platform) {
        return items.map(item => item.platform.name).join(', ');
    }
    return items.map(item => item[key]).join(', ');
}

// ... (renderMainInfo, renderDescription, renderAdditionalData, renderGallery mantidos iguais) ...
function renderMainInfo(game) {
    document.title = `Gamepedia | ${game.name}`;
    document.getElementById('game-title').textContent = game.name;
    const coverImg = document.getElementById('main-image');
    const placeholder = 'https://placehold.co/300x400/1F1F1F/EAEAEA?text=No+Image';
    coverImg.src = game.background_image || placeholder;
    coverImg.alt = game.name;
    coverImg.onerror = () => { coverImg.src = placeholder; };
    const ratingContainer = document.getElementById('rating-container');
    ratingContainer.innerHTML = `
        <h3 class="section-title" style="margin-bottom: 10px; font-size: 1.2em;">Nota Geral</h3>
        <span class="rating-tag" style="font-size: 1.2em;">⭐ ${game.rating} / 5</span>
        <p style="color: var(--color-text-secondary); margin-top: 10px;">Baseado em ${game.ratings_count} votos.</p>
    `;
    if (game.metacritic) {
        document.getElementById('metacritic-score').innerHTML = `<span class="metacritic">${game.metacritic}</span>`;
    }
    document.getElementById('genres').textContent = formatList(game.genres);
    document.getElementById('platforms').textContent = formatList(game.platforms);
    document.getElementById('release-date').textContent = new Date(game.released).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    document.getElementById('developers').textContent = formatList(game.developers);
    document.getElementById('publishers').textContent = formatList(game.publishers);
}

function renderDescription(game) {
    document.getElementById('description-text').innerHTML = game.description || game.description_raw || "Nenhuma descrição disponível.";
}

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

// 2. Renderização de Trailers (Vídeos MP4)
function renderTrailers(movies) {
    // Busca o container pelo ID solicitado: 'trailers-container'
    // Nota: O ID no HTML pode variar, estou ajustando para procurar pelo container correto na DOM
    // Caso o HTML use outro ID, o código abaixo tenta encontrar pelo nome usado na estrutura anterior também.
    const list = document.getElementById('trailers-list') || document.getElementById('trailers-container');
    
    if (!list) return;

    if (!movies || movies.length === 0) {
        list.innerHTML = "<p>Nenhum trailer disponível para este jogo.</p>";
        return;
    }
    
    list.innerHTML = movies.map(video => `
        <div class="trailer-item" style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px;">${video.name}</h4>
            <video controls width="100%" poster="${video.preview}" class="trailer-video" style="border-radius: 8px;">
                <source src="${video.data.max || video.data['480']}" type="video/mp4">
                Seu navegador não suporta vídeos.
            </video>
        </div>
    `).join('');
}

function renderReviews(game, reviews) {
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

// 3. Renderização de Jogos Similares
function renderSimilarGames(similarGames) {
    // Busca o container pelo ID solicitado: 'similar-games-container'
    const grid = document.getElementById('similar-games-grid') || document.getElementById('similar-games-container');
    
    if (!grid) return;

    if (!similarGames || similarGames.length === 0) {
        grid.innerHTML = "<p>Nenhum jogo similar encontrado.</p>";
        return;
    }
    
    // Reutiliza a função de card do main.js (UI.createGameCard)
    grid.innerHTML = similarGames.map(game => {
        // Prepara objeto compatível com UI.createGameCard
        const gameData = {
            id: game.id,
            name: game.name,
            cover_url: game.background_image, // RAWG property
            background_image: game.background_image, // Backup
            rating: game.rating,
            platforms: game.platforms ? game.platforms.map(p => p.platform.name) : ['N/A']
        };
        return UI.createGameCard(gameData);
    }).join('');
}

// ==================================================================
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
        loadingEl.style.display = 'block';
        contentEl.style.display = 'none';

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

        renderMainInfo(gameData);
        renderDescription(gameData);
        renderAdditionalData(gameData);
        renderGallery(screenshots);
        renderTrailers(movies);
        renderReviews(gameData, reviews);
        renderSimilarGames(similarGames);

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

        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';

    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        loadingEl.innerHTML = `<h2>Erro ao carregar detalhes</h2><p>${error.message}. Verifique o console.</p>`;
    }
});