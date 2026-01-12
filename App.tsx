
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  LayoutDashboard, 
  Settings, 
  Wallet, 
  PieChart as PieChartIcon, 
  X,
  Sparkles,
  RefreshCw,
  Globe,
  TrendingUp,
  Check,
  Building2,
  CloudUpload,
  CloudDownload,
  Copy,
  AlertCircle,
  Users as UsersIcon,
  UserPlus,
  ArrowRightLeft
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Asset, Currency, InvestmentPath, PortfolioStats, User } from './types';
import { INITIAL_CURRENCIES, INITIAL_PATHS, COLORS } from './constants';
import { analyzePortfolio } from './services/geminiService';
import { uploadToServer, downloadFromServer, registerUser, checkServerHealth } from './services/serverStorageService';
import Icon from './components/Icon';

const App: React.FC = () => {
  // --- Workspace State ---
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('wt_users');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: '我的主钱包', createdAt: Date.now() }];
  });
  const [activeUserId, setActiveUserId] = useState(() => localStorage.getItem('wt_active_user') || 'default');
  
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('wt_assets');
    return saved ? JSON.parse(saved) : [];
  });
  const [currencies, setCurrencies] = useState<Currency[]>(() => {
    const saved = localStorage.getItem('wt_currencies');
    return saved ? JSON.parse(saved) : INITIAL_CURRENCIES;
  });
  const [paths, setPaths] = useState<InvestmentPath[]>(() => {
    const saved = localStorage.getItem('wt_paths');
    return saved ? JSON.parse(saved) : INITIAL_PATHS;
  });

  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assets' | 'settings'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [syncCode, setSyncCode] = useState(() => localStorage.getItem('wt_sync_code') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState<string>('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Settings UI State
  const [showAddCurrencyForm, setShowAddCurrencyForm] = useState(false);
  const [showAddPathForm, setShowAddPathForm] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ code: '', symbol: '', rate: '' });
  const [newPathName, setNewPathName] = useState('');
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [editRate, setEditRate] = useState('');
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [pendingMigration, setPendingMigration] = useState<{ oldPathId: string; newPathIds: string[] }[]>([]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('wt_users', JSON.stringify(users));
    localStorage.setItem('wt_active_user', activeUserId);
    localStorage.setItem('wt_assets', JSON.stringify(assets));
    localStorage.setItem('wt_currencies', JSON.stringify(currencies));
    localStorage.setItem('wt_paths', JSON.stringify(paths));
    localStorage.setItem('wt_sync_code', syncCode);
  }, [users, activeUserId, assets, currencies, paths, syncCode]);

  // Path Migration Check
  useEffect(() => {
    const oldPaths = paths.filter(p => p.name === '股票市场' || p.name === '房地产');
    if (oldPaths.length > 0) {
      const migrations = oldPaths.map(p => {
        if (p.name === '股票市场') {
          return { oldPathId: p.id, newPathIds: ['2', '3', '4'] }; // A股, 港股, 美股
        } else if (p.name === '房地产') {
          return { oldPathId: p.id, newPathIds: ['6', '7'] }; // 国内房产, 海外房产
        }
        return { oldPathId: p.id, newPathIds: [] };
      });
      setPendingMigration(migrations);
      setShowMigrationModal(true);
    }
  }, []);

  // Derived: Current User's Assets
  const activeUser = useMemo(() => users.find(u => u.id === activeUserId) || users[0], [users, activeUserId]);
  const currentUserAssets = useMemo(() => assets.filter(a => a.userId === activeUserId), [assets, activeUserId]);

  // Formatting Helper
  const formatWan = (val: number) => {
    if (Math.abs(val) >= 10000) {
      return (val / 10000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '万';
    }
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculations (Specific to Current User)
  const stats: PortfolioStats = useMemo(() => {
    let totalValueCNY = 0;
    let weightedYieldSum = 0;
    const currMap: Record<string, number> = {};
    const pathStats: Record<string, { value: number; yieldWeight: number }> = {};

    currentUserAssets.forEach(a => {
      const curr = currencies.find(c => c.code === a.currencyCode) || currencies[0];
      const valCNY = a.amount * curr.rateToCNY;
      totalValueCNY += valCNY;

      // 贷款余额处理：如果是负债，收益率取反（贷款利息是支出）
      const effectiveYield = a.amount < 0 ? -a.annualYield : a.annualYield;
      weightedYieldSum += (valCNY * effectiveYield);

      currMap[a.currencyCode] = (currMap[a.currencyCode] || 0) + valCNY;

      const path = paths.find(p => p.id === a.pathId);
      const pathName = path?.name || '未知';
      if (!pathStats[pathName]) pathStats[pathName] = { value: 0, yieldWeight: 0 };
      pathStats[pathName].value += valCNY;
      pathStats[pathName].yieldWeight += (valCNY * effectiveYield);
    });

    return {
      totalValueCNY,
      totalProjectedYield: totalValueCNY > 0 ? weightedYieldSum / totalValueCNY : 0,
      currencyDistribution: Object.entries(currMap).map(([name, value]) => ({ name, value })),
      pathDistribution: Object.entries(pathStats).map(([name, stat]) => ({
        name,
        value: stat.value,
        avgYield: stat.value !== 0 ? stat.yieldWeight / stat.value : 0
      }))
    };
  }, [currentUserAssets, currencies, paths]);

  // Cloud Sync Handlers (使用自建服务器)
  const handleCloudUpload = async () => {
    setIsSyncing(true);
    const payload = { users, activeUserId, assets, currencies, paths, version: '2.0' };
    
    try {
      // 检查服务器健康状态
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        throw new Error('服务器连接失败');
      }

      let userId = syncCode;
      
      // 如果没有同步码，生成新的用户ID
      if (!userId) {
        userId = await registerUser();
        setSyncCode(userId);
      }
      
      // 上传数据到服务器
      await uploadToServer(userId, payload);
      
      alert(`✅ 数据已备份到服务器！\n\n您的用户ID: ${userId}\n\n请妥善保存此ID，其他设备可使用此ID同步数据。`);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`❌ 备份失败: ${error.message}\n\n请确保：\n1. 后端服务已启动\n2. API地址配置正确\n3. 网络连接正常`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudSync = async () => {
    if (!syncCode) return alert('请输入用户ID');
    setIsSyncing(true);
    
    try {
      // 检查服务器健康状态
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        throw new Error('服务器连接失败');
      }

      // 从服务器下载数据
      const data = await downloadFromServer(syncCode);
      
      if (confirm('⚠️ 同步将覆盖此设备上的所有数据，是否继续？')) {
        setUsers(data.users || [{ id: 'default', name: '我的主钱包', createdAt: Date.now() }]);
        setActiveUserId(data.activeUserId || 'default');
        setAssets(data.assets || []);
        setCurrencies(data.currencies || INITIAL_CURRENCIES);
        setPaths(data.paths || INITIAL_PATHS);
        
        const timestamp = data.serverTimestamp 
          ? new Date(data.serverTimestamp).toLocaleString('zh-CN')
          : '未知';
        
        alert(`✅ 同步成功！\n\n数据更新时间: ${timestamp}`);
      }
    } catch (error: any) {
      console.error('Download error:', error);
      alert(`❌ 同步失败: ${error.message}\n\n请检查：\n1. 用户ID是否正确\n2. 服务器是否已保存数据\n3. 网络连接是否正常`);
    } finally {
      setIsSyncing(false);
    }
  };

  // User Management Handlers
  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get('userName') as string;
    const copyBaseAssets = new FormData(e.currentTarget).get('copyBaseAssets') === 'on';
    
    if (!name) return;
    
    const newUser: User = { id: Date.now().toString(), name, createdAt: Date.now() };
    
    let newAssets = [...assets];
    
    if (copyBaseAssets && users.length > 0) {
      const baseWallet = users[0];
      const baseAssets = assets.filter(a => a.userId === baseWallet.id);
      
      if (baseAssets.length > 0) {
        const copiedAssets = baseAssets.map(asset => ({
          ...asset,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          userId: newUser.id,
          createdAt: Date.now()
        }));
        newAssets = [...assets, ...copiedAssets];
      }
    }
    
    setUsers([...users, newUser]);
    setAssets(newAssets);
    setActiveUserId(newUser.id);
    setShowAddUserModal(false);
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) return alert('请至少保留一个用户。');
    if (confirm(`确定要删除用户 "${users.find(u => u.id === id)?.name}" 吗？该用户下的所有资产也将被清空。`)) {
      setUsers(users.filter(u => u.id !== id));
      setAssets(assets.filter(a => a.userId !== id));
      if (activeUserId === id) setActiveUserId(users[0].id);
    }
  };

  // Asset Handlers
  const openAddModal = () => {
    setEditingAsset(null);
    setSelectedPathId(paths[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pathId = formData.get('pathId') as string;
    const pathName = paths.find(p => p.id === pathId)?.name || '';
    const isRealEstate = pathName === '房地产' || pathName === '房产' || pathName === '国内房产' || pathName === '海外房产';
    const isLoan = pathName === '贷款余额';
    const amount = parseFloat(formData.get('amount') as string);

    let annualYield = 0;
    let rentalYield = undefined;
    let appreciationRate = undefined;

    if (isRealEstate) {
      rentalYield = parseFloat(formData.get('rentalYield') as string) || 0;
      appreciationRate = parseFloat(formData.get('appreciationRate') as string) || 0;
      annualYield = rentalYield + appreciationRate;
    } else if (isLoan) {
      // 贷款余额：用户输入正数表示贷款金额，收益率输入正数表示利息支出
      annualYield = parseFloat(formData.get('annualYield') as string) || 0;
    } else {
      annualYield = parseFloat(formData.get('annualYield') as string) || 0;
    }

    const newAsset: Asset = {
      id: editingAsset?.id || Date.now().toString(),
      userId: activeUserId,
      name: formData.get('name') as string,
      pathId: pathId,
      currencyCode: formData.get('currencyCode') as string,
      amount: amount,
      annualYield,
      rentalYield,
      appreciationRate,
      createdAt: editingAsset?.createdAt || Date.now(),
      isDebt: isLoan || amount < 0
    };

    if (editingAsset) {
      setAssets(assets.map(a => a.id === editingAsset.id ? newAsset : a));
    } else {
      setAssets([...assets, newAsset]);
    }
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  const handleAIInsight = async () => {
    if (currentUserAssets.length === 0) return alert('当前账户暂无资产，无法分析');
    setIsAIAnalyzing(true);
    const insight = await analyzePortfolio(currentUserAssets, currencies, paths);
    setAiInsight(insight);
    setIsAIAnalyzing(false);
  };

  const submitAddCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    const { code, symbol, rate } = newCurrency;
    const upperCode = code.toUpperCase();
    if (!upperCode || !rate) return;
    setCurrencies([...currencies, { code: upperCode, symbol: symbol || upperCode, rateToCNY: parseFloat(rate) }]);
    setNewCurrency({ code: '', symbol: '', rate: '' });
    setShowAddCurrencyForm(false);
  };

  const updateCurrencyRate = (code: string, newRate: number) => {
    setCurrencies(currencies.map(c => 
      c.code === code 
        ? { ...c, rateToCNY: newRate }
        : c
    ));
    setEditingCurrency(null);
    setEditRate('');
  };

  const startEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setEditRate(currency.rateToCNY.toString());
  };

  const cancelEditCurrency = () => {
    setEditingCurrency(null);
    setEditRate('');
  };

  const submitAddPath = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPathName.trim()) return;
    setPaths([...paths, { id: Date.now().toString(), name: newPathName.trim(), icon: 'Target' }]);
    setNewPathName('');
    setShowAddPathForm(false);
  };

  const handlePathMigration = () => {
    let newAssets = [...assets];
    let assetsToMigrate = 0;

    pendingMigration.forEach(migration => {
      const affectedAssets = assets.filter(a => a.pathId === migration.oldPathId);
      assetsToMigrate += affectedAssets.length;

      affectedAssets.forEach((asset, index) => {
        if (migration.newPathIds.length > 0) {
          const newPathId = migration.newPathIds[index % migration.newPathIds.length];
          const assetIndex = newAssets.findIndex(a => a.id === asset.id);
          if (assetIndex !== -1) {
            newAssets[assetIndex] = { ...newAssets[assetIndex], pathId: newPathId };
          }
        }
      });
    });

    const newPathList = paths.filter(p => p.name !== '股票市场' && p.name !== '房地产');
    setPaths(newPathList);
    setAssets(newAssets);
    setShowMigrationModal(false);
    setPendingMigration([]);

    alert(`迁移完成！\n\n已将 ${assetsToMigrate} 项资产迁移到新的投资路径：\n- 股票市场 → A股/港股/美股市场\n- 房地产 → 国内房产/海外房产`);
  };

  const cancelMigration = () => {
    setShowMigrationModal(false);
    setPendingMigration([]);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 space-y-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
            <Wallet className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">WealthTrack</h1>
        </div>
        
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}><LayoutDashboard size={20} />总览</button>
          <button onClick={() => setActiveTab('assets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'assets' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}><PieChartIcon size={20} />资产列表</button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}><Settings size={20} />配置中心</button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden group">
            <Sparkles className="absolute -top-1 -right-1 text-white/20 group-hover:scale-125 transition-transform" size={60} />
            <p className="text-xs font-medium text-blue-100 mb-1">AI 顾问</p>
            <p className="text-sm mb-4 leading-relaxed">分析 "{activeUser?.name}" 的投资组合</p>
            <button onClick={handleAIInsight} disabled={isAIAnalyzing} className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
              {isAIAnalyzing ? <RefreshCw className="animate-spin" size={14} /> : '开始分析'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Wallet className="text-blue-600" size={24} /><span className="font-bold">WealthTrack</span></div>
          <button onClick={openAddModal} className="p-2 bg-blue-600 text-white rounded-lg"><Plus size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* User Selector Section */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <UsersIcon size={20} className="text-blue-500" />
                    账户切换
                  </div>
                  <button 
                    onClick={() => setShowAddUserModal(true)} 
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <UserPlus size={14} /> 新增账户
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {users.map(u => (
                    <div 
                      key={u.id}
                      className={`relative group flex items-center gap-2 pl-4 pr-2 py-2 rounded-xl border transition-all cursor-pointer ${activeUserId === u.id ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300'}`}
                      onClick={() => setActiveUserId(u.id)}
                    >
                      <span className="text-sm font-semibold">{u.name}</span>
                      {users.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteUser(u.id); }}
                          className={`p-1 rounded-md transition-colors ${activeUserId === u.id ? 'hover:bg-blue-500 text-blue-100' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    {activeUser?.name} 的总览
                    <span className="text-xs font-normal bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">当前账户</span>
                  </h2>
                  <p className="text-slate-500 text-sm">该账户下共有 {currentUserAssets.length} 项资产</p>
                </div>
                <button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all"><Plus size={18} />添加资产</button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-sm mb-1">净资产价值 (折合CNY)</p>
                  <span className={`text-3xl font-bold ${stats.totalValueCNY < 0 ? 'text-red-500' : ''}`}>
                    {stats.totalValueCNY < 0 ? '-' : ''}¥{formatWan(Math.abs(stats.totalValueCNY))}
                  </span>
                  {currentUserAssets.some(a => a.amount < 0) && (
                    <p className="text-xs text-red-400 mt-1">含负债资产</p>
                  )}
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p className="text-slate-500 text-sm mb-1">预期加权年化</p><span className={`text-3xl font-bold ${stats.totalProjectedYield < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{stats.totalProjectedYield.toFixed(2)}%</span></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><p className="text-slate-500 text-sm mb-1">预期年化收益</p><span className={`text-3xl font-bold ${stats.totalValueCNY * stats.totalProjectedYield / 100 < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{stats.totalValueCNY * stats.totalProjectedYield / 100 < 0 ? '-' : ''}¥{formatWan(Math.abs(stats.totalValueCNY * stats.totalProjectedYield / 100))}</span></div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[350px]">
                  <h3 className="text-md font-bold mb-4 flex items-center gap-2"><Globe size={18} className="text-blue-500" />币种占比</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.currencyDistribution.filter(c => c.value > 0)}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.currencyDistribution.filter(c => c.value > 0).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => `¥${formatWan(v)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {stats.currencyDistribution.some(c => c.value < 0) && (
                    <p className="text-xs text-red-400 text-center mt-2">* 含负值资产，已在图表中隐藏</p>
                  )}
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[350px]">
                  <h3 className="text-md font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500" />收益率与金额分布</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.pathDistribution} layout="vertical">
                        <XAxis type="number" hide /><YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: any, n: string) => {
                          if (n === 'value') {
                            const val = v as number;
                            return val < 0 ? `-¥${formatWan(Math.abs(val))}` : `¥${formatWan(v)}`;
                          }
                          return `${v.toFixed(2)}%`;
                        }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {stats.pathDistribution.map((entry, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={entry.value < 0 ? '#ef4444' : COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {aiInsight && (
                <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2 text-blue-600 font-bold"><Sparkles size={20} />AI 智能分析报告 ({activeUser.name})</div><button onClick={() => setAiInsight(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
                  <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">{aiInsight}</div>
                </div>
              )}
            </div>
          )}

          {/* Assets List View */}
          {activeTab === 'assets' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">资产明细 ({activeUser.name})</h2><button onClick={openAddModal} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"><Plus size={16} />新增资产</button></div>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr><th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">资产名称</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">路径</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">金额</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">折合(CNY)</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">预期收益</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">明细</th><th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">操作</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentUserAssets.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">当前账户暂无资产，请点击右上角新增。</td></tr> : currentUserAssets.map(asset => {
                        const currency = currencies.find(c => c.code === asset.currencyCode) || currencies[0];
                        const path = paths.find(p => p.id === asset.pathId);
                        const isRealEstate = path?.name === '房地产' || path?.name === '房产' || path?.name === '国内房产' || path?.name === '海外房产';
                        const isLoan = path?.name === '贷款余额';
                        const isDebt = asset.amount < 0 || asset.isDebt;
                        const displayAmount = Math.abs(asset.amount);
                        const displayYield = asset.amount < 0 ? -asset.annualYield : asset.annualYield;
                        return (
                          <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium">{asset.name}</td>
                            <td className="px-6 py-4 text-xs"><span className={`px-2 py-1 rounded-full ${isLoan ? 'bg-orange-100 text-orange-700' : isDebt ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>{path?.name || '未知'}</span></td>
                            <td className={`px-6 py-4 font-mono text-sm ${isDebt ? 'text-red-500' : ''}`}>{currency.symbol}{displayAmount.toLocaleString()}{isDebt && <span className="text-xs ml-1 opacity-75">(贷)</span>}</td>
                            <td className={`px-6 py-4 font-mono text-sm ${isDebt ? 'text-red-500' : ''}`}>¥{formatWan(Math.abs(asset.amount) * currency.rateToCNY)}{isDebt && <span className="text-xs ml-1 opacity-75">(负)</span>}</td>
                            <td className={`px-6 py-4 ${isDebt ? 'text-red-500' : 'text-emerald-600'} font-bold`}>{displayYield.toFixed(2)}%</td>
                            <td className="px-6 py-4 text-[10px] text-slate-400">{isRealEstate ? `租:${asset.rentalYield}% 估:${asset.appreciationRate}%` : '-'}</td>
                            <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => { setEditingAsset(asset); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit3 size={16} /></button><button onClick={() => { if(confirm('删除？')) setAssets(assets.filter(a=>a.id!==asset.id)); }} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button></div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"><h3 className="text-xl font-bold flex items-center gap-2"><RefreshCw className={isSyncing ? "animate-spin" : ""} size={24} />服务器数据同步</h3><p className="text-blue-100 text-sm mt-1">跨设备同步，数据存储在您的VPS服务器上</p></div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div className="font-bold text-slate-700 flex items-center gap-2"><CloudUpload size={18} className="text-blue-600" />备份到服务器</div>
                    <p className="text-xs text-slate-500">上传后生成唯一的用户ID。之后在其他设备输入该ID即可同步。</p>
                    <button onClick={handleCloudUpload} disabled={isSyncing} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">{isSyncing ? "上传中..." : "备份当前数据"}</button>
                    {syncCode && <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"><div><p className="text-[10px] uppercase text-slate-400 font-bold">用户ID</p><p className="font-mono font-bold text-blue-600 truncate">{syncCode}</p></div><button onClick={() => { navigator.clipboard.writeText(syncCode); alert('已复制'); }} className="p-2 text-slate-400 hover:text-blue-600"><Copy size={18} /></button></div>}
                  </div>
                  <div className="space-y-4">
                    <div className="font-bold text-slate-700 flex items-center gap-2"><CloudDownload size={18} className="text-emerald-600" />从服务器同步</div>
                    <p className="text-xs text-slate-500">输入您的用户ID，从服务器恢复或同步数据。</p>
                    <div className="flex gap-2"><input placeholder="用户ID" className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={syncCode} onChange={e => setSyncCode(e.target.value)} /><button onClick={handleCloudSync} disabled={isSyncing} className="px-6 bg-emerald-600 text-white rounded-xl font-bold">同步</button></div>
                    <div className="p-3 bg-amber-50 text-amber-700 text-[10px] rounded-xl flex items-start gap-2"><AlertCircle size={14} className="shrink-0" />同步将覆盖本地数据。首次使用需先在服务器部署后端API服务。</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Currency Manager */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><h3 className="text-lg font-bold flex items-center gap-2"><Globe size={18} className="text-blue-500" />币种汇率管理</h3><button onClick={() => setShowAddCurrencyForm(!showAddCurrencyForm)} className="text-xs font-bold text-blue-600">{showAddCurrencyForm ? '取消' : '新增'}</button></div>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {showAddCurrencyForm && <form onSubmit={submitAddCurrency} className="p-4 bg-blue-50/30 border-b border-blue-100 flex flex-col gap-3"><input placeholder="代码 (如: EUR)" className="px-3 py-2 border rounded-lg text-sm" value={newCurrency.code} onChange={e => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})} /><div className="flex gap-2"><input type="number" step="any" placeholder="对CNY汇率" className="flex-1 px-3 py-2 border rounded-lg text-sm" value={newCurrency.rate} onChange={e => setNewCurrency({...newCurrency, rate: e.target.value})} /><button type="submit" className="bg-blue-600 text-white px-4 rounded-lg"><Check size={16} /></button></div></form>}
                    <div className="divide-y">
                      {currencies.map(c => {
                        const isEditing = editingCurrency?.code === c.code;
                        return (
                          <div key={c.code} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-xs">{c.code}</div>
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    step="any" 
                                    autoFocus
                                    className="px-2 py-1 border rounded-lg text-sm w-32 outline-none focus:ring-2 focus:ring-blue-500" 
                                    value={editRate} 
                                    onChange={e => setEditRate(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const newRate = parseFloat(editRate);
                                        if (newRate > 0) updateCurrencyRate(c.code, newRate);
                                      }
                                    }}
                                  />
                                  <button 
                                    onClick={() => {
                                      const newRate = parseFloat(editRate);
                                      if (newRate > 0) updateCurrencyRate(c.code, newRate);
                                    }}
                                    className="p-1 text-emerald-600 hover:text-emerald-700"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button 
                                    onClick={cancelEditCurrency}
                                    className="p-1 text-slate-400 hover:text-slate-600"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm font-semibold">
                                    1 {c.code} = {c.rateToCNY} CNY
                                  </p>
                                </div>
                              )}
                            </div>
                            {!isEditing && (
                              <div className="flex gap-2">
                                {c.code !== 'CNY' && (
                                  <button 
                                    onClick={() => startEditCurrency(c)}
                                    className="p-1 text-slate-300 hover:text-blue-600"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                )}
                                {c.code !== 'CNY' && (
                                  <button 
                                    onClick={() => setCurrencies(currencies.filter(cur => cur.code !== c.code))}
                                    className="text-slate-300 hover:text-red-500"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {/* Path Manager */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><h3 className="text-lg font-bold flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500" />投资路径</h3><button onClick={() => setShowAddPathForm(!showAddPathForm)} className="text-xs font-bold text-blue-600">{showAddPathForm ? '取消' : '新增'}</button></div>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {showAddPathForm && <form onSubmit={submitAddPath} className="p-4 bg-emerald-50/30 border-b border-emerald-100 flex gap-2"><input placeholder="路径名称" className="flex-1 px-3 py-2 border rounded-lg text-sm" value={newPathName} onChange={e => setNewPathName(e.target.value)} /><button type="submit" className="bg-emerald-600 text-white px-4 rounded-lg"><Check size={16} /></button></form>}
                    <div className="divide-y">{paths.map(p => <div key={p.id} className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Icon name={p.icon} size={18} /></div><span className="text-sm font-semibold">{p.name}</span></div><button onClick={() => setPaths(paths.filter(path => path.id !== p.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></div>)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between shrink-0">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutDashboard size={20} /><span className="text-[10px]">总览</span></button>
          <button onClick={() => setActiveTab('assets')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'assets' ? 'text-blue-600' : 'text-slate-400'}`}><PieChartIcon size={20} /><span className="text-[10px]">资产</span></button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}><Settings size={20} /><span className="text-[10px]">设置</span></button>
        </nav>
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50"><h3 className="font-bold">新增账户</h3><button onClick={() => setShowAddUserModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 mb-1.5">账户名称</label><input autoFocus name="userName" required placeholder="例如：美股账户、家庭储备" className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              {users.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <input 
                    type="checkbox" 
                    name="copyBaseAssets" 
                    defaultChecked={true}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-700">复制基础钱包资产</p>
                    <p className="text-[10px] text-slate-500">将"{users[0].name}"的所有资产复制到新钱包</p>
                  </div>
                </div>
              )}
              <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2"><Check size={18} />确认创建</button>
            </form>
          </div>
        </div>
      )}

      {/* Asset Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50"><h3 className="font-bold text-lg">{editingAsset ? '编辑资产' : '添加资产'}</h3><button onClick={() => setIsModalOpen(false)}><X size={20} /></button></div>
            <form onSubmit={handleSaveAsset} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">名称</label><input name="name" required defaultValue={editingAsset?.name} placeholder="如: 腾讯控股, 曼谷公寓" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">路径</label><select name="pathId" value={selectedPathId} onChange={(e)=>setSelectedPathId(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500">{paths.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">币种</label><select name="currencyCode" defaultValue={editingAsset?.currencyCode} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">{currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">金额</label><input name="amount" type="number" step="0.01" required defaultValue={editingAsset?.amount} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="正数为资产，负数为贷款" /></div>
              {(paths.find(p => p.id === selectedPathId)?.name === '房地产' || paths.find(p => p.id === selectedPathId)?.name === '房产' || paths.find(p => p.id === selectedPathId)?.name === '国内房产' || paths.find(p => p.id === selectedPathId)?.name === '海外房产') ? (
                <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-bold text-slate-500 mb-1">租金收益率 (%)</label><input name="rentalYield" type="number" step="0.01" required defaultValue={editingAsset?.rentalYield || 0} className="w-full px-3 py-2 border rounded-lg bg-white" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-500 mb-1">估值变化率 (%)</label><input name="appreciationRate" type="number" step="0.01" required defaultValue={editingAsset?.appreciationRate || 0} className="w-full px-3 py-2 border rounded-lg bg-white" /></div>
                  </div>
                </div>
              ) : (
                <div><label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">预期年化 (%)</label><input name="annualYield" type="number" step="0.01" required defaultValue={editingAsset?.annualYield} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
              )}
              <div className="pt-4"><button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"><Check size={18} />保存</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Path Migration Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-amber-50/50">
              <h3 className="font-bold text-amber-700 flex items-center gap-2">
                <AlertCircle size={20} />
                投资路径更新
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-700 leading-relaxed">
                我们已更新投资路径以提供更细致的分类。检测到您的资产使用了旧的路径分类：
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 font-bold text-sm">1</div>
                  <div>
                    <p className="font-semibold text-slate-800">股票市场</p>
                    <p className="text-xs text-slate-600">→ 拆分为：A股市场、港股市场、美股市场</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 font-bold text-sm">2</div>
                  <div>
                    <p className="font-semibold text-slate-800">房地产</p>
                    <p className="text-xs text-slate-600">→ 拆分为：国内房产、海外房产</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                💡 您的资产将自动分配到新路径（循环分配），之后可在资产列表中手动调整。
              </p>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handlePathMigration}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  立即迁移
                </button>
                <button 
                  onClick={cancelMigration}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  暂不迁移
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
