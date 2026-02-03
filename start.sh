#!/usr/bin/env bash
set -euo pipefail

# === 配置区（按需修改） ===
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_PORT="18400"
WEB_PORT="18080"
API_BASE="http://81.69.255.29:${API_PORT}/api"
CLIENT_ORIGIN="http://81.69.255.29:${WEB_PORT}"
JWT_SECRET="请替换强随机字符串"
ENABLE_DEMO_DATA="false"

# === 执行区 ===
cd "${APP_DIR}"

if ! command -v node >/dev/null 2>&1; then
  echo "未找到 node，请先安装 Node.js 20+"
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "未找到 pm2，正在全局安装..."
  npm i -g pm2
fi

echo "安装后端依赖..."
npm install

echo "安装前端依赖..."
npm --prefix client install

echo "构建前端..."
VITE_API_BASE="${API_BASE}" npm run build

echo "启动/重启后端..."
pm2 delete talent-api >/dev/null 2>&1 || true
PORT="${API_PORT}" \
CLIENT_ORIGIN="${CLIENT_ORIGIN}" \
JWT_SECRET="${JWT_SECRET}" \
ENABLE_DEMO_DATA="${ENABLE_DEMO_DATA}" \
pm2 start server/index.js --name talent-api

echo "启动/重启前端..."
pm2 delete talent-web >/dev/null 2>&1 || true
pm2 serve client/dist "${WEB_PORT}" --name talent-web --spa

pm2 save

echo "启动完成："
echo "前端：${CLIENT_ORIGIN}"
echo "后端：${API_BASE}"
