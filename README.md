<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 💰 WealthTrack Pro

**专业级多用户财富管理系统**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-19.2.3-61dafb.svg)](https://reactjs.org)

[快速开始](QUICKSTART.md) · [部署指南](DEPLOYMENT.md) · [在线演示](https://ai.studio/apps/drive/1YQKNoOJ0Xo0jHF0Pqf1xsUi1nlksipAg)

</div>

---

## ✨ 核心功能

### 📊 资产管理
- **多账户支持**：创建多个钱包（美股账户、A股账户、家庭储备等）
- **多币种追踪**：CNY/USD/HKD + 自定义币种，实时汇率换算
- **投资分类**：定期存款、股票、债券、房地产、数字货币、黄金等
- **收益计算**：
  - 普通资产：年化收益率
  - 房地产：租金收益率 + 估值变化率
  - 自动计算加权平均收益

### 📈 数据可视化
- 币种占比饼图
- 投资路径收益柱状图
- 实时总资产统计
- 预期年化收益预测

### 🤖 AI智能分析
- 基于 Google Gemini 的投资组合分析
- 风险评估与优化建议
- 多元化配置展望

### 🔄 跨设备同步
- **服务器端存储**：数据完全掌控，隐私安全
- **多设备同步**：手机/电脑/平板无缝切换
- **用户隔离**：每个用户独立ID，数据互不干扰

---

## 🚀 快速开始

### 本地运行

**前置要求：** Node.js 18+

```bash
# 1. 克隆项目
git clone https://github.com/your-username/wealthtrack-pro.git
cd wealthtrack-pro

# 2. 安装依赖
npm install

# 3. 配置环境变量（可选）
cp .env.example .env.local
# 编辑 .env.local，添加 Gemini API Key

# 4. 启动前后端
npm run dev:all
```

访问：http://localhost:5173

---

## 🌐 VPS部署

### 一键部署脚本

```bash
# SSH登录VPS后执行
git clone https://github.com/your-username/wealthtrack-pro.git
cd wealthtrack-pro
chmod +x deploy-full.sh
./deploy-full.sh
```

**部署后访问：**
- 前端：`http://your-server-ip:3000`
- 后端API：`http://your-server-ip:3001/api`

**详细说明：** 查看 [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🏗️ 技术架构

### 前端技术栈
- **框架**：React 19 + TypeScript
- **构建工具**：Vite 6
- **UI库**：Tailwind CSS
- **图表**：Recharts
- **图标**：Lucide React

### 后端技术栈
- **运行时**：Node.js + Express
- **数据存储**：文件系统（JSON）
- **进程管理**：PM2
- **AI服务**：Google Gemini API

### 架构图

```
┌─────────────────┐
│   浏览器/手机    │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌────────┐
│ React  │ │Express │
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

## 📁 项目结构

```
wealthtrack-pro/
├── App.tsx                      # 主应用组件
├── components/
│   └── Icon.tsx                 # 图标组件
├── services/
│   ├── geminiService.ts         # AI分析服务
│   └── serverStorageService.ts  # 服务器存储服务
├── server.js                    # 后端API服务器
├── types.ts                     # TypeScript类型定义
├── constants.tsx                # 常量配置
├── deploy-full.sh               # 完整部署脚本
├── deploy-simple.sh             # 简化部署脚本
├── DEPLOYMENT.md                # 详细部署文档
├── QUICKSTART.md                # 快速开始指南
└── package.json
```

---

## 🔧 环境变量配置

创建 `.env.local` 文件：

```bash
# Gemini API Key（用于AI分析功能）
GEMINI_API_KEY=your_gemini_api_key_here

# 前端API地址
VITE_API_URL=http://localhost:3001/api

# 后端服务端口
PORT=3001
```

**获取Gemini API Key：** https://ai.google.dev/

---

## 💾 数据存储方案

### 本地存储
- 使用 `localStorage` 实现离线功能
- 数据在浏览器本地持久化

### 服务器存储（v2.0新增）
- 每个用户分配唯一ID
- 数据存储为独立JSON文件
- 支持跨设备同步
- 完全掌控数据安全

**数据目录结构：**
```
user-data/
├── a3f2c8b9e1d4f5a7.json  # 用户1数据
├── b2c4d6e8f0a1b3c5.json  # 用户2数据
└── ...
```

---

## 📊 使用示例

### 1. 创建多个账户
- 美股投资账户（追踪纳斯达克股票）
- A股账户（追踪国内股票）
- 房产账户（记录房产租金+增值）
- 储蓄账户（定期存款）

### 2. 添加资产
```
资产名称：腾讯控股
投资路径：股票市场
币种：HKD
金额：10000
年化收益率：8.5%
```

### 3. 跨设备同步
- 电脑端备份数据 → 生成用户ID
- 手机端输入用户ID → 同步数据
- 数据实时保持一致

---

## 🛠️ 开发命令

```bash
# 开发模式
npm run dev              # 启动前端（Vite）
npm run dev:server       # 启动后端（Express）
npm run dev:all          # 同时启动前后端

# 生产构建
npm run build            # 构建前端
npm run preview          # 预览生产版本

# 后端服务
npm run start:server     # 启动后端服务
```

---

## 🔐 安全性

- ✅ 数据完全存储在自己的VPS
- ✅ 每个用户独立ID，数据隔离
- ✅ 支持HTTPS加密传输
- ✅ 不依赖第三方数据服务
- ✅ 可配置Nginx IP白名单

---

## 📈 功能路线图

- [x] 多用户账户管理
- [x] 多币种支持
- [x] 房地产细分收益率
- [x] AI投资分析
- [x] 服务器端数据存储
- [x] 跨设备同步
- [ ] 导出Excel报表
- [ ] 历史数据追踪
- [ ] 预算管理模块
- [ ] 移动端PWA支持

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [React](https://reactjs.org/) - UI框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Recharts](https://recharts.org/) - 图表库
- [Lucide](https://lucide.dev/) - 图标库
- [Google Gemini](https://ai.google.dev/) - AI服务

---

## 📞 联系方式

- **问题反馈**：[GitHub Issues](https://github.com/your-username/wealthtrack-pro/issues)
- **功能建议**：[GitHub Discussions](https://github.com/your-username/wealthtrack-pro/discussions)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个Star！**

Made with ❤️ by WealthTrack Team

</div>
