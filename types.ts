
export interface TokenPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap?: number;
}

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export enum AuthMode {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  NONE = 'NONE'
}

export interface WalletToken {
  address: string;
  name: string;
  symbol: string;
  image: string;
  balance: number;
  balanceUsd: number;
  holdingPercent: number;
  holdingDuration: string;
  unrealizedProfit: number;
  unrealizedProfitPercent: number;
  totalProfit: number;
  totalProfitPercent: number;
  totalBuy: number;
  averageBuy: number;
  totalSell: number;
  averageSell: number;
  transactionCount: number;
  lastActive: string;
  price: string;
  marketCap?: number;
}

export interface WalletActivity {
  id: string;
  type: 'BUY' | 'SELL';
  token: {
    address: string;
    name: string;
    symbol: string;
    image: string;
  };
  marketCap: number;
  quantity: number;
  totalUsd: number;
  profit?: number;
  profitPercent?: number;
  duration: string;
  gasFee: number;
  timestamp: number;
}

export interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  authType: 'email' | 'metamask';
  balance: number; // USDT balance
  createdAt: number;
  lastLoginAt: number;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: User;
}
