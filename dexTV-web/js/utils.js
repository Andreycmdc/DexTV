// Utilidades comunes para DexTV
const API = 'http://localhost:3001/api/v1/anime';
const JIKAN = 'https://api.jikan.moe/v4';

let currentPlayerTab = 'home';
let currentModalData = null;

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#e50914';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

async function fetchPoster(title) {
  try {
    const res = await fetch(`${JIKAN}/anime?q=${encodeURIComponent(title)}&limit=1`);
    if (res.ok) {
      const data = await res.json();
      const url = data?.data?.[0]?.images?.jpg?.large_image_url;
      if (url) return url;
    }
  } catch(e) {}
  return `https://placehold.co/300x450/1a1a1a/e50914?text=${encodeURIComponent(title.slice(0,12))}`;
}

function openPlayer(title, url) {
  currentPlayerTab = document.querySelector('.nav-item.active')?.dataset.tab || 'home';
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('homeView').style.display = 'none';
  document.getElementById('animeSection').style.display = 'none';
  document.getElementById('moviesSection').style.display = 'none';
  document.getElementById('tvSection').style.display = 'none';
  document.getElementById('sportsSection').style.display = 'none';
  document.getElementById('playerSection').style.display = 'block';
  document.getElementById('playerTitle').textContent = title;
  const player = document.getElementById('mainPlayer');
  if (player) {
    player.src = url;
    player.load();
    player.play().catch(e => showToast('Haz clic para reproducir', 'info'));
  }
}

function closePlayer() {
  document.getElementById('playerSection').style.display = 'none';
  document.getElementById('heroSection').style.display = '';
  document.getElementById('homeView').style.display = '';
  const player = document.getElementById('mainPlayer');
  if (player) player.src = '';
}
