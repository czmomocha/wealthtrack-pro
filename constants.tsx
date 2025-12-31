
import { Currency, InvestmentPath } from './types';

export const INITIAL_CURRENCIES: Currency[] = [
  { code: 'CNY', symbol: '¥', rateToCNY: 1 },
  { code: 'USD', symbol: '$', rateToCNY: 7.23 },
  { code: 'HKD', symbol: 'HK$', rateToCNY: 0.92 }
];

export const INITIAL_PATHS: InvestmentPath[] = [
  { id: '1', name: '定期存款', icon: 'PiggyBank' },
  { id: '2', name: '股票市场', icon: 'TrendingUp' },
  { id: '3', name: '债券基金', icon: 'FileText' },
  { id: '4', name: '房地产', icon: 'Home' },
  { id: '5', name: '数字货币', icon: 'Bitcoin' },
  { id: '6', name: '黄金/大宗', icon: 'Coins' }
];

export const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
