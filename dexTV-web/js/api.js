import { CONFIG } from './config.js';

// ============================================
// CACHÉ
// ============================================
const CACHE_KEY = 'dextv_catalog';
const CACHE_EXPIRY = CONFIG.CACHE_EXPIRY || 24 * 60 * 60 * 1000;

function setCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch (_) {}
}
function getCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (Date.now() - p.ts > CACHE_EXPIRY) { localStorage.removeItem(CACHE_KEY); return null; }
        return p.data;
    } catch (_) { return null; }
}

// ============================================
// JIKAN — imágenes gratis por título
// ============================================
const imgCache = new Map();

async function getImageFromJikan(title) {
    if (imgCache.has(title)) return imgCache.get(title);
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
        if (res.ok) {
            const d = await res.json();
            const img = d.data?.[0]?.images?.jpg?.large_image_url
                     || d.data?.[0]?.images?.jpg?.image_url;
            if (img) { imgCache.set(title, img); return img; }
        }
    } catch (_) {}
    const ph = `https://placehold.co/300x450/111118/e50914?text=${encodeURIComponent(title.substring(0,2).toUpperCase())}`;
    imgCache.set(title, ph);
    return ph;
}

// ============================================
// BÚSQUEDA EN UNA API CON UN TÉRMINO
// ============================================
async function searchTerm(api, term) {
    try {
        const res = await fetch(`${api.baseUrl}/search?q=${encodeURIComponent(term)}&limit=30`, {
            headers: { [api.authHeader]: api.apiKey }
        });
        if (!res.ok) return [];
        const data = await res.json();
        // Estructura: { success, data: { results: [...] } }
        return data?.data?.results || data?.results || data?.data || [];
    } catch (_) { return []; }
}

// ============================================
// TÉRMINOS — suficientes para llenar catálogo
// ============================================
const TERMS = [
    'naruto', 'one piece', 'bleach', 'dragon ball', 'demon slayer',
    'attack on titan', 'jujutsu kaisen', 'my hero academia', 'fullmetal alchemist',
    'death note', 'sword art online', 'tokyo ghoul', 'hunter x hunter',
    'fairy tail', 'black clover', 'one punch man', 'chainsaw man',
    'spy x family', 're zero', 'overlord', 'solo leveling', 'blue lock',
    'haikyuu', 'vinland saga', 'frieren', 'steins gate', 'code geass',
    'cowboy bebop', 'evangelion', 'your name', 'clannad', 'toradora',
    'konosuba', 'gintama', 'berserk', 'parasyte', 'psycho pass',
];

// ============================================
// BÚSQUEDA PRINCIPAL
// ============================================
export async function searchAnime(query) {
    const cached = getCache();
    if (cached?.length > 0) {
        console.log(`📦 Caché: ${cached.length} animes`);
        return cached;
    }

    console.log('🔍 Construyendo catálogo...');

    const seen = new Set();
    const allResults = [];

    // Buscar todos los términos en ambas APIs en paralelo
    const tasks = [];
    for (const term of TERMS) {
        for (const api of CONFIG.APIS) {
            tasks.push({ api, term });
        }
    }

    // Procesar en lotes de 6 para no saturar
    const BATCH = 6;
    for (let i = 0; i < tasks.length; i += BATCH) {
        const batch = tasks.slice(i, i + BATCH);
        const batchResults = await Promise.all(batch.map(({ api, term }) => searchTerm(api, term)));

        for (const results of batchResults) {
            for (const anime of results) {
                const title = anime.title;
                if (!title || seen.has(title.toLowerCase())) continue;
                seen.add(title.toLowerCase());
                allResults.push({
                    id:       anime.id,
                    title,
                    slug:     anime.slug,
                    type:     anime.type || 'Anime',
                    episodes: anime.episodes || '?',
                    url:      anime.url,
                    year:     anime.year || null,
                    score:    anime.score || null,
                    genres:   anime.genres || [],
                    picture:  null, // se rellena abajo con Jikan
                });
            }
        }

        if (allResults.length >= 300) break;
    }

    console.log(`📋 ${allResults.length} animes únicos — obteniendo imágenes de Jikan...`);

    // Obtener imágenes en lotes de 3 (respetar rate limit de Jikan)
    for (let i = 0; i < allResults.length; i += 3) {
        const slice = allResults.slice(i, i + 3);
        await Promise.all(slice.map(async anime => {
            anime.picture = await getImageFromJikan(anime.title);
        }));
        if (i + 3 < allResults.length) await delay(350);
    }

    console.log(`✅ Catálogo listo: ${allResults.length} animes con imágenes`);

    const final = allResults.length > 0 ? allResults : getFallbackCatalog();
    setCache(final);
    return final;
}

// ============================================
// CATEGORÍAS — filtro local, 0 requests
// ============================================
export async function searchByCategory(category) {
    const all = await searchAnime('anime');

    if (category === 'popular') {
        const s = all.filter(a => a.score).sort((a, b) => b.score - a.score);
        return s.length >= 10 ? s : all.slice(0, 50);
    }
    if (category === 'new') {
        const y = new Date().getFullYear();
        const f = all.filter(a => a.year >= y - 2);
        return f.length >= 10 ? f : all.slice(0, 50);
    }

    const genreMap = {
        action:    ['Action','Acción'],    adventure: ['Adventure','Aventura'],
        romance:   ['Romance'],            comedy:    ['Comedy','Comedia'],
        fantasy:   ['Fantasy','Fantasía'], horror:    ['Horror','Terror'],
        drama:     ['Drama'],              scifi:     ['Sci-Fi','Ciencia Ficción'],
        sports:    ['Sports','Deportes'],  mecha:     ['Mecha'],
    };
    const keywordMap = {
        action:    ['naruto','bleach','demon slayer','jujutsu','attack on titan','chainsaw'],
        adventure: ['one piece','hunter','fairy tail','vinland','frieren'],
        romance:   ['toradora','clannad','your name','kaguya','horimiya'],
        comedy:    ['spy x family','konosuba','gintama','grand blue'],
        fantasy:   ['re zero','sword art','black clover','overlord','mushoku'],
        horror:    ['tokyo ghoul','parasyte','hellsing','another'],
        drama:     ['death note','fullmetal','erased','clannad'],
        scifi:     ['steins gate','psycho pass','cowboy bebop','trigun'],
        sports:    ['haikyuu','blue lock','kuroko','yuri on ice'],
        mecha:     ['evangelion','gundam','code geass','darling'],
    };

    const genres = genreMap[category];
    if (genres) {
        const f = all.filter(a => a.genres?.some(g => genres.includes(g)));
        if (f.length >= 10) return f;
    }
    const keywords = keywordMap[category] || [];
    const f = all.filter(a => keywords.some(k => a.title.toLowerCase().includes(k)));
    return f.length >= 5 ? f : all.slice(0, 50);
}

// ============================================
// DETALLES — Jikan
// ============================================
export async function getAnimeDetails(title) {
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
        if (res.ok) {
            const d = await res.json();
            const a = d.data?.[0];
            if (a) return {
                synopsis: a.synopsis || 'Sin descripción',
                rating: a.score || 'N/A', rank: a.rank || 'N/A',
                year: a.year, status: a.status,
                genres: a.genres?.map(g => g.name) || [],
                studios: a.studios?.map(s => s.name) || []
            };
        }
    } catch (_) {}
    return null;
}

// ============================================
// REPRODUCCIÓN
// ============================================
export async function getAnimeInfo(animeUrl) {
    for (const api of CONFIG.APIS) {
        try {
            const res = await fetch(`${api.baseUrl}/info?url=${encodeURIComponent(animeUrl)}`, {
                headers: { [api.authHeader]: api.apiKey }
            });
            if (!res.ok) continue;
            const data = await res.json();
            const episodes = data?.data?.episodes || data?.episodes || [];
            if (episodes.length > 0) { console.log(`✅ Info de ${api.name}`); return data; }
        } catch (_) {}
    }
    return null;
}

export async function getEpisodeUrl(episodeUrl) {
    for (const api of CONFIG.APIS) {
        try {
            const res = await fetch(`${api.baseUrl}/episode?url=${encodeURIComponent(episodeUrl)}`, {
                headers: { [api.authHeader]: api.apiKey }
            });
            if (!res.ok) continue;
            const data = await res.json();
            const url = data?.url || data?.data?.url || data?.data?.videoUrl || data?.videoUrl;
            if (url) { console.log(`✅ Episodio de ${api.name}`); return url; }
        } catch (_) {}
    }
    return null;
}

// ============================================
// UTILS
// ============================================
export function buildAnime1vUrl(title) {
    if (!title) return '#';
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `https://animeav1.com/media/${slug}`;
}

export function buildAnimeUrl(title) { return buildAnime1vUrl(title); }

export function clearCache() {
    localStorage.removeItem(CACHE_KEY);
    imgCache.clear();
    console.log('🗑️ Caché limpiado');
    location.reload();
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function getFallbackCatalog() {
    return [
        { title: 'Naruto',             type: 'TV', episodes: 220,  picture: 'https://cdn.myanimelist.net/images/anime/13/17405l.jpg',   year: 2002, score: 7.9, genres: ['Action'] },
        { title: 'One Piece',           type: 'TV', episodes: 1000, picture: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',    year: 1999, score: 8.7, genres: ['Action'] },
        { title: 'Attack on Titan',     type: 'TV', episodes: 87,   picture: 'https://cdn.myanimelist.net/images/anime/1000/110531l.jpg', year: 2013, score: 9.0, genres: ['Action'] },
        { title: 'Demon Slayer',        type: 'TV', episodes: 44,   picture: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',  year: 2019, score: 8.7, genres: ['Action'] },
        { title: 'Jujutsu Kaisen',      type: 'TV', episodes: 24,   picture: 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg', year: 2020, score: 8.6, genres: ['Action'] },
        { title: 'Death Note',          type: 'TV', episodes: 37,   picture: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg',      year: 2006, score: 8.6, genres: ['Mystery'] },
        { title: 'My Hero Academia',    type: 'TV', episodes: 113,  picture: 'https://cdn.myanimelist.net/images/anime/10/78745l.jpg',    year: 2016, score: 7.9, genres: ['Action'] },
        { title: 'One Punch Man',       type: 'TV', episodes: 12,   picture: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg',    year: 2015, score: 8.7, genres: ['Action'] },
    ];
}