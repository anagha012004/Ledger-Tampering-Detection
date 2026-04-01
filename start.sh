#!/bin/sh
# start.sh — launches bridge (background) then Spring Boot (foreground)

echo "Starting blockchain bridge..."
cd /blockchain && node bridge.js &
BRIDGE_PID=$!

# Wait for bridge to be ready (max 60s)
echo "Waiting for bridge on :3001..."
for i in $(seq 1 30); do
  if wget -q -O- http://localhost:3001/health > /dev/null 2>&1; then
    echo "Bridge is ready."
    break
  fi
  sleep 2
done

echo "Starting Spring Boot..."
exec java -jar /app/app.jar
