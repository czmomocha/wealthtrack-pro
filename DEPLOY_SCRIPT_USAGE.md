# 🚀 部署脚本使用说明

## 📋 三种部署脚本对比

| 特性 | deploy-full.sh | deploy-simple.sh | deploy.sh |
|------|---------------|------------------|-----------|
| **前端** | ✅ Vite Preview | ✅ Vite Preview | ✅ Nginx静态 |
| **后端** | ✅ Express API | ❌ | ❌ |
| **进程管理** | PM2 | PM2 | Nginx/systemd |
| **难度** | 简单 | 最简单 | 中等 |
| **推荐场景** | 生产环境 | 快速测试 | 大流量 |

---

## 🎯 deploy-full.sh（推荐）

### 功能特性
- ✅ 完整的前后端部署
- ✅ 智能代码更新（首次clone，后续pull）
- ✅ 自动保存本地修改（git stash）
- ✅ PM2进程管理
- ✅ 环境变量自动配置
- ✅ 服务器端数据存储

### 使用方法

```bash
# 首次部署
cd ~
git clone https://github.com/your-username/wealthtrack-pro.git
cd wealthtrack-pro
chmod +x deploy-full.sh

# 执行部署
./deploy-full.sh

# 或指定域名
./deploy-full.sh your-domain.com

# 后续更新（直接执行即可）
./deploy-full.sh
```

### 智能更新逻辑

**首次部署：**
```
检查目录不存在 → 克隆仓库 → 安装依赖 → 构建 → 启动
```

**后续更新：**
```
检测到仓库存在 → git stash（保存修改） → git pull → 构建 → 重启服务
```

**异常情况：**
```
目录存在但不是git仓库 → 删除目录 → 重新克隆
```

### 端口配置
- 前端：3000
- 后端：3001

### 访问地址
```
前端：http://your-server-ip:3000
后端：http://your-server-ip:3001/api
健康检查：http://your-server-ip:3001/api/health
```

---

## ⚡ deploy-simple.sh

### 功能特性
- ✅ 仅部署前端
- ✅ 快速启动
- ✅ PM2进程管理
- ❌ 无后端（数据同步使用jsonblob.com）

### 使用方法

```bash
chmod +x deploy-simple.sh
./deploy-simple.sh
```

### 适用场景
- 快速演示
- 不需要服务器存储
- 测试前端功能

---

## 🏗️ deploy.sh

### 功能特性
- ✅ Nginx静态托管
- ✅ 生产级配置
- ✅ Gzip压缩
- ✅ 缓存优化
- ❌ 需要手动配置Nginx

### 使用方法

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

### 后续配置

**启用配置：**
```bash
sudo ln -s /etc/nginx/sites-available/wealthtrack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**启用HTTPS：**
```bash
sudo certbot --nginx -d your-domain.com
```

---

## 🔄 更新流程详解

### 智能更新机制（v2.0新增）

所有脚本现在都支持智能更新：

**步骤1：检测目录**
```bash
if [ -d "$PROJECT_DIR" ]; then
    # 目录存在，进入更新流程
else
    # 目录不存在，首次部署
fi
```

**步骤2：检查Git仓库**
```bash
if [ -d ".git" ]; then
    # 是git仓库，执行更新
else
    # 不是git仓库，重新克隆
fi
```

**步骤3：保存本地修改**
```bash
git stash save "自动备份 - $(date '+%Y-%m-%d %H:%M:%S')"
```

**步骤4：拉取更新**
```bash
git fetch origin
git checkout master
git pull origin master
```

**步骤5：重新构建**
```bash
npm install
npm run build
```

**步骤6：重启服务**
```bash
pm2 restart wealthtrack-frontend
pm2 restart wealthtrack-backend
```

---

## 🛠️ 常见操作

### 查看服务状态
```bash
pm2 status
```

### 查看日志
```bash
# 所有日志
pm2 logs

# 前端日志
pm2 logs wealthtrack-frontend

# 后端日志
pm2 logs wealthtrack-backend

# 实时日志
pm2 logs --lines 100
```

### 重启服务
```bash
# 重启所有
pm2 restart all

# 重启前端
pm2 restart wealthtrack-frontend

# 重启后端
pm2 restart wealthtrack-backend
```

### 停止服务
```bash
pm2 stop all
```

### 删除服务
```bash
pm2 delete all
```

---

## 🐛 故障排查

### 问题1：git pull失败

**原因：** 本地有未提交的修改

**解决：**
```bash
cd ~/wealthtrack-pro

# 查看修改
git status

# 方案1：放弃本地修改
git reset --hard origin/master

# 方案2：保存本地修改
git stash save "手动备份"
git pull origin master

# 恢复修改（可选）
git stash pop
```

### 问题2：PM2服务无法启动

**检查：**
```bash
# 查看PM2日志
pm2 logs wealthtrack-backend --lines 50

# 手动启动测试
cd ~/wealthtrack-pro
PORT=3001 node server.js
```

**常见错误：**
- 端口被占用 → `lsof -i :3001` 查找进程
- 依赖缺失 → `npm install`
- 权限问题 → 检查目录权限

### 问题3：前端无法连接后端

**检查后端状态：**
```bash
curl http://localhost:3001/api/health
```

**预期响应：**
```json
{"status":"ok","timestamp":1735689600000}
```

**解决：**
```bash
# 重启后端
pm2 restart wealthtrack-backend

# 检查防火墙
sudo ufw status
sudo ufw allow 3001/tcp
```

---

## 📊 部署流程图

```
┌─────────────────┐
│  执行部署脚本    │
└────────┬────────┘
         │
         ↓
    ┌────────┐
    │检测目录 │
    └───┬────┘
        │
   ┌────┴────┐
   │存在？    │
   └─┬───┬───┘
  是 │   │ 否
     ↓   ↓
┌────────┐ ┌────────┐
│git仓库？│ │clone   │
└─┬───┬──┘ └───┬────┘
 是│  否│       │
   ↓   ↓       ↓
┌────┐┌────┐   │
│pull││删除│   │
└──┬─┘└──┬─┘   │
   │     ↓     │
   │  ┌────┐   │
   │  │重新│   │
   │  │clone│  │
   │  └──┬─┘   │
   └─────┴─────┘
         │
         ↓
    ┌────────┐
    │构建部署 │
    └────────┘
```

---

## 🔐 安全建议

### 1. 保护敏感文件
```bash
# .env.local 不应提交到Git
echo ".env.local" >> .gitignore

# 限制文件权限
chmod 600 .env.local
```

### 2. 限制SSH访问
```bash
# 仅允许密钥登录
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no

# 重启SSH
sudo systemctl restart sshd
```

### 3. 配置防火墙
```bash
# 仅开放必要端口
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

---

## 📈 性能优化

### 1. 使用Nginx反向代理

**好处：**
- 负载均衡
- SSL终端
- 静态资源缓存
- Gzip压缩

**配置示例：**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 2. PM2集群模式

```bash
# 使用多进程
pm2 start server.js -i max --name wealthtrack-backend
```

### 3. 定期清理日志

```bash
# 清理PM2日志
pm2 flush

# 设置日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 📞 技术支持

- **部署问题**：查看 [DEPLOYMENT.md](DEPLOYMENT.md)
- **使用问题**：查看 [USER_GUIDE.md](USER_GUIDE.md)
- **快速开始**：查看 [QUICKSTART.md](QUICKSTART.md)

---

**更新日志：**
- v2.0.1 (2024-12-31)：优化代码更新逻辑，支持智能pull
- v2.0.0 (2024-12-31)：初始版本，支持一键部署
