// IPTV - Canales de TV en Directo
const TV_CATS = [
  { label: '🇨🇴 Colombia', url: 'https://iptv-org.github.io/iptv/countries/co.m3u', group: '🌎 Latinoamérica' },
  { label: '🇲🇽 México', url: 'https://iptv-org.github.io/iptv/countries/mx.m3u', group: '🌎 Latinoamérica' },
  { label: '🇦🇷 Argentina', url: 'https://iptv-org.github.io/iptv/countries/ar.m3u', group: '🌎 Latinoamérica' },
  { label: '🇨🇱 Chile', url: 'https://iptv-org.github.io/iptv/countries/cl.m3u', group: '🌎 Latinoamérica' },
  { label: '🇵🇪 Perú', url: 'https://iptv-org.github.io/iptv/countries/pe.m3u', group: '🌎 Latinoamérica' },
  { label: '🇪🇸 España', url: 'https://iptv-org.github.io/iptv/countries/es.m3u', group: '🌍 Europa' },
  { label: '🇺🇸 USA', url: 'https://iptv-org.github.io/iptv/countries/us.m3u', group: '🌎 Norteamérica' },
  { label: '⚽ Deportes', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', group: '🏆 Especiales' },
  { label: '📰 Noticias', url: 'https://iptv-org.github.io/iptv/categories/news.m3u', group: '🏆 Especiales' },
  { label: '🎬 Entretenimiento', url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u', group: '🏆 Especiales' },
  { label: '🎵 Música', url: 'https://iptv-org.github.io/iptv/categories/music.m3u', group: '🏆 Especiales' }
];

const IPTV_PROXIES = [u=>u, u=>`https://corsproxy.io/?${encodeURIComponent(u)}`, u=>`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`];

async function fetchIPTV(url) {
  for (const proxy of IPTV_PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.includes('#EXTM3U')) return text;
    } catch(e) {}
  }
  return null;
}

function parseM3U(text) {
  const lines = text.split('\n');
  const channels = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXTINF')) continue;
    const nameMatch = lines[i].match(/,([^,\r\n]+)$/);
    const logoMatch = lines[i].match(/tvg-logo="([^"]*)"/);
    let streamUrl = '';
    for (let j = i+1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (!next || next.startsWith('#')) continue;
      streamUrl = next;
      break;
    }
    if (nameMatch && streamUrl && streamUrl.startsWith('http')) {
      channels.push({ name: nameMatch[1].trim().slice(0, 35), logo: logoMatch?.[1] || '', url: streamUrl });
    }
  }
  return channels;
}

async function loadIPTVChannels(originalUrl, label) {
  const row = document.getElementById('tvRow');
  const countSpan = document.getElementById('tvCount');
  if (!row) return;
  row.innerHTML = `<div class="loading"><div class="spinner"></div>Cargando ${label}...</div>`;
  if (countSpan) countSpan.textContent = '';
  
  const m3u = await fetchIPTV(originalUrl);
  if (!m3u) {
    row.innerHTML = `<div class="loading">⚠️ No se pudieron cargar canales de ${label}</div>`;
    return;
  }
  
  const channels = parseM3U(m3u);
  if (!channels.length) {
    row.innerHTML = `<div class="loading">⚠️ No hay canales en ${label}</div>`;
    return;
  }
  
  if (countSpan) countSpan.textContent = `${channels.length} canales`;
  row.innerHTML = '';
  
  channels.slice(0, 40).forEach((ch, idx) => {
    const card = document.createElement('div');
    card.className = 'tv-card';
    const initials = ch.name.substring(0, 2).toUpperCase();
    const colors = ['#e50914', '#7c3aed', '#3b82f6', '#10b981', '#f59e0b'];
    const bgColor = colors[idx % colors.length];
    card.innerHTML = `
      <div class="tv-badge">● LIVE</div>
      <img class="tv-thumb" src="${ch.logo || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 110'%3E%3Crect width='200' height='110' fill='${bgColor}'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='28' font-weight='bold'%3E${initials}%3C/text%3E%3C/svg%3E`}" alt="${escapeHtml(ch.name)}" onerror="this.src='https://placehold.co/180x110/1a1a1a/e50914?text=${initials}'">
      <div class="tv-info"><div class="tv-name">${escapeHtml(ch.name)}</div><div class="tv-sub">En vivo ahora</div></div>
    `;
    card.addEventListener('click', () => openPlayer(ch.name, ch.url));
    row.appendChild(card);
  });
}

function buildTVCatBar() {
  const bar = document.getElementById('tvCatBar');
  if (!bar) return;
  TV_CATS.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = `cat-btn ${i === 0 ? 'active' : ''}`;
    btn.textContent = cat.label;
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadIPTVChannels(cat.url, cat.label);
    });
    bar.appendChild(btn);
  });
}
