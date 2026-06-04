#!/bin/bash
echo "🛑 Deteniendo DEXTV..."
if [ -f /tmp/dextv-api.pid ]; then kill $(cat /tmp/dextv-api.pid) 2>/dev/null; rm /tmp/dextv-api.pid; echo "  ✅ API detenida"; fi
if [ -f /tmp/dextv-web.pid ]; then kill $(cat /tmp/dextv-web.pid) 2>/dev/null; rm /tmp/dextv-web.pid; echo "  ✅ Web detenida"; fi
echo "✅ DEXTV detenido"
