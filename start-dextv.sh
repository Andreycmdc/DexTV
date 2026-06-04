#!/bin/bash
echo "========================================"
echo "   DEXTV - Iniciando plataforma"
echo "========================================"
cd ~/DexTV/anime1v-api
echo "▶ Iniciando API de anime en puerto 3001..."
npm run dev > /tmp/dextv-api.log 2>&1 &
echo $! > /tmp/dextv-api.pid
sleep 3
cd ~/DexTV/dexTV-web
echo "▶ Iniciando servidor web en puerto 8080..."
python3 -m http.server 8080 > /tmp/dextv-web.log 2>&1 &
echo $! > /tmp/dextv-web.pid
echo ""
echo "✅ DEXTV CORRIENDO"
echo "  🌐 Web: http://localhost:8080"
echo "  📡 API Anime: http://localhost:3001"
echo ""
