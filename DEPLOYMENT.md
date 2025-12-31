# WealthTrack Pro 部署指南

## 📋 目录
1. [本地开发](#本地开发)
2. [VPS部署](#vps部署)
3. [服务器端数据存储](#服务器端数据存储)
4. [常见问题](#常见问题)

---

## 🚀 本地开发

### 前置要求
- Node.js 18+ 
- Git

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-username/wealthtrack-pro.git
cd wealthtrack-pro

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，添加你的 Gemini API Key

# 4. 启动开发服务（前端+后端）
npm run dev:all

# 或者分别启动
npm run dev          # 前端：http://localhost:5173
npm run dev:server   # 后端：http://localhost:3001
```

---

## 🌐 VPS部署

### 方案一：完整部署（前端+后端）

```bash
# SSH登录VPS后执行
cd ~
git clone https://github.com/your-username/wealthtrack-pro.git
cd wealthtrack-pro

# 赋予执行权限
chmod +x deploy-full.sh

# 执行部署（可选传入域名）
./deploy-full.sh your-domain.com

# 或使用IP
./deploy-full.sh
```

**部署后访问：**
- 前端：`http://your-server-ip:3000`
- 后端API：`http://your-server-ip:3001/api`

### 方案二：仅前端（静态部署）

```bash
chmod +x deploy-simple.sh
./deploy-simple.sh
```

**注意：** 此方案仅部署前端，数据同步功能将使用jsonblob.com外部服务。

### 防火墙配置

```bash
# 开放端口
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

### 配置Nginx反向代理（推荐）

```nginx
# /etc/nginx/sites-available/wealthtrack
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
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/wealthtrack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 启用HTTPS（Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 💾 服务器端数据存储

### 架构说明

**旧版本（jsonblob.com）：**
- 优点：无需后端，快速部署
- 缺点：依赖第三方服务，数据安全性低

**新版本（自建服务器）：**
- 优点：数据完全掌控，隐私安全
- 缺点：需要部署后端服务

### API端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/auth/register` | POST | 生成用户ID |
| `/api/data/upload` | POST | 上传数据 |
| `/api/data/download/:userId` | GET | 下载数据 |
| `/api/data/delete/:userId` | DELETE | 删除数据 |
| `/api/health` | GET | 健康检查 |
| `/api/stats` | GET | 统计信息 |

### 使用流程

1. **首次备份：**
   - 点击"备份到服务器"按钮
   - 系统自动生成唯一用户ID
   - 保存用户ID（例如：`a3f2c8b9e1d4f5a7`）

2. **其他设备同步：**
   - 在设置页输入用户ID
   - 点击"同步"按钮
   - 确认覆盖本地数据

3. **数据存储位置：**
   ```
   /home/user/wealthtrack-pro/user-data/
   ├── a3f2c8b9e1d4f5a7.json
   ├── b2c4d6e8f0a1b3c5.json
   └── ...
   ```

### 数据备份

```bash
# 定期备份用户数据目录
tar -czf wealthtrack-backup-$(date +%Y%m%d).tar.gz ~/wealthtrack-pro/user-data/
```

---

## 🔧 服务管理

### PM2 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs
pm2 logs wealthtrack-frontend
pm2 logs wealthtrack-backend

# 重启服务
pm2 restart all
pm2 restart wealthtrack-backend

# 停止服务
pm2 stop all

# 删除服务
pm2 delete all

# 监控
pm2 monit
```

---

## ❓ 常见问题

### 1. 前端无法连接后端API

**检查：**
```bash
# 测试后端健康状态
curl http://localhost:3001/api/health

# 检查PM2日志
pm2 logs wealthtrack-backend
```

**解决：**
- 确保后端服务已启动：`pm2 status`
- 检查 `.env.local` 中 `VITE_API_URL` 配置是否正确
- 检查防火墙是否开放3001端口

### 2. 同步失败：服务器连接失败

**原因：**
- 后端服务未启动
- API地址配置错误
- 防火墙阻止

**解决：**
```bash
# 重启后端服务
pm2 restart wealthtrack-backend

# 检查端口监听
netstat -tuln | grep 3001

# 检查防火墙
sudo ufw status
```

### 3. 数据丢失如何恢复？

**恢复步骤：**
1. 在服务器找到用户数据文件：`~/wealthtrack-pro/user-data/your-user-id.json`
2. 查看文件内容：`cat user-data/your-user-id.json`
3. 在前端使用相同用户ID同步数据

### 4. 如何迁移到新服务器？

```bash
# 在旧服务器
cd ~/wealthtrack-pro
tar -czf wealthtrack-data.tar.gz user-data/
scp wealthtrack-data.tar.gz user@new-server:~/

# 在新服务器
cd ~/wealthtrack-pro
tar -xzf ~/wealthtrack-data.tar.gz
```

---

## 📊 系统架构

```
┌─────────────────┐
│   浏览器/手机    │
└────────┬────────┘
         │ HTTP
         ↓
┌─────────────────┐
│   Nginx (可选)   │
│   端口: 80/443   │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌────────┐
│ 前端    │ │ 后端    │
│ :3000  │ │ :3001  │
└────────┘ └───┬────┘
                │
                ↓
        ┌──────────────┐
        │  文件系统     │
        │  user-data/   │
        └──────────────┘
```

---

## 🔐 安全建议

1. **启用HTTPS**：使用Let's Encrypt免费证书
2. **限制API访问**：配置Nginx IP白名单
3. **定期备份**：设置cron定时备份user-data目录
4. **环境变量**：不要将`.env.local`提交到Git
5. **防火墙**：仅开放必要端口

---

## 📝 更新日志

### v2.0 (2024-12)
- ✅ 新增服务器端数据存储
- ✅ 支持多用户数据隔离
- ✅ 一键部署脚本
- ✅ 改进同步机制

---

## 📞 技术支持

如遇问题，请检查：
1. 后端日志：`pm2 logs wealthtrack-backend`
2. 前端日志：浏览器开发者工具 Console
3. 网络请求：浏览器 Network 面板

**联系方式：** [GitHub Issues](https://github.com/your-username/wealthtrack-pro/issues)
