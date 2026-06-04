#!/bin/bash

echo "=========================================="
echo "🔧 DEXTV - REPARANDO REPRODUCTOR"
echo "=========================================="

# 1. Actualizar server.js
cat > ~/DexTV/anime1v-api/src/server.js << 'SERVEREOF'
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3001;

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

const videoUrls = {
    20: {
        1: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        2: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFunflies.mp4',
        3: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        default: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    },
    21: { default: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFunflies.mp4' },
    1535: { default: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
    16498: { default: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
    default: { default: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }
};

app.get('/api/v1/anime/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ results: [] });
    try {
        const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20`);
        const results = response.data.data.map(anime => ({
            title: anime.title, url: `https://myanimelist.net/anime/${anime.mal_id}`,
            image: anime.images.jpg.image_url, year: anime.year || 'N/A', mal_id: anime.mal_id
        }));
        res.json({ results });
    } catch (error) { res.json({ results: [] }); }
});

app.get('/api/v1/anime/info', async (req, res) => {
    const url = req.query.url;
    const malId = url?.match(/\/anime\/(\d+)/);
    if (!malId) return res.json({ episodes: [] });
    const animeId = malId[1];
    try {
        const animeRes = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
        const totalEpisodes = animeRes.data.data.episodes || 24;
        const episodes = [];
        for (let i = 1; i <= Math.min(totalEpisodes, 24); i++) {
            episodes.push({ number: i, title: `Episodio ${i}`, mal_id: animeId });
        }
        res.json({ title: animeRes.data.data.title, image: animeRes.data.data.images.jpg.image_url, episodes, total: totalEpisodes });
    } catch (error) { res.json({ episodes: [] }); }
});

app.get('/api/v1/anime/episode', async (req, res) => {
    const malId = req.query.mal_id || '20';
    const episodeNum = parseInt(req.query.episode) || 1;
    const animeVideos = videoUrls[malId] || videoUrls.default;
    const videoUrl = animeVideos[episodeNum] || animeVideos.default || videoUrls.default.default;
    res.json({ video_url: videoUrl, success: true });
});

app.listen(PORT, () => console.log(`✅ API en http://localhost:${PORT}`));
SERVEREOF

echo "✅ 1/6 server.js actualizado"

# 2. Actualizar player.js
cat > ~/DexTV/dexTV-web/js/player.js << 'PLAYEREOF'
window.DexTVPlayer = {
    currentMalId: null, currentEpisode: null, player: null, watchedEpisodes: {},
    init: function() {
        this.player = document.getElementById('mainPlayer');
        const saved = localStorage.getItem('dextv_watched');
        if (saved) this.watchedEpisodes = JSON.parse(saved);
        if (this.player) {
            this.player.addEventListener('error', (e) => showToast('Error en video', 'error'));
            this.player.addEventListener('loadedmetadata', () => showToast('Video listo', 'success'));
        }
        this.setupQualitySelector();
    },
    loadVideo: function(url, malId, episodeNum) {
        if (!url || !this.player) return false;
        this.currentMalId = malId;
        this.currentEpisode = episodeNum;
        localStorage.setItem(`dextv_last_ep_${malId}`, episodeNum);
        this.player.src = url;
        this.player.load();
        this.player.play().catch(() => showToast('Click para reproducir', 'info'));
        return true;
    },
    getLastEpisode: function(malId) { return localStorage.getItem(`dextv_last_ep_${malId}`); },
    isWatched: function(malId, episode) { return !!this.watchedEpisodes[`${malId}_${episode}`]; },
    setupQualitySelector: function() {
        document.querySelectorAll('#qualitySelector button').forEach(btn => {
            btn.addEventListener('click', () => showToast(`Calidad ${btn.dataset.quality}`, 'success'));
        });
    }
};
PLAYEREOF

echo "✅ 2/6 player.js actualizado"

# 3. Actualizar app.js
cat > ~/DexTV/dexTV-web/js/app.js << 'APPEOF'
const API_URL = 'http://localhost:3001/api/v1/anime';

const popularAnimes = [
    { id: 20, title: 'Naruto', image: 'https://cdn.myanimelist.net/images/anime/1141/142503.jpg', year: 2002, hot: true, description: 'Un joven ninja busca reconocimiento mientras lucha contra demonios.' },
    { id: 21, title: 'One Piece', image: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg', year: 1999, hot: true, description: 'Monkey D. Luffy y su tripulación buscan el tesoro legendario.' },
    { id: 1535, title: 'Death Note', image: 'https://cdn.myanimelist.net/images/anime/9/9453.jpg', year: 2006, hot: true, description: 'Un estudiante encuentra un cuaderno que mata a cualquiera.' }
];

let heroInterval = null, heroIndex = 0, currentFilter = 'all', currentView = 'grid';

function initHero() {
    heroIndex = 0;
    updateHeroSlide();
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => { heroIndex = (heroIndex + 1) % popularAnimes.length; updateHeroSlide(); }, 5000);
}

function updateHeroSlide() {
    const anime = popularAnimes[heroIndex];
    document.getElementById('heroSlide').innerHTML = `<div class="hero-slide active" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('${anime.image}'); background-size: cover;"></div>`;
    document.getElementById('heroOverlay').innerHTML = `
        <h1 class="hero-title">${anime.title}</h1>
        <p class="hero-description">${anime.description}</p>
        <div class="hero-buttons">
            <button class="btn-play" onclick="quickPlay(${anime.id}, '${anime.title}')"><i class="fas fa-play"></i> Reproducir</button>
            <button class="btn-info" onclick="loadEpisodes(${anime.id}, '${anime.title}')"><i class="fas fa-info-circle"></i> Info</button>
        </div>
    `;
}

window.quickPlay = async function(malId, title) {
    await loadEpisodes(malId, title);
    setTimeout(() => playVideo(malId, 1), 500);
};

async function loadAnimes(filter = '') {
    let animes = [...popularAnimes];
    if (filter) animes = animes.filter(a => a.title.toLowerCase().includes(filter.toLowerCase()));
    const grid = document.getElementById('animeGrid');
    if (!grid) return;
    if (animes.length === 0) { grid.innerHTML = '<div class="loading-spinner">No se encontraron resultados</div>'; return; }
    grid.className = `anime-grid ${currentView === 'list' ? 'list-view' : ''}`;
    grid.innerHTML = animes.map(anime => `
        <div class="anime-card ${anime.hot ? 'hot' : ''}" onclick="loadEpisodes(${anime.id}, '${anime.title}')">
            ${anime.hot ? '<div class="hot-badge">🔥 HOT</div>' : ''}
            <img class="anime-image" src="${anime.image}" onerror="this.src='https://via.placeholder.com/200x280'">
            <div class="anime-info"><div class="anime-title">${anime.title}</div><div class="anime-year">${anime.year}</div></div>
        </div>
    `).join('');
}

window.loadEpisodes = async function(malId, title) {
    window.DexTVPlayer.currentMalId = malId;
    document.getElementById('animeSection').style.display = 'none';
    document.getElementById('playerSection').style.display = 'block';
    const episodeList = document.getElementById('episodeList');
    if (episodeList) episodeList.innerHTML = '<div class="loading-spinner">Cargando episodios...</div>';
    
    const episodes = [];
    for (let i = 1; i <= 24; i++) episodes.push({ number: i });
    const lastEpisode = window.DexTVPlayer.getLastEpisode(malId);
    
    if (episodeList) {
        episodeList.innerHTML = episodes.map(ep => `
            <div class="episode-btn" data-ep="${ep.number}" onclick="playVideo(${malId}, ${ep.number})">Ep. ${ep.number}</div>
        `).join('');
    }
    
    const continueContainer = document.getElementById('lastEpisodeContainer');
    if (continueContainer && lastEpisode) {
        continueContainer.innerHTML = `<div class="last-episode" onclick="loadEpisodes(${malId}, '${title}'); setTimeout(() => playVideo(${malId}, ${lastEpisode}), 500);">
            <div class="title">${title}</div><div class="ep">Episodio ${lastEpisode}</div></div>`;
    }
};

window.playVideo = async function(malId, episodeNum) {
    const episodeList = document.getElementById('episodeList');
    if (episodeList) episodeList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando video...</div>';
    
    try {
        const response = await fetch(`${API_URL}/episode?mal_id=${malId}&episode=${episodeNum}`);
        const data = await response.json();
        
        if (data.video_url) {
            window.DexTVPlayer.loadVideo(data.video_url, malId, episodeNum);
            const episodes = [];
            for (let i = 1; i <= 24; i++) episodes.push({ number: i });
            if (episodeList) {
                episodeList.innerHTML = episodes.map(ep => `
                    <div class="episode-btn ${episodeNum === ep.number ? 'active' : ''}" data-ep="${ep.number}" onclick="playVideo(${malId}, ${ep.number})">Ep. ${ep.number}</div>
                `).join('');
            }
        } else {
            throw new Error('No se encontró video');
        }
    } catch(error) {
        if (episodeList) {
            episodeList.innerHTML = `<div class="loading-spinner">Error: ${error.message}<br><button onclick="playVideo(${malId}, ${episodeNum})" style="margin-top:1rem;padding:0.5rem 1rem;background:#e50914;border:none;border-radius:8px;color:white;">Reintentar</button></div>`;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.DexTVPlayer.init();
    loadAnimes('');
    initHero();
    document.getElementById('searchInput').addEventListener('input', (e) => loadAnimes(e.target.value));
    document.getElementById('backToAnimeBtn').addEventListener('click', () => {
        document.getElementById('playerSection').style.display = 'none';
        document.getElementById('animeSection').style.display = 'block';
        loadAnimes('');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            document.getElementById('animeSection').style.display = section === 'anime' ? 'block' : 'none';
            document.getElementById('playerSection').style.display = 'none';
            if (section === 'anime') loadAnimes('');
        });
    });
});
APPEOF

echo "✅ 3/6 app.js actualizado"

# 4. Actualizar security.js
cat > ~/DexTV/dexTV-web/js/security.js << 'SECEOF'
window.sanitize = function(str) { if (!str) return ''; const e = document.createElement('div'); e.textContent = str; return e.innerHTML; };
window.showToast = function(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#e50914';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
};
console.log('✅ DexTV Security Loaded');
SECEOF

echo "✅ 4/6 security.js actualizado"

# 5. Actualizar CSS
cat > ~/DexTV/dexTV-web/css/style.css << 'CSSEOF'
* { margin: 0; padding: 0; box-sizing: border-box; }
:root { --primary: #e50914; --bg-dark: #141414; --bg-card: #1a1a1a; --text: #fff; --text-muted: #b3b3b3; }
body { font-family: 'Inter', sans-serif; background: var(--bg-dark); color: var(--text); overflow-x: hidden; }
.sidebar { position: fixed; left: 0; top: 0; width: 280px; height: 100vh; background: #000; padding: 2rem 1.5rem; border-right: 1px solid rgba(255,255,255,0.1); }
.logo { font-size: 1.8rem; font-weight: 800; margin-bottom: 2rem; background: linear-gradient(135deg, #fff, var(--primary)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.nav-item { display: flex; align-items: center; gap: 1rem; padding: 0.8rem 1rem; border-radius: 10px; cursor: pointer; color: var(--text-muted); margin-bottom: 0.5rem; }
.nav-item.active { background: var(--primary); color: white; }
.main-content { margin-left: 280px; min-height: 100vh; }
.hero-banner { position: relative; height: 70vh; width: 100%; overflow: hidden; }
.hero-slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; transition: opacity 0.8s; background-size: cover; background-position: center; }
.hero-slide.active { opacity: 1; }
.hero-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, var(--bg-dark) 0%, transparent 100%); padding: 4rem 3rem 2rem; }
.hero-title { font-size: 3rem; font-weight: 800; margin-bottom: 0.5rem; }
.content-section { padding: 2rem 3rem; }
.search-bar { margin-bottom: 2rem; display: flex; background: var(--bg-card); border-radius: 40px; max-width: 500px; padding: 0.5rem 1rem; }
.search-bar input { flex: 1; background: transparent; border: none; color: white; font-size: 0.9rem; }
.anime-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
.anime-card { background: var(--bg-card); border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.3s; border: 2px solid transparent; }
.anime-card.hot { border-color: var(--primary); }
.anime-card:hover { transform: translateY(-5px); border-color: var(--primary); }
.hot-badge { position: absolute; top: 10px; right: 10px; background: var(--primary); padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; }
.anime-image { width: 100%; height: 280px; object-fit: cover; }
.anime-info { padding: 0.8rem; }
.player-section { padding: 0 3rem 2rem; display: none; }
.back-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--bg-card); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; margin-bottom: 1rem; }
.player-container { background: #000; border-radius: 16px; overflow: hidden; margin-bottom: 1.5rem; }
#mainPlayer { width: 100%; max-height: 65vh; background: #000; }
.episode-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.8rem; max-height: 300px; overflow-y: auto; }
.episode-btn { padding: 0.8rem; background: var(--bg-card); border: 2px solid transparent; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s; }
.episode-btn.active { border-color: var(--primary); background: var(--primary); }
.loading-spinner { text-align: center; padding: 3rem; color: var(--text-muted); }
.toast-notification { position: fixed; bottom: 20px; right: 20px; background: var(--primary); color: white; padding: 0.8rem 1.2rem; border-radius: 8px; transform: translateX(400px); transition: transform 0.3s; z-index: 1000; }
.toast-notification.show { transform: translateX(0); }
@media (max-width: 768px) { .sidebar { width: 80px; } .sidebar span { display: none; } .main-content { margin-left: 80px; } .hero-title { font-size: 1.5rem; } .content-section { padding: 1rem; } .anime-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); } .player-section { padding: 0 1rem 1rem; } }
CSSEOF

echo "✅ 5/6 style.css actualizado"

# 6. Reiniciar servicios
pkill -f "node src/server.js" 2>/dev/null
pkill -f "python3 -m http.server" 2>/dev/null
sleep 2

cd ~/DexTV/anime1v-api
nohup node src/server.js > /tmp/dextv-api.log 2>&1 &
echo "✅ API iniciada (puerto 3001)"

cd ~/DexTV/dexTV-web
nohup python3 -m http.server 8080 > /tmp/dextv-web.log 2>&1 &
echo "✅ Web iniciada (puerto 8080)"

sleep 3

echo ""
echo "=========================================="
echo "🎬 DEXTV - REPARACIÓN COMPLETADA"
echo "=========================================="
echo "🌐 Abriendo navegador en http://localhost:8080"
echo ""
echo "📌 INSTRUCCIONES:"
echo "   1. Haz clic en NARUTO"
echo "   2. Selecciona Episodio 1"
echo "   3. El video debería reproducirse automáticamente"
echo "=========================================="

# Abrir navegador
xdg-open http://localhost:8080

