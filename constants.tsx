
import { Currency, InvestmentPath } from './types';

export const INITIAL_CURRENCIES: Currency[] = [
  { code: 'CNY', symbol: '¥', rateToCNY: 1 },
  { code: 'USD', symbol: '$', rateToCNY: 7.23 },
  { code: 'HKD', symbol: 'HK$', rateToCNY: 0.92 }
];

export const INITIAL_PATHS: InvestmentPath[] = [
  { id: '1', name: '定期存款', icon: 'PiggyBank' },
  { id: '2', name: 'A股市场', icon: 'TrendingUp' },
  { id: '3', name: '港股市场', icon: 'TrendingUp' },
  { id: '4', name: '美股市场', icon: 'TrendingUp' },
  { id: '5', name: '债券基金', icon: 'FileText' },
  { id: '6', name: '国内房产', icon: 'Home' },
  { id: '7', name: '海外房产', icon: 'Building2' },
  { id: '8', name: '数字货币', icon: 'Bitcoin' },
  { id: '9', name: '黄金/大宗', icon: 'Coins' },
  { id: '10', name: '货币基金', icon: 'DollarSign' },
  { id: '11', name: '贷款余额', icon: 'Minus' }
];

export const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
