/* ═══════════════════════════════════════════════════════════════
   DexTV — api.js  v3.0
   Fuentes: dexanime → anime1v → Jikan (MyAnimeList, sin API key)
   ═══════════════════════════════════════════════════════════════ */

export const CONFIG = {
  APIS: [
    {
      id: 1,
      name: 'dexanime',
      baseUrl: 'https://dexanime-api.onrender.com/api/v1/anime',
      apiKey: 'dev-anime1v-key',
      authHeader: 'X-API-Key',
    },
    {
      id: 2,
      name: 'anime1v',
      baseUrl: 'https://anime1v-api-limpio.onrender.com/api/v1/anime',
      apiKey: 'dev-anime1v-key',
      authHeader: 'X-API-Key',
    },
  ],
  JIKAN: {
    baseUrl: 'https://api.jikan.moe/v4',
    // Sin API key — límite público: ~3 req/s, 60 req/min
    // Usamos delay entre páginas para no superar el rate limit
    pageDelayMs: 400,
    maxPages: 5,        // 5 páginas × 25 = 125 animes por llamada
    itemsPerPage: 25,
  },
  CACHE_EXPIRY: 24 * 60 * 60 * 1000,
};

/* ───────────────────────────────────────────────
   CACHÉ INTERNA (module-level, sin localStorage)
─────────────────────────────────────────────── */
const _cache = new Map(); // key → { ts, data }

export function clearCache() {
  _cache.clear();
}

function fromCache(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CONFIG.CACHE_EXPIRY) { _cache.delete(key); return null; }
  return entry.data;
}

function toCache(key, data) {
  _cache.set(key, { ts: Date.now(), data });
}

/* ───────────────────────────────────────────────
   NORMALIZACIÓN — convierte cualquier fuente
   al formato interno de DexTV
─────────────────────────────────────────────── */

/**
 * Normaliza un item que viene de tus APIs propias.
 * Ajusta los campos según lo que realmente devuelvan.
 */
function normalizeOwn(raw) {
  return {
    id:       String(raw.id || raw._id || raw.mal_id || ''),
    title:    raw.title || raw.name || raw.titulo || '',
    picture:  raw.picture || raw.image || raw.cover || raw.thumbnail || '',
    score:    raw.score  != null ? String(raw.score)  : '',
    year:     raw.year   || raw.aired_year || '',
    episodes: raw.episodes != null ? String(raw.episodes) : '?',
    type:     raw.type   || raw.format || 'TV',
    genres:   Array.isArray(raw.genres)
                ? raw.genres.map(g => (typeof g === 'object' ? g.name : g))
                : [],
    source:   'own',
  };
}

/**
 * Normaliza un item de Jikan v4.
 * Doc: https://docs.api.jikan.moe/
 */
function normalizeJikan(raw) {
  // Imagen: preferimos jpg.large_image_url → jpg.image_url
  const img =
    raw.images?.webp?.large_image_url ||
    raw.images?.jpg?.large_image_url  ||
    raw.images?.jpg?.image_url        ||
    '';

  // Géneros: genres + explicit_genres + themes
  const genreArrays = [
    ...(raw.genres          || []),
    ...(raw.explicit_genres || []),
    ...(raw.themes          || []),
    ...(raw.demographics    || []),
  ];
  const genres = genreArrays.map(g => g.name).filter(Boolean);

  // Año
  const year =
    raw.year ||
    raw.aired?.prop?.from?.year ||
    (raw.aired?.from ? new Date(raw.aired.from).getFullYear() : '') ||
    '';

  return {
    id:       `jikan_${raw.mal_id}`,
    title:    raw.title_english || raw.title || '',
    picture:  img,
    score:    raw.score != null ? String(raw.score) : '',
    year:     year ? String(year) : '',
    episodes: raw.episodes != null ? String(raw.episodes) : '?',
    type:     raw.type || 'TV',
    genres,
    source:   'jikan',
    mal_id:   raw.mal_id,
  };
}

/* ───────────────────────────────────────────────
   DEDUPLICACIÓN
   Prioridad: own > jikan (mismo título)
─────────────────────────────────────────────── */
function deduplicate(list) {
  const seen = new Map(); // título normalizado → índice en resultado

  for (const item of list) {
    const key = (item.title || '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (!key) continue;
    if (!seen.has(key)) {
      seen.set(key, item);
    } else {
      // Si el nuevo es de fuente propia y el existente es de jikan → reemplaza
      const existing = seen.get(key);
      if (item.source === 'own' && existing.source === 'jikan') {
        seen.set(key, item);
      }
      // Si ambos son 'own' o ambos 'jikan' → quedamos con el primero
    }
  }

  return [...seen.values()];
}

/* ───────────────────────────────────────────────
   FETCH CON TIMEOUT
─────────────────────────────────────────────── */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(tid);
    return res;
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}

/* ───────────────────────────────────────────────
   DELAY HELPER
─────────────────────────────────────────────── */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ───────────────────────────────────────────────
   FUENTE 1 & 2 — APIs propias
─────────────────────────────────────────────── */
async function fetchFromOwnApi(api, query, limit = 150) {
  try {
    const url = `${api.baseUrl}?search=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetchWithTimeout(url, {
      headers: { [api.authHeader]: api.apiKey },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // Adaptamos según la forma en que tu API devuelve datos
    const raw = Array.isArray(json)
      ? json
      : (json.data || json.results || json.animes || json.items || []);

    return raw.map(normalizeOwn).filter(a => a.title);
  } catch (err) {
    console.warn(`[DexTV] API "${api.name}" falló:`, err.message);
    return [];
  }
}

/* ───────────────────────────────────────────────
   FUENTE 3 — Jikan (MyAnimeList)
─────────────────────────────────────────────── */

/**
 * Busca en Jikan por query (se usa cuando el usuario escribe algo).
 */
async function searchJikan(query, maxResults = 50) {
  const cacheKey = `jikan_search_${query}_${maxResults}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  const results = [];
  const pages = Math.ceil(maxResults / CONFIG.JIKAN.itemsPerPage);

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `${CONFIG.JIKAN.baseUrl}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=${CONFIG.JIKAN.itemsPerPage}&sfw=true`;
      const res = await fetchWithTimeout(url);

      if (res.status === 429) {
        // Rate limit — esperamos 1s y reintentamos una vez
        await delay(1000);
        const retry = await fetchWithTimeout(url);
        if (!retry.ok) break;
        const json = await retry.json();
        const items = (json.data || []).map(normalizeJikan).filter(a => a.title);
        results.push(...items);
        if (!json.pagination?.has_next_page) break;
      } else if (!res.ok) {
        break;
      } else {
        const json = await res.json();
        const items = (json.data || []).map(normalizeJikan).filter(a => a.title);
        results.push(...items);
        if (!json.pagination?.has_next_page) break;
      }

      if (page < pages) await delay(CONFIG.JIKAN.pageDelayMs);
    } catch (err) {
      console.warn(`[DexTV] Jikan page ${page} falló:`, err.message);
      break;
    }
  }

  const limited = results.slice(0, maxResults);
  toCache(cacheKey, limited);
  return limited;
}

/**
 * Obtiene el catálogo general de Jikan (top anime por score).
 * Se usa para el catálogo principal cuando las APIs propias fallan o devuelven poco.
 */
async function fetchJikanTop(maxResults = 125) {
  const cacheKey = `jikan_top_${maxResults}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  const results = [];
  const totalPages = Math.min(CONFIG.JIKAN.maxPages, Math.ceil(maxResults / CONFIG.JIKAN.itemsPerPage));

  for (let page = 1; page <= totalPages; page++) {
    try {
      // /top/anime devuelve los mejor valorados (sin rate limit agresivo)
      const url = `${CONFIG.JIKAN.baseUrl}/top/anime?page=${page}&limit=${CONFIG.JIKAN.itemsPerPage}&type=tv`;
      const res = await fetchWithTimeout(url);

      if (res.status === 429) {
        await delay(1200);
        const retry = await fetchWithTimeout(url);
        if (!retry.ok) break;
        const json = await retry.json();
        results.push(...(json.data || []).map(normalizeJikan).filter(a => a.title));
        if (!json.pagination?.has_next_page) break;
      } else if (!res.ok) {
        break;
      } else {
        const json = await res.json();
        results.push(...(json.data || []).map(normalizeJikan).filter(a => a.title));
        if (!json.pagination?.has_next_page) break;
      }

      if (page < totalPages) await delay(CONFIG.JIKAN.pageDelayMs);
    } catch (err) {
      console.warn(`[DexTV] Jikan top page ${page} falló:`, err.message);
      break;
    }
  }

  const limited = results.slice(0, maxResults);
  toCache(cacheKey, limited);
  return limited;
}

/**
 * Busca por género usando los IDs de Jikan.
 * Géneros más usados de MAL para referencia interna.
 */
const JIKAN_GENRE_IDS = {
  action:    1,
  adventure: 2,
  comedy:    4,
  drama:     8,
  fantasy:   10,
  horror:    14,
  romance:   22,
  scifi:     24,
  sports:    30,
  mecha:     18,
};

export async function fetchJikanByGenre(genreName, maxResults = 50) {
  const genreId = JIKAN_GENRE_IDS[genreName];
  if (!genreId) return [];

  const cacheKey = `jikan_genre_${genreId}_${maxResults}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  const results = [];
  const pages = Math.ceil(maxResults / CONFIG.JIKAN.itemsPerPage);

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `${CONFIG.JIKAN.baseUrl}/anime?genres=${genreId}&page=${page}&limit=${CONFIG.JIKAN.itemsPerPage}&order_by=score&sort=desc&sfw=true`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) break;
      const json = await res.json();
      results.push(...(json.data || []).map(normalizeJikan).filter(a => a.title));
      if (!json.pagination?.has_next_page) break;
      if (page < pages) await delay(CONFIG.JIKAN.pageDelayMs);
    } catch (err) {
      console.warn(`[DexTV] Jikan genre ${genreName} page ${page} falló:`, err.message);
      break;
    }
  }

  const limited = results.slice(0, maxResults);
  toCache(cacheKey, limited);
  return limited;
}

/* ───────────────────────────────────────────────
   FUNCIÓN PRINCIPAL — searchAnime
   Usada por anime.html
─────────────────────────────────────────────── */

/**
 * @param {string} query    — término de búsqueda (ej: "naruto" o "anime" para catálogo)
 * @param {number} limit    — máximo de resultados deseados
 * @returns {Promise<Array>}
 */
export async function searchAnime(query = 'anime', limit = 150) {
  const cacheKey = `search_${query}_${limit}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  /* ── Paso 1: intentar APIs propias en paralelo ── */
  const [own1, own2] = await Promise.all(
    CONFIG.APIS.map(api => fetchFromOwnApi(api, query, limit))
  );

  const ownResults = deduplicate([...own1, ...own2]);

  /* ── Paso 2: si tenemos suficiente → devolver ── */
  if (ownResults.length >= limit * 0.6) {
    // Tenemos ≥60% de lo pedido → suficiente, no molestamos a Jikan
    const final = ownResults.slice(0, limit);
    toCache(cacheKey, final);
    return final;
  }

  /* ── Paso 3: completar con Jikan ── */
  console.info(`[DexTV] APIs propias dieron ${ownResults.length}/${limit} → completando con Jikan`);
  const needed    = limit - ownResults.length;
  const isCatalog = query === 'anime' || query === '';

  let jikanResults;
  if (isCatalog) {
    // Para el catálogo general usamos el top de MAL
    jikanResults = await fetchJikanTop(Math.min(needed + 20, 125));
  } else {
    // Para búsquedas específicas usamos el buscador de Jikan
    jikanResults = await searchJikan(query, Math.min(needed + 20, 100));
  }

  /* ── Paso 4: fusionar y deduplicar ── */
  const merged = deduplicate([...ownResults, ...jikanResults]).slice(0, limit);
  toCache(cacheKey, merged);
  return merged;
}

/* ───────────────────────────────────────────────
   URL PLAYER — sin cambios
─────────────────────────────────────────────── */
export function buildAnime1vUrl(title) {
  if (!title) return '';
  const slug = title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // quita tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `https://www1.anime1v.com/anime/${slug}/`;
}

/* ───────────────────────────────────────────────
   UTILIDADES EXTRAS (opcionales en tu HTML)
─────────────────────────────────────────────── */

/** Obtiene detalles de un anime por su MAL ID (para página de detalle). */
export async function getAnimeDetail(malId) {
  const cacheKey = `detail_${malId}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(`${CONFIG.JIKAN.baseUrl}/anime/${malId}/full`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const detail = normalizeJikan(json.data || json);
    toCache(cacheKey, detail);
    return detail;
  } catch (err) {
    console.warn('[DexTV] getAnimeDetail falló:', err.message);
    return null;
  }
}

/** Obtiene animes de la temporada actual desde Jikan. */
export async function getCurrentSeason() {
  const cacheKey = 'jikan_current_season';
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(`${CONFIG.JIKAN.baseUrl}/seasons/now?limit=25`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = (json.data || []).map(normalizeJikan).filter(a => a.title);
    toCache(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('[DexTV] getCurrentSeason falló:', err.message);
    return [];
  }
}