/**
 * WealthTrack Pro - 后端API服务器
 * 功能：用户数据存储、多用户隔离
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'user-data');

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 确保数据目录存在
await fs.mkdir(DATA_DIR, { recursive: true });

// ============ 工具函数 ============

/**
 * 生成唯一用户ID（基于IP和时间戳）
 */
function generateUserId(req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const timestamp = Date.now();
  return crypto.createHash('sha256').update(`${ip}-${timestamp}`).digest('hex').substring(0, 16);
}

/**
 * 获取用户数据文件路径
 */
function getUserDataPath(userId) {
  return path.join(DATA_DIR, `${userId}.json`);
}

/**
 * 验证数据格式
 */
function validateUserData(data) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.users)) return false;
  if (!Array.isArray(data.assets)) return false;
  if (!Array.isArray(data.currencies)) return false;
  if (!Array.isArray(data.paths)) return false;
  return true;
}

// ============ API 路由 ============

/**
 * 注册/获取用户ID
 * POST /api/auth/register
 */
app.post('/api/auth/register', (req, res) => {
  const userId = generateUserId(req);
  res.json({ 
    success: true, 
    userId,
    message: '用户ID已生成，请妥善保存'
  });
});

/**
 * 上传用户数据
 * POST /api/data/upload
 * Body: { userId, data: { users, assets, currencies, paths, activeUserId, version } }
 */
app.post('/api/data/upload', async (req, res) => {
  try {
    const { userId, data } = req.body;

    if (!userId || !data) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    if (!validateUserData(data)) {
      return res.status(400).json({ success: false, error: '数据格式错误' });
    }

    // 添加服务器时间戳
    const savedData = {
      ...data,
      serverTimestamp: Date.now(),
      version: data.version || '2.0'
    };

    const filePath = getUserDataPath(userId);
    await fs.writeFile(filePath, JSON.stringify(savedData, null, 2), 'utf8');

    res.json({ 
      success: true, 
      message: '数据已保存到服务器',
      timestamp: savedData.serverTimestamp
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * 下载用户数据
 * GET /api/data/download/:userId
 */
app.get('/api/data/download/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const filePath = getUserDataPath(userId);

    try {
      const data = await fs.readFile(filePath, 'utf8');
      const parsedData = JSON.parse(data);
      
      res.json({ 
        success: true, 
        data: parsedData,
        timestamp: parsedData.serverTimestamp
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ 
          success: false, 
          error: '未找到数据，请先上传' 
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * 删除用户数据
 * DELETE /api/data/delete/:userId
 */
app.delete('/api/data/delete/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const filePath = getUserDataPath(userId);

    await fs.unlink(filePath);
    res.json({ success: true, message: '数据已删除' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, error: '数据不存在' });
    }
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * 健康检查
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/**
 * 获取统计信息（管理员）
 * GET /api/stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const userCount = files.filter(f => f.endsWith('.json')).length;
    
    res.json({
      success: true,
      stats: {
        totalUsers: userCount,
        dataDirectory: DATA_DIR
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   WealthTrack Pro API Server          ║
╠════════════════════════════════════════╣
║   服务地址: http://localhost:${PORT}    ║
║   数据目录: ${DATA_DIR}
║   状态: 运行中                          ║
╚════════════════════════════════════════╝
  `);
});

export default app;
