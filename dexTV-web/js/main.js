// Navegación principal
let currentTab = 'home';

function initHero() {
  const heroSlide = document.getElementById('heroSlide');
  const heroOverlay = document.getElementById('heroOverlay');
  if (heroSlide && heroOverlay) {
    heroSlide.innerHTML = '<div class="hero-slide active" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url(\'https://image.tmdb.org/t/p/original/8YFL5QQVS91RjT7yJy4k2u4n7kG.jpg\'); background-size: cover;"></div>';
    heroOverlay.innerHTML = '<h1 class="hero-title">DexTV</h1><p class="hero-desc">Anime, películas, TV en vivo y el Mundial 2026. Todo gratis.</p><button class="btn-play" onclick="showTab(\'anime\')"><i class="fas fa-play"></i> Explorar</button>';
  }
}

function showTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });
  
  const sections = ['homeView', 'animeSection', 'moviesSection', 'tvSection', 'sportsSection', 'playerSection'];
  sections.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = 'none';
  });
  
  if (tab === 'home') {
    document.getElementById('homeView').style.display = '';
    initHero();
  } else if (tab === 'anime') {
    document.getElementById('animeSection').style.display = '';
    loadPopularAnimes();
  } else if (tab === 'movies') {
    document.getElementById('moviesSection').style.display = '';
    loadMovies();
  } else if (tab === 'tv') {
    document.getElementById('tvSection').style.display = '';
    if (!window._tvBuilt) { buildTVCatBar(); window._tvBuilt = true; }
    loadIPTVChannels(TV_CATS[0].url, TV_CATS[0].label);
  } else if (tab === 'sports') {
    document.getElementById('sportsSection').style.display = '';
    buildMatches();
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => showTab(item.dataset.tab));
});

// Inicializar
showTab('home');
