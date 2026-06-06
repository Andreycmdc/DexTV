import { searchAnime, buildAnimeUrl, clearCache } from './api.js';

const grid = document.getElementById('animeGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const resultsCount = document.getElementById('resultsCount');

let allAnimes = [];
let currentPage = 1;
let isLoading = false;

// Imágenes por defecto para animes populares
const IMAGES = {
    'naruto': 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg',
    'one piece': 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
    'attack on titan': 'https://cdn.myanimelist.net/images/anime/1000/110531l.jpg',
    'demon slayer': 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
    'jujutsu kaisen': 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg',
    'fullmetal alchemist': 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg',
    'death note': 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg',
    'bleach': 'https://cdn.myanimelist.net/images/anime/3/40451l.jpg',
    'dragon ball': 'https://cdn.myanimelist.net/images/anime/1277/142706l.jpg',
    'tokyo ghoul': 'https://cdn.myanimelist.net/images/anime/5/64449l.jpg'
};

function getImage(title) {
    const lower = title.toLowerCase();
    for (const [key, url] of Object.entries(IMAGES)) {
        if (lower.includes(key)) return url;
    }
    return null;
}

async function loadAnimes() {
    if (isLoading) return;
    isLoading = true;
    
    if (grid) {
        grid.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando animes...</p></div>';
    }
    
    const animes = await searchAnime('anime');
    allAnimes = animes;
    
    if (resultsCount) {
        resultsCount.textContent = `${allAnimes.length} animes`;
    }
    
    renderAnimes();
    isLoading = false;
}

function renderAnimes() {
    if (!grid) return;
    
    if (allAnimes.length === 0) {
        grid.innerHTML = '<div class="empty">🎬 No se encontraron animes</div>';
        return;
    }
    
    const itemsPerPage = 24;
    const displayAnimes = allAnimes.slice(0, currentPage * itemsPerPage);
    
    grid.innerHTML = displayAnimes.map((anime, idx) => {
        const animeUrl = buildAnimeUrl(anime.title);
        const rating = (Math.random() * 3 + 7).toFixed(1);
        let imageUrl = anime.picture || getImage(anime.title);
        
        if (!imageUrl) {
            imageUrl = `https://placehold.co/300x450/1a1a2e/a855f7?text=${encodeURIComponent(anime.title.substring(0, 10))}`;
        }
        
        return `
            <div class="anime-card" data-url="${animeUrl}" data-title="${escapeHtml(anime.title)}">
                <img src="${imageUrl}" 
                     alt="${escapeHtml(anime.title)}"
                     onerror="this.src='https://placehold.co/300x450/1a1a2e/a855f7?text='+encodeURIComponent('${escapeHtml(anime.title).substring(0,8)}')">
                <div class="anime-card-rating">⭐ ${rating}</div>
                <div class="anime-card-info">
                    <div class="anime-card-title">${escapeHtml(anime.title)}</div>
                    <div class="anime-card-type">${anime.type || 'Anime'} • ${anime.episodes} eps</div>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.anime-card').forEach(card => {
        card.addEventListener('click', () => {
            const url = card.dataset.url;
            const title = card.dataset.title;
            window.location.href = `player.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        });
    });
    
    if (loadMoreBtn) {
        loadMoreBtn.style.display = allAnimes.length > currentPage * itemsPerPage ? 'block' : 'none';
    }
}

function loadMore() {
    if (allAnimes.length > currentPage * 24) {
        currentPage++;
        renderAnimes();
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMore);
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        clearCache();
        location.reload();
    }
});

document.addEventListener('DOMContentLoaded', loadAnimes);
