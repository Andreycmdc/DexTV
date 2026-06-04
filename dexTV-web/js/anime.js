// Anime - Búsqueda, catálogo y reproducción
let allAnimes = [];
let currentAnimeData = null;

async function searchAnime() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return loadPopularAnimes();
  
  const grid = document.getElementById('animeGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading"><div class="spinner"></div>Buscando...</div>';
  
  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(query)}&domain=animeav1`);
    const data = await res.json();
    const results = data.results || [];
    
    if (results.length === 0) {
      grid.innerHTML = '<div class="loading">No se encontraron resultados</div>';
      return;
    }
    
    renderAnimeGrid(results);
  } catch (error) {
    grid.innerHTML = '<div class="loading">Error al buscar</div>';
    showToast('Error al conectar con la API', 'error');
  }
}

async function loadPopularAnimes() {
  const grid = document.getElementById('animeGrid');
  const countSpan = document.getElementById('animeCount');
  if (!grid) return;
  grid.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando animes...</div>';
  
  const searches = ['naruto', 'one piece', 'attack on titan', 'demon slayer', 'jujutsu kaisen'];
  const results = [];
  
  for (const q of searches) {
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&domain=animeav1`);
      const data = await res.json();
      if (data.results && data.results[0]) results.push(data.results[0]);
    } catch(e) {}
  }
  
  if (results.length === 0) {
    const fallback = ['Naruto', 'One Piece', 'Attack on Titan', 'Demon Slayer', 'Jujutsu Kaisen', 'Death Note', 'Fullmetal Alchemist'];
    results.push(...fallback.map(t => ({ title: t, type: 'Anime', url: '' })));
  }
  
  renderAnimeGrid(results);
  if (countSpan) countSpan.textContent = `${results.length} títulos`;
}

function renderAnimeGrid(animes) {
  const grid = document.getElementById('animeGrid');
  if (!grid) return;
  allAnimes = animes;
  grid.innerHTML = animes.map((anime, i) => `
    <div class="anime-card ${anime.hot ? 'hot' : ''}" onclick="openAnimeModal('${anime.url}', '${escapeHtml(anime.title)}')">
      ${anime.hot ? '<div class="hot-badge">🔥 HOT</div>' : ''}
      <img class="anime-image" src="${anime.image || 'https://placehold.co/300x450/1a1a1a/e50914?text=Anime'}" onerror="this.src='https://placehold.co/300x450/1a1a1a/e50914?text=${anime.title?.charAt(0)||'A'}'">
      <div class="anime-info"><div class="anime-title">${escapeHtml(anime.title)}</div><div class="anime-year">${anime.year || 'N/A'}</div></div>
    </div>
  `).join('');
}

async function openAnimeModal(animeUrl, title) {
  const modal = document.getElementById('animeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalPoster = document.getElementById('modalPoster');
  const epsContainer = document.getElementById('modalEpisodes');
  
  if (!modal) return;
  modalTitle.textContent = title;
  modalDesc.textContent = 'Cargando información...';
  modalPoster.src = await fetchPoster(title);
  epsContainer.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando episodios...</div>';
  modal.classList.add('open');
  
  try {
    const infoRes = await fetch(`${API}/info?url=${encodeURIComponent(animeUrl)}`);
    const info = await infoRes.json();
    const episodes = info.episodes || [];
    currentAnimeData = { title, episodes, url: animeUrl };
    
    if (episodes.length === 0) {
      epsContainer.innerHTML = '<div class="loading">No hay episodios disponibles</div>';
    } else {
      epsContainer.innerHTML = episodes.slice(0, 50).map(ep => `
        <button class="episode-btn" onclick="playEpisode('${ep.url}', ${ep.number})">Ep. ${ep.number}</button>
      `).join('');
    }
    
    const animeInfo = await fetchAnimeInfo(title);
    modalDesc.textContent = animeInfo.synopsis || 'Sin descripción disponible.';
  } catch (error) {
    epsContainer.innerHTML = '<div class="loading">Error al cargar episodios</div>';
  }
}

async function playEpisode(epUrl, episodeNum) {
  try {
    const res = await fetch(`${API}/episode?url=${encodeURIComponent(epUrl)}`);
    const data = await res.json();
    const servers = data?.data?.streamLinks?.SUB || data?.streamLinks?.SUB || [];
    const server = servers.find(s => s.server === 'PDrain') || servers.find(s => s.server === 'HLS') || servers[0];
    if (server) {
      openPlayer(`${currentAnimeData?.title || 'Anime'} - Episodio ${episodeNum}`, server.url);
      closeModal();
    } else {
      showToast('No se encontró servidor de video', 'error');
    }
  } catch (error) {
    showToast('Error al cargar el episodio', 'error');
  }
}

function closeModal() {
  const modal = document.getElementById('animeModal');
  if (modal) modal.classList.remove('open');
}
