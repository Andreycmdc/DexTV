window.DexTVPlayer = {
    currentMalId: null, currentEpisode: null, player: null, watchedEpisodes: {},
    init: function() {
        this.player = document.getElementById('mainPlayer');
        const saved = localStorage.getItem('dextv_watched');
        if (saved) this.watchedEpisodes = JSON.parse(saved);
        if (this.player) {
            this.player.addEventListener('error', (e) => showToast('Error en video', 'error'));
            this.player.addEventListener('loadedmetadata', () => showToast('Video listo', 'success'));
        }
        this.setupQualitySelector();
    },
    loadVideo: function(url, malId, episodeNum) {
        if (!url || !this.player) return false;
        this.currentMalId = malId;
        this.currentEpisode = episodeNum;
        localStorage.setItem(`dextv_last_ep_${malId}`, episodeNum);
        this.player.src = url;
        this.player.load();
        this.player.play().catch(() => showToast('Click para reproducir', 'info'));
        return true;
    },
    getLastEpisode: function(malId) { return localStorage.getItem(`dextv_last_ep_${malId}`); },
    isWatched: function(malId, episode) { return !!this.watchedEpisodes[`${malId}_${episode}`]; },
    setupQualitySelector: function() {
        document.querySelectorAll('#qualitySelector button').forEach(btn => {
            btn.addEventListener('click', () => showToast(`Calidad ${btn.dataset.quality}`, 'success'));
        });
    }
};
