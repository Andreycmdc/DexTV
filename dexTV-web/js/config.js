export const CONFIG = {
    APIS: [
        {
            id: 1,
            name: 'dexanime',
            baseUrl: 'https://dexanime-api.onrender.com/api/v1/anime',
            apiKey: 'dev-anime1v-key',
            authHeader: 'X-API-Key'
        },
        {
            id: 2,
            name: 'anime1v',
            baseUrl: 'https://anime1v-api-limpio.onrender.com/api/v1/anime',
            apiKey: 'dev-anime1v-key',
            authHeader: 'X-API-Key'
        }
    ],
    CACHE_EXPIRY: 24 * 60 * 60 * 1000
};
