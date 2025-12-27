import { WalletToken, WalletActivity } from '../types';
import { getPairsByAddress, searchPairs } from './dexScreener';

// Mock wallet tokens data
export const getMockWalletTokens = async (walletAddress: string): Promise<WalletToken[]> => {
  // Generate mock tokens
  const mockTokens = [
    { name: '中国时代', symbol: 'CHINA', address: '0x0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a' },
    { name: 'BOB', symbol: 'BOB', address: '0x9595959595959595959595959595959595959595' },
    { name: 'Ronin', symbol: 'RONIN', address: '0x1234567890123456789012345678901234567890' },
    { name: 'Aave', symbol: 'AAVE', address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
    { name: 'Bitcoin', symbol: 'BTC', address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c' },
    { name: 'Ethereum', symbol: 'ETH', address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8' },
  ];

  // Try to get real price data from API
  const tokensWithRealData = await Promise.all(
    mockTokens.map(async (token) => {
      let price = '0.003165';
      let marketCap = 0;
      
      try {
        const pairs = await searchPairs(token.symbol);
        if (pairs.length > 0) {
          const bestPair = pairs
            .filter(p => p.chainId === 'bsc' || p.dexId?.toLowerCase().includes('pancakeswap'))
            .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))[0] || pairs[0];
          
          price = bestPair.priceUsd || price;
          marketCap = bestPair.marketCap || bestPair.fdv || 0;
        }
      } catch (e) {
        // Use mock data if API fails
      }

      const balance = Math.random() * 1000000;
      const priceNum = parseFloat(price);
      const balanceUsd = balance * priceNum;
      const totalBuy = balanceUsd * (1 + Math.random() * 0.1);
      const totalSell = balanceUsd * (0.3 + Math.random() * 0.2);
      const unrealizedProfit = balanceUsd - totalBuy + totalSell;
      const totalProfit = unrealizedProfit + (totalSell - totalBuy * 0.7);

      return {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        image: `https://assets.coingecko.com/coins/images/${Math.floor(Math.random() * 30000)}/large/${token.symbol.toLowerCase()}.png`,
        balance,
        balanceUsd,
        holdingPercent: Math.random() * 20,
        holdingDuration: `${Math.floor(Math.random() * 60)}m`,
        unrealizedProfit,
        unrealizedProfitPercent: (unrealizedProfit / totalBuy) * 100,
        totalProfit,
        totalProfitPercent: (totalProfit / totalBuy) * 100,
        totalBuy,
        averageBuy: totalBuy / (Math.floor(Math.random() * 10) + 1),
        totalSell,
        averageSell: totalSell / (Math.floor(Math.random() * 5) + 1),
        transactionCount: Math.floor(Math.random() * 50) + 10,
        lastActive: `${Math.floor(Math.random() * 24)}h`,
        price: `$${priceNum.toFixed(8)}`,
        marketCap,
      };
    })
  );

  return tokensWithRealData;
};

// Mock wallet activities
export const getMockWalletActivities = async (walletAddress: string, limit: number = 50): Promise<WalletActivity[]> => {
  const mockTokens = [
    { name: '中国时代', symbol: 'CHINA', address: '0x0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a' },
    { name: 'BOB', symbol: 'BOB', address: '0x9595959595959595959595959595959595959595' },
    { name: 'Ronin', symbol: 'RONIN', address: '0x1234567890123456789012345678901234567890' },
    { name: 'Aave', symbol: 'AAVE', address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
  ];

  const activities: WalletActivity[] = [];
  const now = Date.now();

  for (let i = 0; i < limit; i++) {
    const token = mockTokens[Math.floor(Math.random() * mockTokens.length)];
    const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const timestamp = now - i * 60000 * (Math.random() * 10 + 1); // Random time in the past
    
    // Try to get real market cap and price
    let marketCap = Math.random() * 500000;
    let price = 0.003165;
    try {
      const pairs = await searchPairs(token.symbol);
      if (pairs.length > 0) {
        const bestPair = pairs[0];
        marketCap = bestPair.marketCap || bestPair.fdv || marketCap;
        price = parseFloat(bestPair.priceUsd || '0.003165');
      }
    } catch (e) {
      // Use mock data
    }

    const quantity = Math.random() * 100000;
    const totalUsd = quantity * price;
    
    let profit: number | undefined;
    let profitPercent: number | undefined;
    if (type === 'SELL') {
      profit = (Math.random() - 0.3) * totalUsd * 0.1;
      profitPercent = (profit / totalUsd) * 100;
    }

    activities.push({
      id: `activity-${i}`,
      type,
      token: {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        image: `https://assets.coingecko.com/coins/images/${Math.floor(Math.random() * 30000)}/large/${token.symbol.toLowerCase()}.png`,
      },
      marketCap,
      quantity,
      totalUsd,
      profit,
      profitPercent,
      duration: `${Math.floor(i / 10)}m ago`,
      gasFee: 0.015 + Math.random() * 0.005,
      timestamp,
    });
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp);
};

