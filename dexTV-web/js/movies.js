// Películas destacadas
const MOVIES = [
  { title: 'Akira', year: '1988', rating: '8.0', type: 'Anime Movie', image: '' },
  { title: 'Spirited Away', year: '2001', rating: '9.0', type: 'Studio Ghibli', image: '' },
  { title: 'Ghost in the Shell', year: '1995', rating: '8.5', type: 'Sci-Fi', image: '' },
  { title: 'Princess Mononoke', year: '1997', rating: '8.4', type: 'Ghibli', image: '' },
  { title: 'Your Name', year: '2016', rating: '8.4', type: 'Romance', image: '' },
  { title: 'Demon Slayer: Mugen Train', year: '2020', rating: '8.3', type: 'Acción', image: '' },
  { title: 'One Piece Film Red', year: '2022', rating: '8.0', type: 'Acción', image: '' },
  { title: 'Jujutsu Kaisen 0', year: '2021', rating: '7.9', type: 'Sobrenatural', image: '' }
];

async function loadMovies() {
  const grid = document.getElementById('moviesGrid');
  if (!grid) return;
  grid.innerHTML = MOVIES.map((movie, i) => `
    <div class="anime-card" onclick="showToast('🎬 ${movie.title} (${movie.year})\nPróximamente en DexTV', 'info')">
      <img class="anime-image" src="${movie.image || 'https://placehold.co/300x450/1a1a1a/e50914?text=' + encodeURIComponent(movie.title.slice(0,2))}" onerror="this.src='https://placehold.co/300x450/1a1a1a/e50914?text=${movie.title.charAt(0)}'">
      <div class="anime-info"><div class="anime-title">${escapeHtml(movie.title)}</div><div class="anime-year">${movie.year} · ${movie.rating} ⭐</div></div>
    </div>
  `).join('');
}
