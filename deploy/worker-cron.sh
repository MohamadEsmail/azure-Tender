#!/usr/bin/env bash
#
# Drives the background worker: one tick per run. Add to crontab to run every
# minute (belt-and-suspenders alongside the app's own kick-after-enqueue):
#
#   * * * * * /home/azure/azure-Tender/deploy/worker-cron.sh >> /var/log/azure-worker.log 2>&1
#
# Reads WORKER_SECRET from the app's .env.local. Override APP_DIR / WORKER_URL
# via the environment if your paths differ.
set -euo pipefail

APP_DIR="${APP_DIR:-/home/azure/azure-Tender}"
WORKER_URL="${WORKER_URL:-http://127.0.0.1:3000}"
ENV_FILE="$APP_DIR/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "env file not found: $ENV_FILE" >&2
  exit 1
fi

WORKER_SECRET="$(grep -E '^WORKER_SECRET=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"
if [[ -z "${WORKER_SECRET:-}" ]]; then
  echo "WORKER_SECRET not set in $ENV_FILE" >&2
  exit 1
fi

curl -fsS -m 590 -X POST "$WORKER_URL/api/worker/run" \
  -H "x-worker-secret: $WORKER_SECRET" >/dev/null || true
