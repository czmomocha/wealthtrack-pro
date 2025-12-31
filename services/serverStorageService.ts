/**
 * 服务器端数据存储服务
 * 替代 jsonblob.com，使用自建服务器存储用户数据
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ServerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: number;
}

/**
 * 注册/获取用户ID
 */
export async function registerUser(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result: ServerResponse = await response.json();
    
    if (!result.success || !result.userId) {
      throw new Error(result.error || '注册失败');
    }
    
    return result.userId;
  } catch (error) {
    console.error('Register error:', error);
    throw new Error('注册失败，请检查网络连接');
  }
}

/**
 * 上传数据到服务器
 */
export async function uploadToServer(userId: string, data: any): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/data/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data })
    });
    
    const result: ServerResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '上传失败');
    }
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('上传失败，请检查网络连接');
  }
}

/**
 * 从服务器下载数据
 */
export async function downloadFromServer(userId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/data/download/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result: ServerResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '下载失败');
    }
    
    return result.data;
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('下载失败，请检查用户ID是否正确');
  }
}

/**
 * 删除服务器数据
 */
export async function deleteFromServer(userId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/data/delete/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result: ServerResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '删除失败');
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error('删除失败，请检查网络连接');
  }
}

/**
 * 检查服务器状态
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET'
    });
    const result = await response.json();
    return result.status === 'ok';
  } catch (error) {
    console.error('Health check error:', error);
    return false;
  }
}
