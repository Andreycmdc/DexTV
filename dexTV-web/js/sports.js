// Mundial 2026 - Partidos
const MATCHES = [
  { home: 'Argentina', away: 'Francia', hf: '🇦🇷', af: '🇫🇷', score: '3–3', time: 'FINAL', league: 'FINAL', date: '18 Dic 2026' },
  { home: 'Colombia', away: 'México', hf: '🇨🇴', af: '🇲🇽', score: '2–1', time: 'FINAL', league: 'SEMIFINAL', date: '14 Dic 2026' },
  { home: 'España', away: 'Alemania', hf: '🇪🇸', af: '🇩🇪', score: '1–1', time: 'FINAL', league: 'CUARTOS', date: '10 Dic 2026' },
  { home: 'Brasil', away: 'Inglaterra', hf: '🇧🇷', af: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', score: '2–0', time: 'FINAL', league: 'CUARTOS', date: '9 Dic 2026' },
  { home: 'Países Bajos', away: 'Portugal', hf: '🇳🇱', af: '🇵🇹', score: '3–2', time: 'FINAL', league: 'OCTAVOS', date: '8 Dic 2026' },
  { home: 'Japón', away: 'Croacia', hf: '🇯🇵', af: '🇭🇷', score: '1–1', time: 'FINAL', league: 'OCTAVOS', date: '7 Dic 2026' }
];

function buildMatches() {
  const container = document.getElementById('matchRow');
  if (!container) return;
  container.innerHTML = MATCHES.map(m => `
    <div class="match-card" onclick="showMatchInfo('${m.home} vs ${m.away}')">
      <div class="match-league">${m.league} · ${m.date}</div>
      <div class="match-teams">
        <div class="team"><div class="team-flag">${m.hf}</div><div class="team-name">${m.home}</div></div>
        <div class="vs-block"><div class="match-score">${m.score}</div></div>
        <div class="team"><div class="team-flag">${m.af}</div><div class="team-name">${m.away}</div></div>
      </div>
      <div class="match-time ${m.time === 'EN VIVO' ? 'live' : ''}">${m.time}</div>
      <button class="watch-btn">${m.time === 'EN VIVO' ? '▶ VER EN VIVO' : '📊 DETALLES'}</button>
    </div>
  `).join('');
}

function showMatchInfo(matchName) {
  showToast(`📺 ${matchName}\nPróximamente en vivo`, 'info');
}
