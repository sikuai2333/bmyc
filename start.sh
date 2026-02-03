#!/usr/bin/env bash
set -euo pipefail

# === Config (edit as needed) ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/app/package.json" ]; then
  APP_DIR="${SCRIPT_DIR}/app"
else
  APP_DIR="${SCRIPT_DIR}"
fi

API_HOST="${API_HOST:-81.69.255.29}"
API_PORT="${API_PORT:-18400}"
WEB_PORT="${WEB_PORT:-18080}"
API_BASE="http://${API_HOST}:${API_PORT}/api"
CLIENT_ORIGIN="http://${API_HOST}:${WEB_PORT}"
JWT_SECRET="${JWT_SECRET:-CHANGE_ME}"
ENABLE_DEMO_DATA="${ENABLE_DEMO_DATA:-false}"
DB_DIR="${APP_DIR}/data"
DB_PATH="${DB_PATH:-${DB_DIR}/bainyingcai.db}"

# === Run ===
cd "${APP_DIR}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Please install Node.js 20+."
  exit 1
fi

if [[ "${JWT_SECRET}" == "CHANGE_ME" ]]; then
  echo "JWT_SECRET is not set. Export JWT_SECRET or edit start.sh."
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 not found. Installing globally..."
  npm i -g pm2
fi

echo "Installing backend deps..."
npm install

echo "Installing frontend deps..."
npm --prefix client install

echo "Building frontend..."
VITE_API_BASE="${API_BASE}" npm --prefix client run build

echo "Preparing data directory..."
mkdir -p "${DB_DIR}/uploads"

echo "Starting/restarting backend..."
pm2 delete talent-api >/dev/null 2>&1 || true
PORT="${API_PORT}" \
CLIENT_ORIGIN="${CLIENT_ORIGIN}" \
JWT_SECRET="${JWT_SECRET}" \
ENABLE_DEMO_DATA="${ENABLE_DEMO_DATA}" \
DB_PATH="${DB_PATH}" \
pm2 start server/index.js --name talent-api

echo "Starting/restarting frontend..."
pm2 delete talent-web >/dev/null 2>&1 || true
pm2 serve client/dist "${WEB_PORT}" --name talent-web --spa

pm2 save

echo "Done."
echo "Web: ${CLIENT_ORIGIN}"
echo "API: ${API_BASE}"
