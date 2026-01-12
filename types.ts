
export enum CurrencyType {
  CNY = 'CNY',
  USD = 'USD',
  HKD = 'HKD',
  CUSTOM = 'CUSTOM'
}

export interface User {
  id: string;
  name: string;
  createdAt: number;
}

export interface Currency {
  code: string;
  symbol: string;
  rateToCNY: number;
}

export interface InvestmentPath {
  id: string;
  name: string;
  icon: string;
}

export interface Asset {
  id: string;
  userId: string; // Linked to User
  name: string;
  pathId: string;
  currencyCode: string;
  amount: number;
  annualYield: number;
  rentalYield?: number;
  appreciationRate?: number;
  note?: string;
  createdAt: number;
  isDebt?: boolean; // 标记是否为负债（贷款余额）
}

export interface PortfolioStats {
  totalValueCNY: number;
  totalProjectedYield: number;
  currencyDistribution: { name: string; value: number }[];
  pathDistribution: { name: string; value: number; avgYield: number }[];
}
