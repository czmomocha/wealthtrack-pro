# 🚀 部署脚本执行说明

## 📖 智能路径检测

所有部署脚本现在支持**智能路径检测**，可以在任何位置执行：

### 场景1：在项目目录内执行（推荐）✅

```bash
# 克隆或进入项目目录
cd /data/services/wealthtrack-pro

# 直接执行脚本（会自动检测当前目录）
./deploy-full.sh
```

**执行结果：**
```
✓ 检测到当前目录是项目根目录: /data/services/wealthtrack-pro
🚀 开始部署 WealthTrack Pro 完整服务...
[1/6] 停止当前服务...
[2/6] 更新代码...
检测到当前目录已是项目仓库，执行更新...
✓ 代码已更新到最新版本
```

### 场景2：在其他目录执行

```bash
# 在任意目录执行
cd /root
/data/services/wealthtrack-pro/deploy-full.sh
```

**执行结果：**
```
→ 使用默认项目目录: /root/wealthtrack-pro
🚀 开始部署 WealthTrack Pro 完整服务...
[2/6] 更新代码...
首次部署，克隆仓库...
```

---

## 🎯 推荐使用方法

### 方法1：标准部署（推荐）

```bash
# 1. 克隆项目到任意目录
cd /data/services
git clone https://github.com/czmomocha/wealthtrack-pro.git
cd wealthtrack-pro

# 2. 赋予执行权限
chmod +x deploy-full.sh

# 3. 直接执行（脚本会自动识别当前目录）
./deploy-full.sh
```

### 方法2：首次快速部署

```bash
# 直接在任意目录执行，脚本会自动克隆到 $HOME/wealthtrack-pro
cd ~
curl -O https://raw.githubusercontent.com/czmomocha/wealthtrack-pro/master/deploy-full.sh
chmod +x deploy-full.sh
./deploy-full.sh
```

---

## 🔄 更新部署

### 如果你已经克隆了代码

```bash
# 进入项目目录
cd /data/services/wealthtrack-pro

# 直接执行脚本（会自动git pull）
./deploy-full.sh
```

**脚本会自动：**
1. ✅ 检测到当前目录是项目
2. ✅ 检查是否是git仓库
3. ✅ 保存本地修改（git stash）
4. ✅ 拉取最新代码（git pull）
5. ✅ 重新构建和部署

### 不会再出现：
- ❌ 要求输入GitHub用户名/密码
- ❌ 重复克隆代码
- ❌ 路径冲突

---

## 🛠️ 脚本工作原理

### 智能检测逻辑

```bash
# 1. 检测当前目录是否是项目根目录
if [ -f "package.json" ] && [ -f "server.js" ]; then
    PROJECT_DIR="$(pwd)"  # 使用当前目录
else
    PROJECT_DIR="$HOME/wealthtrack-pro"  # 使用默认路径
fi

# 2. 检测是否需要克隆
if [ "$PROJECT_DIR" = "$(pwd)" ] && [ -d ".git" ]; then
    # 当前目录就是项目 → 直接更新
    git pull origin master
elif [ -d "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR/.git" ]; then
    # 项目目录存在 → 更新
    cd "$PROJECT_DIR"
    git pull origin master
else
    # 项目不存在 → 克隆
    git clone ...
fi
```

---

## 📊 不同场景对比

| 场景 | 原逻辑 | 新逻辑 |
|------|--------|--------|
| **已克隆代码，在项目内执行** | ❌ 尝试克隆到 $HOME，要求输入密码 | ✅ 自动识别并 git pull |
| **已克隆代码，在外部执行** | ❌ 克隆到 $HOME，路径冲突 | ✅ 自动找到已有项目并更新 |
| **首次部署，项目内执行** | ❌ 不支持 | ✅ 识别为首次，自动更新 |
| **首次部署，外部执行** | ✅ 克隆到 $HOME | ✅ 克隆到 $HOME |

---

## 🔍 故障排查

### 问题1：要求输入GitHub用户名

**原因：** 脚本尝试克隆新仓库，但你已经有代码了

**解决：**
```bash
# 方法1：在项目目录内执行
cd /data/services/wealthtrack-pro
./deploy-full.sh

# 方法2：检查是否是git仓库
cd /data/services/wealthtrack-pro
ls -la .git  # 如果不存在，重新初始化
git init
git remote add origin https://github.com/czmomocha/wealthtrack-pro.git
git fetch origin
git checkout -b master origin/master
```

### 问题2：路径冲突

**现象：** 脚本显示使用 `/root/wealthtrack-pro`，但你的代码在 `/data/services/wealthtrack-pro`

**解决：**
```bash
# 方法1：在正确的目录执行
cd /data/services/wealthtrack-pro
./deploy-full.sh

# 方法2：创建软链接
ln -s /data/services/wealthtrack-pro ~/wealthtrack-pro
cd ~
./wealthtrack-pro/deploy-full.sh
```

### 问题3：权限问题

**现象：** `Permission denied`

**解决：**
```bash
# 赋予执行权限
chmod +x deploy-full.sh
chmod +x deploy-simple.sh
chmod +x deploy.sh

# 如果是root用户，确保文件所有权
chown root:root deploy-*.sh
```

---

## 📝 执行日志示例

### 成功更新（在项目内执行）

```bash
[root@VM-0-6-centos wealthtrack-pro]# ./deploy-full.sh
✓ 检测到当前目录是项目根目录: /data/services/wealthtrack-pro
🚀 开始部署 WealthTrack Pro 完整服务...
[1/6] 停止当前服务...
✓ PM2服务已停止
[2/6] 更新代码...
检测到当前目录已是项目仓库，执行更新...
Saved working directory and index state WIP on master: abc1234 feat: update
From https://github.com/czmomocha/wealthtrack-pro
 * branch            master     -> FETCH_HEAD
Already up to date.
✓ 代码已更新到最新版本
[3/6] 配置环境变量...
✓ 环境变量已配置
[4/6] 安装依赖并构建前端...
...
✓ 前端构建完成
[5/6] 启动前后端服务...
✓ 服务已启动
[6/6] 部署完成！
======================================
  🎉 部署成功！
======================================
前端地址: http://xx.xx.xx.xx:3000
后端API:  http://xx.xx.xx.xx:3001/api
```

### 首次部署（外部执行）

```bash
[root@VM-0-6-centos ~]# ./deploy-full.sh
→ 使用默认项目目录: /root/wealthtrack-pro
🚀 开始部署 WealthTrack Pro 完整服务...
[1/6] 停止当前服务...
[2/6] 更新代码...
首次部署，克隆仓库...
Cloning into '/root/wealthtrack-pro'...
✓ 代码已克隆
[3/6] 配置环境变量...
...
```

---

## 🎯 最佳实践

### 1. 推荐的项目结构

```bash
/data/services/wealthtrack-pro/  # 或任意你喜欢的路径
├── deploy-full.sh
├── deploy-simple.sh
├── deploy.sh
├── server.js
├── package.json
└── ...
```

### 2. 推荐的执行方式

```bash
# 始终在项目目录内执行
cd /data/services/wealthtrack-pro
./deploy-full.sh
```

### 3. 定期更新

```bash
# 设置定时任务（每天凌晨2点自动更新）
crontab -e

# 添加
0 2 * * * cd /data/services/wealthtrack-pro && ./deploy-full.sh >> /var/log/wealthtrack-deploy.log 2>&1
```

---

## 📞 技术支持

如遇问题，请检查：
1. 当前工作目录：`pwd`
2. 是否是git仓库：`ls -la .git`
3. 项目文件是否存在：`ls package.json server.js`
4. 脚本执行权限：`ls -l deploy-*.sh`

**联系方式：**
- GitHub Issues: https://github.com/czmomocha/wealthtrack-pro/issues
- 文档：[DEPLOYMENT.md](DEPLOYMENT.md)
