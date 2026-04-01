#!/bin/sh
# start.sh — launches bridge (background) then Spring Boot (foreground)

# Redirect ALL bridge output to /dev/null so Render never detects port 3001
cd /blockchain && node bridge.js > /dev/null 2>&1 &

# Wait for bridge to be ready (max 60s)
for i in $(seq 1 30); do
  if wget -q -O- http://localhost:3001/health > /dev/null 2>&1; then
    echo "==> Blockchain bridge ready"
    break
  fi
  sleep 2
done

exec java -jar /app/app.jar
