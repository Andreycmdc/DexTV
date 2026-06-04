const API_URL = 'http://localhost:3001/api/v1/anime';

async function searchAnime() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<div class="loading">🔍 Buscando...</div>';
    
    try {
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&domain=animeav1`);
        const data = await response.json();
        const animes = data.results || [];
        
        if (animes.length === 0) {
            resultsDiv.innerHTML = '<div class="loading">❌ No se encontraron resultados</div>';
            return;
        }
        
        resultsDiv.innerHTML = animes.map(anime => `
            <div class="anime-card" onclick="getAnimeInfo('${anime.url}')">
                <div class="anime-title">${anime.title || 'Sin título'}</div>
                <div class="anime-year">${anime.year || 'Año desconocido'}</div>
            </div>
        `).join('');
    } catch (error) {
        resultsDiv.innerHTML = `<div class="loading">❌ Error: ${error.message}</div>`;
    }
}

window.getAnimeInfo = async function(animeUrl) {
    document.getElementById('results').style.display = 'none';
    document.getElementById('playerSection').style.display = 'block';
    
    const episodesDiv = document.getElementById('episodes');
    episodesDiv.innerHTML = '<div class="loading">📺 Cargando episodios...</div>';
    
    try {
        const response = await fetch(`${API_URL}/info?url=${encodeURIComponent(animeUrl)}`);
        const data = await response.json();
        const episodes = data.episodes || [];
        
        if (episodes.length === 0) {
            episodesDiv.innerHTML = '<div class="loading">❌ No hay episodios disponibles</div>';
            return;
        }
        
        episodesDiv.innerHTML = episodes.map(ep => `
            <div class="episode-btn" onclick="playEpisode('${ep.url}')">
                Episodio ${ep.number}
            </div>
        `).join('');
    } catch (error) {
        episodesDiv.innerHTML = `<div class="loading">❌ Error: ${error.message}</div>`;
    }
};

window.playEpisode = async function(episodeUrl) {
    const player = document.getElementById('mainPlayer');
    const episodesDiv = document.getElementById('episodes');
    episodesDiv.innerHTML = '<div class="loading">🎬 Obteniendo enlace del video...</div>';
    
    try {
        const response = await fetch(`${API_URL}/episode?url=${encodeURIComponent(episodeUrl)}`);
        const data = await response.json();
        
        // Extraer videos de los servidores disponibles
        let videoUrl = null;
        
        // Prioridad: MP4Upload > YourUpload > HLS > otros
        if (data.data?.servers?.sub) {
            const servers = data.data.servers.sub;
            const mp4upload = servers.find(s => s.server === 'MP4Upload');
            const yourupload = servers.find(s => s.server === 'YourUpload');
            const hls = servers.find(s => s.server === 'HLS');
            
            if (mp4upload) videoUrl = mp4upload.url;
            else if (yourupload) videoUrl = yourupload.url;
            else if (hls) videoUrl = hls.url;
            else if (servers[0]) videoUrl = servers[0].url;
        }
        
        if (videoUrl) {
            // Convertir URLs de embed a directas si es necesario
            if (videoUrl.includes('mp4upload.com/embed-')) {
                videoUrl = videoUrl.replace('embed-', '');
                videoUrl = videoUrl.replace('.html', '');
            }
            if (videoUrl.includes('yourupload.com/embed/')) {
                videoUrl = videoUrl.replace('embed/', '');
            }
            
            console.log('🎬 Video URL:', videoUrl);
            player.src = videoUrl;
            player.load();
            player.play().catch(e => console.log('Auto-play bloqueado'));
            episodesDiv.innerHTML = '<div class="loading">▶️ Reproduciendo...</div>';
        } else {
            throw new Error('No se encontró un servidor de video compatible');
        }
    } catch (error) {
        console.error('Error:', error);
        episodesDiv.innerHTML = `<div class="loading">❌ Error: ${error.message}<br><button onclick="playEpisode('${episodeUrl}')" style="margin-top:10px;padding:8px 16px;background:#e50914;border:none;color:white;border-radius:5px;">Reintentar</button></div>`;
    }
};

document.getElementById('searchBtn').addEventListener('click', searchAnime);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchAnime();
});
document.getElementById('backBtn').addEventListener('click', () => {
    document.getElementById('playerSection').style.display = 'none';
    document.getElementById('results').style.display = 'grid';
    document.getElementById('searchInput').value = 'naruto';
    searchAnime();
});

// Cargar Naruto al inicio
document.getElementById('searchInput').value = 'naruto';
searchAnime();
