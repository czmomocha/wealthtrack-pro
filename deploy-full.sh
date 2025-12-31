#!/bin/bash

##############################################
# WealthTrack Pro - 完整VPS部署脚本
# 功能：部署前端+后端API服务
##############################################

set -e

# ========== 配置 ==========
# 自动检测项目目录：如果当前目录是项目根目录，使用当前目录；否则使用默认路径
if [ -f "package.json" ] && [ -f "server.js" ]; then
    PROJECT_DIR="$(pwd)"
    echo "✓ 检测到当前目录是项目根目录: $PROJECT_DIR"
else
    PROJECT_DIR="$HOME/wealthtrack-pro"
    echo "→ 使用默认项目目录: $PROJECT_DIR"
fi

GIT_REPO="https://github.com/czmomocha/wealthtrack-pro.git"
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

# ========== 2. 拉取/更新代码 ==========
echo "[2/6] 更新代码..."

# 如果当前目录就是项目目录且存在git仓库，直接更新
if [ "$PROJECT_DIR" = "$(pwd)" ] && [ -d ".git" ]; then
    echo "检测到当前目录已是项目仓库，执行更新..."
    
    # 保存本地修改
    git stash save "自动备份 - $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || true
    
    # 拉取最新代码
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
        
        # 保存本地修改
        git stash save "自动备份 - $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || true
        
        # 拉取最新代码
        git fetch origin
        git checkout $GIT_BRANCH
        git pull origin $GIT_BRANCH
        
        # 恢复脚本执行权限
        chmod +x deploy-*.sh 2>/dev/null || true
        
        echo "✓ 代码已更新到最新版本"
    else
        echo "目录存在但不是git仓库，重新克隆..."
        cd ..
        rm -rf "$PROJECT_DIR"
        git clone -b $GIT_BRANCH $GIT_REPO "$PROJECT_DIR"
        cd "$PROJECT_DIR"
        
        # 恢复脚本执行权限
        chmod +x deploy-*.sh 2>/dev/null || true
        
        echo "✓ 代码已重新克隆"
    fi
else
    echo "首次部署，克隆仓库..."
    mkdir -p "$(dirname "$PROJECT_DIR")"
    git clone -b $GIT_BRANCH $GIT_REPO "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # 恢复脚本执行权限
    chmod +x deploy-*.sh 2>/dev/null || true
    
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

# ========== 4. 检查并安装Node.js ==========
echo "[4/7] 检查Node.js和npm..."

if ! command -v node &> /dev/null; then
    echo "⚠️  未检测到Node.js，开始安装..."
    
    # 检测操作系统
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        echo "检测到Debian/Ubuntu系统，使用NodeSource安装..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL - 检查版本
        OS_VERSION=$(cat /etc/redhat-release)
        echo "检测到系统: $OS_VERSION"
        
        # 检查glibc版本
        GLIBC_VERSION=$(ldd --version | head -n1 | grep -oP '\d+\.\d+$' || echo "0")
        echo "当前glibc版本: $GLIBC_VERSION"
        
        if [ -n "$GLIBC_VERSION" ] && awk -v ver="$GLIBC_VERSION" 'BEGIN{exit(ver<2.28)}'; then
            # glibc >= 2.28，可以安装Node.js 20
            echo "使用NodeSource安装Node.js 20.x..."
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
        else
            # glibc < 2.28 (如CentOS 7)，使用官方旧版本二进制
            echo "⚠️  检测到CentOS 7 (glibc 2.17)，需要特殊处理..."
            echo "正在安装Node.js 16.x (最后支持CentOS 7的LTS版本)..."
            
            # 使用NodeSource的Node.js 16.x（官方支持CentOS 7）
            curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
            sudo yum install -y nodejs
            
            # 如果16.x也失败，尝试从EPEL安装
            if ! command -v node &> /dev/null; then
                echo "尝试从EPEL仓库安装..."
                sudo yum install -y epel-release
                sudo yum install -y nodejs npm
            fi
            
            # 最后的方案：手动下载兼容的二进制版本
            if ! command -v node &> /dev/null; then
                echo "使用手动安装方式..."
                cd /tmp
                wget https://nodejs.org/dist/v16.20.2/node-v16.20.2-linux-x64.tar.xz
                sudo tar -xf node-v16.20.2-linux-x64.tar.xz -C /usr/local --strip-components=1
                rm -f node-v16.20.2-linux-x64.tar.xz
            fi
        fi
    else
        echo "❌ 无法识别的操作系统，请手动安装Node.js"
        echo "   推荐使用NVM: https://github.com/nvm-sh/nvm"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js安装失败"
        echo ""
        echo "对于CentOS 7系统，请手动执行以下命令："
        echo "1. 使用二进制包安装Node.js 16.x："
        echo "   cd /tmp"
        echo "   wget https://nodejs.org/dist/v16.20.2/node-v16.20.2-linux-x64.tar.xz"
        echo "   sudo tar -xf node-v16.20.2-linux-x64.tar.xz -C /usr/local --strip-components=1"
        echo "   node -v"
        echo ""
        echo "2. 或升级系统到CentOS 8+/Rocky Linux 8+"
        exit 1
    fi
    
    echo "✓ Node.js $(node -v) 安装成功"
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        echo "⚠️  Node.js版本过低 ($(node -v))，建议升级到16+版本"
    else
        echo "✓ Node.js $(node -v) 已安装"
    fi
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm未找到，但Node.js已安装，请检查安装"
    exit 1
fi

echo "✓ npm $(npm -v) 已准备就绪"

# ========== 5. 安装依赖并构建前端 ==========
echo "[5/7] 安装依赖并构建前端..."
npm install
npm run build
echo "✓ 前端构建完成"

# ========== 6. 启动服务 ==========
echo "[6/7] 启动前后端服务..."

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

# ========== 7. 输出信息 ==========
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
