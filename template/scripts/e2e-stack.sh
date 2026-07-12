#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-e2e}"
export JWT_SECRET="${JWT_SECRET:-e2e-secret-key-0123456789abcdef}"
export ORIGIN="${ORIGIN:-http://localhost}"
cleanup() { docker compose -f "$ROOT_DIR/compose.prod.yaml" down -v; }
trap cleanup EXIT
docker compose -f compose.prod.yaml up -d --build
# wait for nginx to serve the app
healthy=false
for i in $(seq 1 60); do
	curl -sf http://localhost/api/health >/dev/null 2>&1 && healthy=true && break || sleep 3
done
if [ "$healthy" != "true" ]; then
	echo "stack health check timed out" >&2
	exit 1
fi
(cd "$ROOT_DIR/frontend" && bun install && bunx playwright install --with-deps chromium && E2E_BASE_URL=http://localhost bun run test:e2e:full)
