#!/usr/bin/env bash
set -euo pipefail

# === Config (edit as needed) ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-}"
if [[ -z "${APP_DIR}" ]]; then
  if [ -f "${SCRIPT_DIR}/package.json" ]; then
    APP_DIR="${SCRIPT_DIR}"
  elif [ -f "${SCRIPT_DIR}/app/package.json" ]; then
    APP_DIR="${SCRIPT_DIR}/app"
  elif [ -f "${SCRIPT_DIR}/client/package.json" ] && [ -f "${SCRIPT_DIR}/server/index.js" ]; then
    APP_DIR="${SCRIPT_DIR}"
  else
    for candidate in "${SCRIPT_DIR}"/*; do
      if [ -d "${candidate}" ] && [ -f "${candidate}/package.json" ] && [ -f "${candidate}/server/index.js" ]; then
        APP_DIR="${candidate}"
        break
      fi
      if [ -d "${candidate}" ] && [ -f "${candidate}/app/package.json" ] && [ -f "${candidate}/app/server/index.js" ]; then
        APP_DIR="${candidate}/app"
        break
      fi
    done
  fi
fi

if [[ -z "${APP_DIR}" ]]; then
  echo "Cannot locate project directory. Set APP_DIR or run start.sh from the project root."
  exit 1
fi

API_HOST="${API_HOST:-81.69.255.29}"
API_PORT="${API_PORT:-18400}"
WEB_PORT="${WEB_PORT:-18080}"
API_BASE="http://${API_HOST}:${API_PORT}/api"
CLIENT_ORIGIN="http://${API_HOST}:${WEB_PORT}"
JWT_SECRET="${JWT_SECRET:-CHANGE_ME}"
ENABLE_DEMO_DATA="${ENABLE_DEMO_DATA:-true}"
ENABLE_DEMO_DATA="${ENABLE_DEMO_DATA,,}"
ADMIN_NAME="${ADMIN_NAME:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
DB_DIR="${APP_DIR}/data"
DB_PATH="${DB_PATH:-${DB_DIR}/bainyingcai.db}"
SERVER_DATA_DIR="${APP_DIR}/server/data"

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

if [[ "${ENABLE_DEMO_DATA}" == "false" ]]; then
  if [[ -z "${ADMIN_EMAIL}" || -z "${ADMIN_PASSWORD}" ]]; then
    echo "ENABLE_DEMO_DATA=false requires ADMIN_EMAIL and ADMIN_PASSWORD."
    exit 1
  fi
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 not found. Installing globally..."
  npm i -g pm2
fi

if [ -f "package.json" ]; then
  echo "Installing backend deps..."
  npm install
else
  if [ -d "node_modules" ]; then
    echo "package.json missing; skipping backend npm install (node_modules already present)."
  else
    echo "package.json missing and node_modules not found. Please copy package.json or set APP_DIR to the repo root."
    exit 1
  fi
fi

echo "Installing frontend deps..."
npm --prefix client install

echo "Building frontend..."
VITE_API_BASE="${API_BASE}" npm --prefix client run build

echo "Preparing data directory..."
mkdir -p "${DB_DIR}/uploads"
mkdir -p "${SERVER_DATA_DIR}/uploads"

echo "Starting/restarting backend..."
pm2 delete talent-api >/dev/null 2>&1 || true
ENV_VARS=(
  "PORT=${API_PORT}"
  "CLIENT_ORIGIN=${CLIENT_ORIGIN}"
  "JWT_SECRET=${JWT_SECRET}"
  "ENABLE_DEMO_DATA=${ENABLE_DEMO_DATA}"
  "DB_PATH=${DB_PATH}"
  "NODE_ENV=production"
)
if [[ -n "${ADMIN_NAME}" ]]; then
  ENV_VARS+=("ADMIN_NAME=${ADMIN_NAME}")
fi
if [[ -n "${ADMIN_EMAIL}" ]]; then
  ENV_VARS+=("ADMIN_EMAIL=${ADMIN_EMAIL}")
fi
if [[ -n "${ADMIN_PASSWORD}" ]]; then
  ENV_VARS+=("ADMIN_PASSWORD=${ADMIN_PASSWORD}")
fi
env "${ENV_VARS[@]}" pm2 start server/index.js --name talent-api

echo "Starting/restarting frontend..."
pm2 delete talent-web >/dev/null 2>&1 || true
pm2 serve client/dist "${WEB_PORT}" --name talent-web --spa

pm2 save

echo "Done."
echo "Web: ${CLIENT_ORIGIN}"
echo "API: ${API_BASE}"
