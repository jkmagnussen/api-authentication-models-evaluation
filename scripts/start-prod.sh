#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npm run prepare:env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
npm start > /tmp/api-auth-backend.log 2>&1 &
APP_PID=$!
echo "Started production server with PID $APP_PID"

for _ in $(seq 1 20); do
  if node scripts/healthcheck.js; then
    echo "Healthcheck passed"
    exit 0
  fi
  sleep 1
done

echo "Production server failed healthcheck"
kill "$APP_PID" 2>/dev/null || true
exit 1
