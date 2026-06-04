const express = require('express');
const app = express();
const PORT = 3001;

const animeav1Service = require('./services/animeav1.service');

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

app.get('/api/v1/anime/search', async (req, res) => {
    const query = req.query.q;
    console.log(`🔍 Buscando: ${query}`);
    
    if (!query) {
        return res.json({ results: [] });
    }
    
    try {
        const response = await animeav1Service.searchAnime(query);
        
        let resultsArray = [];
        if (response && response.data && response.data.results && Array.isArray(response.data.results)) {
            resultsArray = response.data.results;
        } else if (response && response.results && Array.isArray(response.results)) {
            resultsArray = response.results;
        } else if (Array.isArray(response)) {
            resultsArray = response;
        }
        
        console.log(`✅ Resultados: ${resultsArray.length}`);
        res.json({ results: resultsArray });
    } catch (error) {
        console.error(`❌ Error:`, error.message);
        res.json({ results: [] });
    }
});

app.get('/api/v1/anime/info', async (req, res) => {
    const url = req.query.url;
    console.log(`📺 Info: ${url}`);
    
    if (!url) {
        return res.json({ episodes: [] });
    }
    
    try {
        const info = await animeav1Service.getAnimeInfo(url);
        
        let episodesArray = [];
        if (info && info.episodes && Array.isArray(info.episodes)) {
            episodesArray = info.episodes;
        } else if (info && info.data && info.data.episodes && Array.isArray(info.data.episodes)) {
            episodesArray = info.data.episodes;
        }
        
        res.json({ 
            episodes: episodesArray, 
            title: (info && info.title) ? info.title : (info && info.data) ? info.data.title : 'Sin título'
        });
    } catch (error) {
        console.error(`❌ Error:`, error.message);
        res.json({ episodes: [] });
    }
});

app.get('/api/v1/anime/episode', async (req, res) => {
    const url = req.query.url;
    console.log(`🎬 Episodio: ${url}`);
    
    if (!url) {
        return res.status(400).json({ error: 'URL requerida' });
    }
    
    try {
        const videoData = await animeav1Service.getEpisodeLinks(url);
        res.json(videoData);
    } catch (error) {
        console.error(`❌ Error:`, error.message);
        res.json({ video_url: null });
    }
});

app.listen(PORT, () => {
    console.log(`✅ API DEXTV en http://localhost:${PORT}`);
});
