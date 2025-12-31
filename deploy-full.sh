#!/bin/bash

##############################################
# WealthTrack Pro - 完整VPS部署脚本
# 功能：部署前端+后端API服务
##############################################

set -e

# ========== 配置 ==========
PROJECT_DIR="$HOME/wealthtrack-pro"
GIT_REPO="https://github.com/your-username/wealthtrack-pro.git"
GIT_BRANCH="master"
FRONTEND_PORT=3000
BACKEND_PORT=3001
DOMAIN="${1:-localhost}"  # 第一个参数为域名，默认localhost

echo "🚀 开始部署 WealthTrack Pro 完整服务..."

# ========== 1. 停止服务 ==========
echo "[1/6] 停止当前服务..."
if command -v pm2 &> /dev/null; then
    pm2 delete wealthtrack-frontend 2>/dev/null || true
    pm2 delete wealthtrack-backend 2>/dev/null || true
    echo "✓ PM2服务已停止"
fi

# ========== 2. 拉取代码 ==========
echo "[2/6] 拉取最新代码..."
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    git fetch origin
    git reset --hard origin/$GIT_BRANCH
    echo "✓ 代码已更新"
else
    git clone -b $GIT_BRANCH $GIT_REPO "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    echo "✓ 代码已克隆"
fi

# ========== 3. 配置环境变量 ==========
echo "[3/6] 配置环境变量..."
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "⚠️  请编辑 .env.local 配置 Gemini API Key"
fi

# 更新API地址
SERVER_IP=$(curl -s ifconfig.me)
if [ "$DOMAIN" != "localhost" ]; then
    sed -i "s|VITE_API_URL=.*|VITE_API_URL=http://${DOMAIN}:${BACKEND_PORT}/api|g" .env.local
else
    sed -i "s|VITE_API_URL=.*|VITE_API_URL=http://${SERVER_IP}:${BACKEND_PORT}/api|g" .env.local
fi

echo "✓ 环境变量已配置"

# ========== 4. 安装依赖并构建前端 ==========
echo "[4/6] 安装依赖并构建前端..."
npm install
npm run build
echo "✓ 前端构建完成"

# ========== 5. 启动服务 ==========
echo "[5/6] 启动前后端服务..."

# 检查PM2
if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    npm install -g pm2
fi

# 启动后端API服务
PORT=$BACKEND_PORT pm2 start server.js --name wealthtrack-backend

# 启动前端服务
PORT=$FRONTEND_PORT pm2 start npm --name wealthtrack-frontend -- run preview

pm2 save
pm2 startup

echo "✓ 服务已启动"

# ========== 6. 输出信息 ==========
echo ""
echo "========================================"
echo "  🎉 部署成功！"
echo "========================================"
echo "前端地址: http://${SERVER_IP}:${FRONTEND_PORT}"
echo "后端API:  http://${SERVER_IP}:${BACKEND_PORT}/api"
echo "项目目录: $PROJECT_DIR"
echo "数据目录: $PROJECT_DIR/user-data"
echo ""
echo "服务管理:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs"
echo "  重启前端: pm2 restart wealthtrack-frontend"
echo "  重启后端: pm2 restart wealthtrack-backend"
echo "  停止服务: pm2 stop all"
echo ""
echo "配置文件:"
echo "  环境变量: $PROJECT_DIR/.env.local"
echo "  后端日志: pm2 logs wealthtrack-backend"
echo ""
echo "⚠️  重要提示："
echo "1. 请编辑 .env.local 配置 Gemini API Key"
echo "2. 请确保防火墙开放 ${FRONTEND_PORT} 和 ${BACKEND_PORT} 端口"
echo "3. 建议配置Nginx反向代理并启用HTTPS"
echo "========================================"
