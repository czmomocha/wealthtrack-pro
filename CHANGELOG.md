# 更新日志

## 🎉 v2.0.0 - 服务器端数据存储 (2024-12-31)

### 🚀 新增功能

#### 1. 服务器端数据存储系统
- ✅ 完整的后端API服务器 (`server.js`)
- ✅ 基于文件系统的用户数据存储
- ✅ 每个用户分配唯一ID，数据完全隔离
- ✅ RESTful API接口设计

**API端点：**
- `POST /api/auth/register` - 注册/生成用户ID
- `POST /api/data/upload` - 上传数据到服务器
- `GET /api/data/download/:userId` - 下载用户数据
- `DELETE /api/data/delete/:userId` - 删除用户数据
- `GET /api/health` - 健康检查
- `GET /api/stats` - 统计信息

#### 2. 前端集成服务器存储
- ✅ 新增 `serverStorageService.ts` 服务层
- ✅ 改进同步UI，替换原有的jsonblob.com方案
- ✅ 增强错误处理和用户提示
- ✅ 支持服务器健康状态检查

#### 3. 一键部署脚本
新增3个部署脚本，适配不同场景：

**`deploy-full.sh`（推荐）**
- 前端 + 后端完整部署
- PM2进程管理
- 自动配置环境变量
- 支持自定义域名

**`deploy-simple.sh`**
- 仅部署前端
- 使用Vite preview模式
- 快速启动

**`deploy.sh`**
- Nginx静态托管
- 生产级配置
- 适合高流量场景

#### 4. 完善的文档体系
新增5个文档文件：

- **`DEPLOYMENT.md`** - 详细部署指南（VPS部署、Nginx配置、HTTPS）
- **`QUICKSTART.md`** - 快速开始（5分钟上手）
- **`USER_GUIDE.md`** - 用户手册（功能详解、使用技巧）
- **`CHANGELOG.md`** - 更新日志（本文件）
- **`.env.example`** - 环境变量模板

#### 5. 开发体验优化
- ✅ 新增 `npm run dev:all` 命令（同时启动前后端）
- ✅ 添加 `concurrently` 依赖管理并发任务
- ✅ 完善 `.gitignore`（保护用户数据和环境变量）

---

### 🔄 改进功能

#### 数据同步机制
**旧版本（v1.x）：**
- 使用 jsonblob.com 第三方服务
- 依赖外部服务稳定性
- 数据隐私无法保证

**新版本（v2.0）：**
- 自建服务器存储
- 数据完全掌控
- 支持用户数据隔离
- 可备份、可迁移

#### UI改进
- ✅ 同步界面文案优化
- ✅ 增强错误提示信息
- ✅ 显示数据更新时间戳

---

### 🛠️ 技术栈更新

#### 新增依赖
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "concurrently": "^8.2.2"
  }
}
```

#### 新增脚本
```json
{
  "scripts": {
    "dev:server": "node server.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:server\"",
    "start:server": "node server.js"
  }
}
```

---

### 📁 文件结构变化

#### 新增文件
```
wealthtrack-pro/
├── server.js                       # 后端API服务器 [新增]
├── services/
│   └── serverStorageService.ts     # 服务器存储服务 [新增]
├── deploy-full.sh                  # 完整部署脚本 [新增]
├── deploy-simple.sh                # 简化部署脚本 [新增]
├── deploy.sh                       # Nginx部署脚本 [新增]
├── .env.example                    # 环境变量模板 [新增]
├── .gitignore                      # Git忽略配置 [新增]
├── DEPLOYMENT.md                   # 部署指南 [新增]
├── QUICKSTART.md                   # 快速开始 [新增]
├── USER_GUIDE.md                   # 用户手册 [新增]
├── CHANGELOG.md                    # 更新日志 [新增]
└── user-data/                      # 用户数据目录 [运行时生成]
```

#### 修改文件
```
├── App.tsx                         # 集成服务器存储 [修改]
├── package.json                    # 新增依赖和脚本 [修改]
└── README.md                       # 完善项目说明 [修改]
```

---

### 🔒 安全性增强

1. **数据隔离**
   - 每个用户独立ID
   - 数据文件独立存储
   - 无跨用户数据泄露风险

2. **环境变量保护**
   - `.env.local` 加入 `.gitignore`
   - 提供 `.env.example` 模板
   - 敏感信息不提交到Git

3. **用户数据保护**
   - `user-data/` 目录加入 `.gitignore`
   - 建议定期备份
   - 支持数据删除功能

---

### 📊 性能优化

1. **后端服务**
   - Express轻量级框架
   - 文件系统直接读写
   - 无数据库依赖，降低复杂度

2. **前端优化**
   - 使用 Vite 快速构建
   - 生产环境代码压缩
   - 支持Gzip压缩

---

### 🐛 Bug修复

- 修复：jsonblob.com服务不稳定导致同步失败
- 修复：数据同步时的错误提示不明确
- 优化：同步过程中的加载状态显示

---

### 📈 迁移指南

#### 从 v1.x 升级到 v2.0

**步骤1：拉取最新代码**
```bash
git pull origin master
npm install
```

**步骤2：配置环境变量**
```bash
cp .env.example .env.local
# 编辑 .env.local，配置 Gemini API Key
```

**步骤3：启动服务**
```bash
# 本地开发
npm run dev:all

# VPS部署
./deploy-full.sh
```

**步骤4：数据迁移**
- 旧版本用户数据存储在浏览器localStorage
- 打开应用后，数据会自动加载
- 点击"备份到服务器"完成迁移

---

### 🚀 未来计划

#### v2.1（规划中）
- [ ] Excel导出功能
- [ ] 历史数据追踪
- [ ] 批量导入资产

#### v2.2（规划中）
- [ ] PWA支持（离线使用）
- [ ] 移动端原生应用
- [ ] 数据可视化增强

#### v3.0（远期规划）
- [ ] 多语言支持
- [ ] 预算管理模块
- [ ] 投资建议系统
- [ ] 社区分享功能

---

### 🙏 致谢

感谢所有用户的反馈和建议！

---

### 📞 联系方式

- **问题反馈**：GitHub Issues
- **功能建议**：GitHub Discussions
- **技术支持**：查看文档

---

## v1.0.0 - 初始版本 (2024-12)

### 核心功能
- ✅ 多用户账户管理
- ✅ 资产追踪
- ✅ 多币种支持
- ✅ 投资路径分类
- ✅ 数据可视化
- ✅ AI投资分析
- ✅ 云端同步（jsonblob.com）

---

**版本说明：**
- 主版本号：重大功能更新或架构调整
- 次版本号：新增功能
- 修订号：Bug修复和小优化
