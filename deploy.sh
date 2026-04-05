#!/bin/bash
# deploy.sh — Build + Server restart ohne SSH-Verbindungsabbruch
# Läuft komplett im Hintergrund, Output in /tmp/deploy.log

LOG="/tmp/deploy.log"
echo "[$(date '+%H:%M:%S')] Deploy gestartet..." | tee $LOG

cd /home/fabio/dashboard

# Build (CPU-intensiv — läuft trotzdem weiter wenn SSH abbricht)
npm run build >> $LOG 2>&1
if [ $? -ne 0 ]; then
  echo "[$(date '+%H:%M:%S')] ❌ Build fehlgeschlagen — siehe $LOG" | tee -a $LOG
  exit 1
fi

# Server restart
pkill -f "node server/index.js" 2>/dev/null
sleep 1
nohup node server/index.js >> $LOG 2>&1 &
echo "[$(date '+%H:%M:%S')] ✅ Server gestartet (PID $!)" | tee -a $LOG
echo "[$(date '+%H:%M:%S')] ✅ Deploy fertig" | tee -a $LOG
