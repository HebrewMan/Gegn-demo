
import { api } from './api';
import { TokenPair } from '../types';

const BASE_URL = 'https://api.dexscreener.com/latest/dex';

export interface HotToken {
  rank?: number;
  rating?: number;
  name: string;
  symbol: string;
  price: string;
  address: string;
  image: string;
  time?: string;
  mcap?: string;
  mcapGrowth?: string;
  peakMcap?: string;
  pool?: string;
  volume?: string;
  txns?: string;
  txnsSplit?: string;
  holders?: string;
  totalFee?: string;
  icon?: string;
}

export const getPairsByAddress = async (pairAddress: string): Promise<TokenPair[]> => {
  try {
    // Try multiple chains, prioritize BSC
    const chains = ['bsc', 'ethereum', 'solana', 'base', 'arbitrum'];
    // Try BSC first
    try {
      const data = await api.get<{ pairs: TokenPair[] }>(`${BASE_URL}/pairs/bsc/${pairAddress}`);
      if (data.pairs && data.pairs.length > 0) {
        return data.pairs;
      }
    } catch (e) {
      // Continue to other chains
    }
    // Try other chains
    for (const chain of chains.filter(c => c !== 'bsc')) {
      try {
        const data = await api.get<{ pairs: TokenPair[] }>(`${BASE_URL}/pairs/${chain}/${pairAddress}`);
        if (data.pairs && data.pairs.length > 0) {
          return data.pairs;
        }
      } catch (e) {
        continue;
      }
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const searchPairs = async (query: string): Promise<TokenPair[]> => {
  const data = await api.get<{ pairs: TokenPair[] }>(`${BASE_URL}/search?q=${query}`);
  return data.pairs || [];
};

// Get trending tokens - try multiple sources
export const getTrendingTokens = async (limit: number = 20): Promise<HotToken[]> => {
  try {
    // Method 1: Try CoinGecko trending API (free, no API key needed)
    try {
      const coingeckoResponse = await api.get<{
        coins: Array<{
          item: {
            id: string;
            name: string;
            symbol: string;
            thumb: string;
            data: {
              price: number;
              price_change_percentage_24h: { usd: number };
              market_cap: number;
            };
          };
        }>;
      }>('https://api.coingecko.com/api/v3/search/trending');
      
      if (coingeckoResponse.coins && coingeckoResponse.coins.length > 0) {
        const tokens = coingeckoResponse.coins.slice(0, limit).map((coin, index) => {
          const item = coin.item;
          const price = item.data?.price || 0;
          const marketCap = item.data?.market_cap || 0;
          const priceChange = item.data?.price_change_percentage_24h?.usd || 0;
          
          return {
            rank: index + 1,
            rating: 3.5 + Math.random() * 1.5,
            name: item.name,
            symbol: item.symbol.toUpperCase(),
            price: `$${price.toFixed(8)}`,
            address: `0x${Math.random().toString(16).substring(2, 42)}`, // Generate mock address
            image: item.thumb || `https://assets.coingecko.com/coins/images/${Math.floor(Math.random() * 30000)}/large/${item.symbol.toLowerCase()}.png`,
            time: '1h',
            mcap: marketCap > 0 ? `$${(marketCap / 1000000).toFixed(1)}M` : '$0',
            mcapGrowth: priceChange >= 0 ? `+${priceChange.toFixed(2)}%` : `${priceChange.toFixed(2)}%`,
            // Calculate peak market cap based on price change
            peakMcap: marketCap > 0 ? (() => {
              const peakMultiplier = priceChange < 0 ? (1 / (1 + priceChange / 100)) : 1.1;
              const peakCap = marketCap * peakMultiplier;
              return peakCap >= 1000000 ? `$${(peakCap / 1000000).toFixed(1)}M` : `$${(peakCap / 1000).toFixed(1)}K`;
            })() : '$0',
            pool: `$${(Math.random() * 100).toFixed(1)}K`,
            volume: `$${(Math.random() * 5).toFixed(1)}M`,
            txns: `${Math.floor(Math.random() * 50000).toLocaleString()}`,
            txnsSplit: `${Math.floor(Math.random() * 30000)} / ${Math.floor(Math.random() * 20000)}`,
            holders: `${Math.floor(Math.random() * 5000)}`,
            totalFee: `${(Math.random() * 20).toFixed(2)} USDT`,
            icon: '💰',
          };
        });
        
        // Try to get real addresses from DexScreener
        const tokensWithAddresses = await Promise.all(
          tokens.map(async (token) => {
            try {
              const pairs = await searchPairs(token.symbol);
              if (pairs.length > 0 && pairs[0].baseToken?.address) {
                return { ...token, address: pairs[0].baseToken.address };
              }
            } catch (e) {
              // Keep original token if search fails
            }
            return token;
          })
        );
        
        return tokensWithAddresses;
      }
    } catch (e) {
      console.log('CoinGecko API failed, trying DexScreener...');
    }
    
    // Method 2: Use DexScreener search for popular tokens, prioritize BSC chain
    try {
      const popularSearches = ['BTC', 'ETH', 'BNB', 'SOL', 'USDT', 'USDC', 'ADA', 'DOT', 'LINK', 'MATIC', 'AVAX', 'UNI', 'ATOM', 'XRP', 'DOGE', 'SHIB', 'LTC', 'ALGO', 'NEAR', 'FTM'];
      const allPairs: TokenPair[] = [];
      
      for (const search of popularSearches.slice(0, limit)) {
        try {
          const pairs = await searchPairs(search);
          if (pairs && pairs.length > 0) {
            // Prioritize BSC chain (chainId: 'bsc' or dexId contains 'pancakeswap')
            const bscPairs = pairs.filter(p => 
              p.chainId === 'bsc' || 
              p.dexId?.toLowerCase().includes('pancakeswap') ||
              p.dexId?.toLowerCase().includes('bsc')
            );
            
            // Get the pair with highest volume, prefer BSC
            const candidates = bscPairs.length > 0 ? bscPairs : pairs;
            const bestPair = candidates
              .filter(p => p.volume?.h24 && p.volume.h24 > 1000)
              .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))[0];
            if (bestPair) {
              allPairs.push(bestPair);
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      if (allPairs.length > 0) {
        const sortedPairs = allPairs
          .filter(pair => 
            pair.baseToken && 
            pair.baseToken.address && 
            pair.priceUsd && 
            parseFloat(pair.priceUsd) > 0
          )
          .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
          .slice(0, limit);
        
        return sortedPairs.map((pair, index) => {
          const price = parseFloat(pair.priceUsd || '0');
          const volume24h = pair.volume?.h24 || 0;
          const liquidity = pair.liquidity?.usd || 0;
          // Use real market cap from API
          const marketCap = pair.marketCap || pair.fdv || 0;
          // Use real 24h price change from API
          const priceChange24h = pair.priceChange?.h24 || 0;
          const txns24h = (pair.txns?.h1?.buys || 0) + (pair.txns?.h1?.sells || 0);
          const txns5m = (pair.txns?.m5?.buys || 0) + (pair.txns?.m5?.sells || 0);
          
          // Calculate time since creation (mock, but use real data when available)
          const timeAgo = txns5m > 0 ? '1h' : '1d';
          
          return {
            rank: index + 1,
            rating: 3.5 + Math.random() * 1.5,
            name: pair.baseToken.name || pair.baseToken.symbol,
            symbol: pair.baseToken.symbol,
            price: `$${price.toFixed(8)}`,
            address: pair.baseToken.address,
            image: `https://assets.coingecko.com/coins/images/${Math.floor(Math.random() * 30000)}/large/${pair.baseToken.symbol.toLowerCase()}.png`,
            time: timeAgo,
            // Use real market cap data
            mcap: marketCap > 0 ? (marketCap >= 1000000 ? `$${(marketCap / 1000000).toFixed(1)}M` : `$${(marketCap / 1000).toFixed(1)}K`) : '$0',
            // Use real 24h price change data
            mcapGrowth: priceChange24h !== 0 ? (priceChange24h >= 0 ? `+${priceChange24h.toFixed(2)}%` : `${priceChange24h.toFixed(2)}%`) : '0%',
            // Calculate peak market cap: if price dropped, estimate peak was higher
            peakMcap: marketCap > 0 ? (() => {
              // If price dropped, estimate peak was higher (e.g., if dropped 20%, peak was 25% higher)
              // If price increased, current might be near peak, use a reasonable multiplier
              const peakMultiplier = priceChange24h < 0 ? (1 / (1 + priceChange24h / 100)) : 1.1;
              const peakCap = marketCap * peakMultiplier;
              return peakCap >= 1000000 ? `$${(peakCap / 1000000).toFixed(1)}M` : `$${(peakCap / 1000).toFixed(1)}K`;
            })() : '$0',
            pool: liquidity > 0 ? (liquidity >= 1000000 ? `$${(liquidity / 1000000).toFixed(1)}M` : `$${(liquidity / 1000).toFixed(1)}K`) : '$0',
            volume: volume24h > 0 ? (volume24h >= 1000000 ? `$${(volume24h / 1000000).toFixed(1)}M` : `$${(volume24h / 1000).toFixed(1)}K`) : '$0',
            txns: txns24h > 0 ? txns24h.toLocaleString() : `${Math.floor(Math.random() * 50000).toLocaleString()}`,
            txnsSplit: `${pair.txns?.h1?.buys || 0} / ${pair.txns?.h1?.sells || 0}`,
            holders: `${Math.floor(Math.random() * 5000)}`,
            totalFee: `${(Math.random() * 20).toFixed(2)} USDT`,
            icon: '💰',
          };
        });
      }
    } catch (e) {
      console.log('DexScreener search failed');
    }
    
    // Fallback to mock data
    return getMockHotTokens(limit);
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return getMockHotTokens(limit);
  }
};

// Fallback mock data
const getMockHotTokens = (limit: number): HotToken[] => {
  const tokens = [
    { name: 'Bitcoin', symbol: 'BTC', address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c' },
    { name: 'Ethereum', symbol: 'ETH', address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8' },
    { name: 'Binance Coin', symbol: 'BNB', address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' },
    { name: 'Solana', symbol: 'SOL', address: '0x570a5d26f7765ecb712c0924e4deccb44d1106bf' },
    { name: 'Cardano', symbol: 'ADA', address: '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47' },
    { name: 'Polkadot', symbol: 'DOT', address: '0x7083609fce4d1d8dc0c979aab8c869ea2c873402' },
    { name: 'Chainlink', symbol: 'LINK', address: '0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd' },
    { name: 'Polygon', symbol: 'MATIC', address: '0xcc42724c6683b7e57334c4e856f4c9965ed682bd' },
    { name: 'Litecoin', symbol: 'LTC', address: '0x4338665cbb7b2485a8855a139b75d5e34ab0db94' },
    { name: 'Uniswap', symbol: 'UNI', address: '0xbf5140a22578168fd562dccf235e5d43a02ce9b1' },
  ];
  
  return tokens.slice(0, limit).map((token, index) => ({
    rank: index + 1,
    rating: 3.5 + Math.random() * 1.5,
    name: token.name,
    symbol: token.symbol,
    price: `$${(Math.random() * 1000).toFixed(8)}`,
    address: token.address,
    image: `https://assets.coingecko.com/coins/images/${Math.floor(Math.random() * 30000)}/large/${token.symbol.toLowerCase()}.png`,
    time: '1h',
    mcap: `$${(Math.random() * 1000).toFixed(1)}K`,
    mcapGrowth: Math.random() > 0.5 ? `+${(Math.random() * 10).toFixed(1)}%` : `-${(Math.random() * 10).toFixed(1)}%`,
    peakMcap: `$${(Math.random() * 1200).toFixed(1)}K`,
    pool: `$${(Math.random() * 100).toFixed(1)}K`,
    volume: `$${(Math.random() * 5).toFixed(1)}M`,
    txns: `${Math.floor(Math.random() * 50000).toLocaleString()}`,
    txnsSplit: `${Math.floor(Math.random() * 30000)} / ${Math.floor(Math.random() * 20000)}`,
    holders: `${Math.floor(Math.random() * 5000)}`,
    totalFee: `${(Math.random() * 20).toFixed(2)} BNB`,
    icon: '💰',
  }));
};

// Get K-line data from Binance API
export const getKlineData = async (symbol: string, interval: string = '1h', limit: number = 250): Promise<any[]> => {
  try {
    // symbol should already be in format like "BTCUSDT" or "RONINUSDT"
    const tradingPair = symbol.toUpperCase();
    
    const response = await api.get<any[]>(
      `https://api.binance.com/api/v3/klines?symbol=${tradingPair}&interval=${interval}&limit=${limit}`
    );
    
    if (!response || response.length === 0) {
      throw new Error('No data from Binance');
    }
    
    return response.map((kline: any[]) => ({
      time: Math.floor(kline[0] / 1000), // Convert to Unix timestamp
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]), // Volume from Binance API
    }));
  } catch (error) {
    console.error('Error fetching K-line data from Binance:', error);
    // Return empty array to trigger fallback
    return [];
  }
};

// Get K-line data from DexScreener (alternative)
export const getKlineDataFromDexScreener = async (pairAddress: string, limit: number = 250): Promise<any[]> => {
  try {
    const pairs = await getPairsByAddress(pairAddress);
    if (pairs.length > 0) {
      const price = parseFloat(pairs[0].priceUsd) || 0.003165;
      // DexScreener doesn't provide historical data easily, so we generate based on current price
      return getMockHistoricalData(limit, price);
    }
    return getMockHistoricalData(limit, 0.003165);
  } catch (error) {
    console.error('Error fetching K-line data from DexScreener:', error);
    return getMockHistoricalData(limit, 0.003165);
  }
};

// Simulated historical data since DexScreener doesn't expose a public free historical OHLCV endpoint easily
export const getMockHistoricalData = (count: number = 100, basePrice: number = 0.0001) => {
  const data = [];
  let lastClose = basePrice;
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = count; i >= 0; i--) {
    const time = now - i * 60; // 1 min interval
    const open = lastClose;
    const change = (Math.random() - 0.5) * (basePrice * 0.05);
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.02);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.02);
    const volume = Math.abs(close - open) * (1000000 + Math.random() * 500000); // Generate volume based on price movement
    
    data.push({ time, open, high, low, close, volume });
    lastClose = close;
  }
  return data;
};
