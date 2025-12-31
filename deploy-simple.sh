#!/bin/bash

##############################################
# WealthTrack Pro - 简化版VPS部署脚本
# 使用PM2管理Vite Preview服务
##############################################

set -e

# ========== 配置 ==========
# 自动检测项目目录
if [ -f "package.json" ] && grep -q "wealthtrack-pro" package.json 2>/dev/null; then
    PROJECT_DIR="$(pwd)"
    echo "✓ 检测到当前目录是项目根目录: $PROJECT_DIR"
else
    PROJECT_DIR="$HOME/wealthtrack-pro"
    echo "→ 使用默认项目目录: $PROJECT_DIR"
fi

GIT_REPO="https://github.com/czmomocha/wealthtrack-pro.git"
GIT_BRANCH="master"
PORT=3000

echo "🚀 开始部署 WealthTrack Pro..."

# ========== 1. 停止服务 ==========
echo "[1/5] 停止当前服务..."
if command -v pm2 &> /dev/null; then
    pm2 delete wealthtrack 2>/dev/null || true
    echo "✓ PM2服务已停止"
fi

# ========== 2. 拉取/更新代码 ==========
echo "[2/5] 更新代码..."

# 如果当前目录就是项目目录且存在git仓库，直接更新
if [ "$PROJECT_DIR" = "$(pwd)" ] && [ -d ".git" ]; then
    echo "检测到当前目录已是项目仓库，执行更新..."
    git stash save "自动备份 - $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || true
    git fetch origin
    git checkout $GIT_BRANCH
    git pull origin $GIT_BRANCH
    echo "✓ 代码已更新"
    
elif [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    
    # 检查是否是git仓库
    if [ -d ".git" ]; then
        echo "检测到已存在的仓库，执行更新..."
        git stash save "自动备份 - $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || true
        git fetch origin
        git checkout $GIT_BRANCH
        git pull origin $GIT_BRANCH
        echo "✓ 代码已更新"
    else
        echo "目录存在但不是git仓库，重新克隆..."
        cd ..
        rm -rf "$PROJECT_DIR"
        git clone -b $GIT_BRANCH $GIT_REPO "$PROJECT_DIR"
        cd "$PROJECT_DIR"
        echo "✓ 代码已重新克隆"
    fi
else
    echo "首次部署，克隆仓库..."
    git clone -b $GIT_BRANCH $GIT_REPO "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    echo "✓ 代码已克隆"
fi

# ========== 3. 构建 ==========
echo "[3/5] 安装依赖并构建..."
npm install
npm run build
echo "✓ 构建完成"

# ========== 4. 启动服务 ==========
echo "[4/5] 启动服务..."

# 检查PM2
if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    npm install -g pm2
fi

# 使用PM2启动vite preview
PORT=$PORT pm2 start npm --name wealthtrack -- run preview
pm2 save
pm2 startup

echo "✓ 服务已启动"

# ========== 5. 输出信息 ==========
SERVER_IP=$(curl -s ifconfig.me)
echo ""
echo "========================================"
echo "  🎉 部署成功！"
echo "========================================"
echo "访问地址: http://${SERVER_IP}:${PORT}"
echo "项目目录: $PROJECT_DIR"
echo ""
echo "服务管理:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs wealthtrack"
echo "  重启服务: pm2 restart wealthtrack"
echo "  停止服务: pm2 stop wealthtrack"
echo "========================================"
