#!/bin/bash

##############################################
# WealthTrack Pro - VPS 一键部署脚本
# 功能：停止服务 -> 拉取代码 -> 构建 -> 部署 -> 输出访问链接
##############################################

set -e  # 遇到错误立即退出

# ========== 配置区 ==========
# 自动检测项目目录
if [ -f "package.json" ] && [ -f "server.js" ]; then
    PROJECT_DIR="$(pwd)"
    echo "✓ 检测到当前目录是项目根目录: $PROJECT_DIR"
else
    PROJECT_DIR="/var/www/wealthtrack-pro"  # Nginx默认目录
    echo "→ 使用默认项目目录: $PROJECT_DIR"
fi

GIT_REPO="https://github.com/czmomocha/wealthtrack-pro.git"  # 替换为你的Git仓库地址
GIT_BRANCH="master"  # Git分支
NGINX_PORT=3000  # Nginx代理端口
SERVER_IP=$(curl -s ifconfig.me)  # 自动获取服务器公网IP
DOMAIN="${SERVER_IP}"  # 如果有域名，修改为你的域名

echo "========================================"
echo "  WealthTrack Pro 部署脚本"
echo "========================================"

# ========== 1. 停止当前服务 ==========
echo "[1/5] 停止当前服务..."
if systemctl is-active --quiet wealthtrack; then
    sudo systemctl stop wealthtrack
    echo "✓ 已停止系统服务"
elif pgrep -f "vite preview" > /dev/null; then
    pkill -f "vite preview"
    echo "✓ 已停止vite预览服务"
else
    echo "✓ 无需停止（服务未运行）"
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
    
    # 恢复脚本执行权限
    chmod +x deploy-*.sh 2>/dev/null || true
    
    echo "✓ 代码已更新到最新版本"
    
elif [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    
    # 检查是否是git仓库
    if [ -d ".git" ]; then
        echo "检测到已存在的仓库，执行更新..."
        git stash save "自动备份 - $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || true
        git fetch origin
        git checkout $GIT_BRANCH
        git pull origin $GIT_BRANCH
        
        # 恢复脚本执行权限
        chmod +x deploy-*.sh 2>/dev/null || true
        
        echo "✓ 代码已更新到最新版本"
    else
        echo "目录存在但不是git仓库，重新克隆..."
        cd ..
        sudo rm -rf "$PROJECT_DIR"
        sudo mkdir -p "$PROJECT_DIR"
        sudo chown $USER:$USER "$PROJECT_DIR"
        git clone -b $GIT_BRANCH $GIT_REPO "$PROJECT_DIR"
        cd "$PROJECT_DIR"
        
        # 恢复脚本执行权限
        chmod +x deploy-*.sh 2>/dev/null || true
        
        echo "✓ 代码已重新克隆"
    fi
else
    echo "首次部署，克隆仓库..."
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown $USER:$USER "$PROJECT_DIR"
    git clone -b $GIT_BRANCH $GIT_REPO "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # 恢复脚本执行权限
    chmod +x deploy-*.sh 2>/dev/null || true
    
    echo "✓ 代码已克隆"
fi

# ========== 3. 安装依赖并构建 ==========
echo "[3/5] 安装依赖并构建..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

# 安装依赖
npm install

# 检查环境变量文件
if [ ! -f ".env.local" ]; then
    echo "⚠️  未找到 .env.local，创建默认配置..."
    echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env.local
    echo "请编辑 .env.local 添加你的 Gemini API Key"
fi

# 构建生产版本
npm run build
echo "✓ 构建完成"

# ========== 4. 配置Nginx并启动 ==========
echo "[4/5] 配置Nginx反向代理..."

# 创建Nginx配置
NGINX_CONFIG="/etc/nginx/sites-available/wealthtrack"
if [ ! -f "$NGINX_CONFIG" ]; then
    sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    root $PROJECT_DIR/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Gzip压缩
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
    echo "✓ Nginx配置已创建"
else
    echo "✓ Nginx配置已存在"
fi

# 测试并重载Nginx
sudo nginx -t && sudo systemctl reload nginx
echo "✓ Nginx已重载"

# ========== 5. 输出访问链接 ==========
echo "[5/5] 部署完成！"
echo ""
echo "========================================"
echo "  🎉 部署成功！"
echo "========================================"
echo "访问地址: http://${DOMAIN}"
if [ "$DOMAIN" == "$SERVER_IP" ]; then
    echo "          http://${SERVER_IP}"
fi
echo ""
echo "项目目录: $PROJECT_DIR"
echo "日志查看: sudo journalctl -u nginx -f"
echo "========================================"
echo ""
echo "提示："
echo "1. 首次部署请配置 Gemini API Key:"
echo "   编辑 $PROJECT_DIR/.env.local"
echo ""
echo "2. 如需HTTPS，建议使用 Let's Encrypt:"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
