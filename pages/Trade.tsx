
import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Activity, Settings, ChevronDown, ChevronUp, List, 
  ShieldAlert, User, ShieldCheck, Zap, Maximize2, Terminal, Info, Globe, Twitter, Send,
  MousePointer2, Flame, Lock, Eye, AlertTriangle, Boxes, Copy, ExternalLink, Search,
  Star, Edit, MessageCircle, BarChart3, ThumbsUp, ChefHat, Crown, Clock, LayoutGrid, Camera
} from 'lucide-react';
import TradingChart from '../components/TradingChart';
import { getPairsByAddress, getMockHistoricalData, getKlineDataFromDexScreener, getKlineData } from '../services/dexScreener';
import { TokenPair } from '../types';

interface TradeProps {
  isLoggedIn: boolean;
  onOpenLogin: () => void;
}

const Trade: React.FC<TradeProps> = ({ isLoggedIn, onOpenLogin }) => {
  const { pairAddress } = useParams<{ pairAddress: string }>();
  const location = useLocation();
  const tokenFromState = (location.state as any)?.token;
  const [pairInfo, setPairInfo] = useState<TokenPair | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<string>('0.003165');
  const [priceChange5m, setPriceChange5m] = useState<number>(0);
  const [priceChange1h, setPriceChange1h] = useState<number>(0);
  const [priceChange6h, setPriceChange6h] = useState<number>(0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [panelTab, setPanelTab] = useState<'P1' | 'P2' | 'P3'>('P1');
  const [amount, setAmount] = useState('1');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuto, setIsAuto] = useState(false);
  const [chartInterval, setChartInterval] = useState<string>('1H');
  const [baseMarketCap, setBaseMarketCap] = useState<number>(214550); // Base market cap in thousands
  
  // Token info from navigation state
  const tokenName = tokenFromState?.name || pairInfo?.baseToken.name || 'BOB';
  const tokenSymbol = tokenFromState?.symbol || pairInfo?.baseToken.symbol || 'BOB';
  // Use currentPrice from K-line data, fallback to initial price
  const tokenPrice = currentPrice ? `$${currentPrice}` : (tokenFromState?.price || pairInfo?.priceUsd || '$0.003165');
  const tokenImage = tokenFromState?.image || `https://avatar.vercel.sh/${tokenSymbol}.png?size=40`;
  
  // Calculate market cap based on current price
  // Market cap = price * total supply (assuming 1B supply)
  const currentPriceNum = parseFloat(currentPrice) || 0.003165;
  const totalSupply = 1000000000; // 1B
  const calculatedMarketCap = currentPriceNum * totalSupply / 1000; // Convert to thousands
  
  // Initialize currentPrice from tokenFromState or pairInfo
  useEffect(() => {
    if (!currentPrice || currentPrice === '0.003165') {
      if (tokenFromState?.price) {
        const priceStr = tokenFromState.price.replace('$', '').trim();
        setCurrentPrice(priceStr);
      } else if (pairInfo?.priceUsd) {
        setCurrentPrice(pairInfo.priceUsd);
      }
    }
  }, [tokenFromState?.price, pairInfo?.priceUsd]);

  // Collapsible sections state
  const [isPoolInfoOpen, setIsPoolInfoOpen] = useState(true);
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(true);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isSameNameOpen, setIsSameNameOpen] = useState(false);

  // Fetch data function
  const fetchData = React.useCallback(async () => {
    if (!pairAddress) return;
    
    // Get price from token state or pair info
    let basePrice = 0.003165;
    if (tokenFromState?.price) {
      // Extract price from string like "$0.0012345"
      const priceStr = tokenFromState.price.replace('$', '').trim();
      basePrice = parseFloat(priceStr) || 0.003165;
    }
    
    try {
      const pairs = await getPairsByAddress(pairAddress);
      if (pairs && pairs.length > 0) {
        setPairInfo(pairs[0]);
        basePrice = parseFloat(pairs[0].priceUsd) || basePrice;
        // Update price change from API if available
        if (pairs[0].priceChange) {
          if (pairs[0].priceChange.m5 !== undefined) setPriceChange5m(pairs[0].priceChange.m5);
          if (pairs[0].priceChange.h1 !== undefined) setPriceChange1h(pairs[0].priceChange.h1);
          if (pairs[0].priceChange.h6 !== undefined) setPriceChange6h(pairs[0].priceChange.h6);
          if (pairs[0].priceChange.h24 !== undefined) setPriceChange24h(pairs[0].priceChange.h24);
        }
      }
      
      // Try to get K-line data using symbol if available
      if (tokenFromState?.symbol) {
        try {
          // Try to get K-line data from Binance using symbol (format: SYMBOLUSDT)
          // Map interval to Binance format
          // Note: Binance API supports: 1s, 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
          // 30s is not supported, so we map it to 1m
          const intervalMap: Record<string, string> = {
            '1s': '1s',
            '30s': '1m', // Binance doesn't support 30s, use 1m instead
            '1m': '1m',
            '1H': '1h',
            '4H': '4h',
            '1D': '1d',
          };
          const binanceInterval = intervalMap[chartInterval] || '1h';
          const tradingPair = `${tokenFromState.symbol.toUpperCase()}USDT`;
          const klineData = await getKlineData(tradingPair, binanceInterval, 250);
          if (klineData && klineData.length > 0) {
            setChartData(klineData);
            // Update current price from the last K-line data point
            let lastPrice = klineData[klineData.length - 1]?.close || basePrice;
            
            // Add small random variation (±1%) to make price more dynamic
            const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
            lastPrice = lastPrice * (1 + variation);
            
            setCurrentPrice(lastPrice.toFixed(7));
            // Calculate price changes from K-line data
            if (klineData.length >= 1) {
              const price1hAgo = klineData[Math.max(0, klineData.length - 2)]?.close || lastPrice;
              const change1h = ((lastPrice - price1hAgo) / price1hAgo) * 100;
              setPriceChange1h(change1h);
              setPriceChange5m(change1h * 0.083); // Approximate 5m change
            }
            if (klineData.length >= 6) {
              const price6hAgo = klineData[klineData.length - 6]?.close || lastPrice;
              const change6h = ((lastPrice - price6hAgo) / price6hAgo) * 100;
              setPriceChange6h(change6h);
            }
            if (klineData.length >= 24) {
              const price24hAgo = klineData[klineData.length - 24]?.close || lastPrice;
              const change24h = ((lastPrice - price24hAgo) / price24hAgo) * 100;
              setPriceChange24h(change24h);
            }
            return;
          }
        } catch (e) {
          console.log('Failed to get K-line from Binance, trying DexScreener...');
        }
      }
      
      // Fallback to DexScreener or mock data
      try {
        const klineData = await getKlineDataFromDexScreener(pairAddress, 250);
        if (klineData && klineData.length > 0) {
          setChartData(klineData);
          // Update current price from the last K-line data point
          let lastPrice = klineData[klineData.length - 1]?.close || basePrice;
          
          // Add small random variation (±1%) to make price more dynamic
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          lastPrice = lastPrice * (1 + variation);
          
          setCurrentPrice(lastPrice.toFixed(7));
          // Calculate price changes from K-line data
          if (klineData.length >= 1) {
            const price1hAgo = klineData[Math.max(0, klineData.length - 2)]?.close || lastPrice;
            const change1h = ((lastPrice - price1hAgo) / price1hAgo) * 100;
            setPriceChange1h(change1h);
            setPriceChange5m(change1h * 0.083); // Approximate 5m change
          }
          if (klineData.length >= 6) {
            const price6hAgo = klineData[klineData.length - 6]?.close || lastPrice;
            const change6h = ((lastPrice - price6hAgo) / price6hAgo) * 100;
            setPriceChange6h(change6h);
          }
          if (klineData.length >= 24) {
            const price24hAgo = klineData[klineData.length - 24]?.close || lastPrice;
            const change24h = ((lastPrice - price24hAgo) / price24hAgo) * 100;
            setPriceChange24h(change24h);
          }
        } else {
          // If no data, use mock data with correct base price
          const mockData = getMockHistoricalData(250, basePrice);
          setChartData(mockData);
          // Update current price from the last mock data point
          let lastPrice = mockData[mockData.length - 1]?.close || basePrice;
          
          // Add small random variation (±1%) to make price more dynamic
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          lastPrice = lastPrice * (1 + variation);
          
          setCurrentPrice(lastPrice.toFixed(7));
          // Calculate price changes from mock data
          if (mockData.length >= 1) {
            const price1hAgo = mockData[Math.max(0, mockData.length - 2)]?.close || lastPrice;
            const change1h = ((lastPrice - price1hAgo) / price1hAgo) * 100;
            setPriceChange1h(change1h);
            setPriceChange5m(change1h * 0.083); // Approximate 5m change
          }
          if (mockData.length >= 6) {
            const price6hAgo = mockData[mockData.length - 6]?.close || lastPrice;
            const change6h = ((lastPrice - price6hAgo) / price6hAgo) * 100;
            setPriceChange6h(change6h);
          }
          if (mockData.length >= 24) {
            const price24hAgo = mockData[mockData.length - 24]?.close || lastPrice;
            const change24h = ((lastPrice - price24hAgo) / price24hAgo) * 100;
            setPriceChange24h(change24h);
          }
        }
      } catch (e) {
        // Use mock data with correct base price
        const mockData = getMockHistoricalData(250, basePrice);
        setChartData(mockData);
          // Update current price from the last mock data point
          let lastPrice = mockData[mockData.length - 1]?.close || basePrice;
          
          // Add small random variation (±1%) to make price more dynamic
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          lastPrice = lastPrice * (1 + variation);
          
          setCurrentPrice(lastPrice.toFixed(7));
        // Calculate 24h price change from mock data
        if (mockData.length >= 24) {
          const price24hAgo = mockData[mockData.length - 24]?.close || lastPrice;
          const change = ((lastPrice - price24hAgo) / price24hAgo) * 100;
          setPriceChange24h(change);
        }
      }
    } catch (e) {
      // Try to get K-line data as fallback
      try {
        if (tokenFromState?.symbol) {
          // Map interval to Binance format
          // Note: Binance API supports: 1s, 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
          // 30s is not supported, so we map it to 1m
          const intervalMap: Record<string, string> = {
            '1s': '1s',
            '30s': '1m', // Binance doesn't support 30s, use 1m instead
            '1m': '1m',
            '1H': '1h',
            '4H': '4h',
            '1D': '1d',
          };
          const binanceInterval = intervalMap[chartInterval] || '1h';
          const tradingPair = `${tokenFromState.symbol.toUpperCase()}USDT`;
          const klineData = await getKlineData(tradingPair, binanceInterval, 250);
          if (klineData && klineData.length > 0) {
            setChartData(klineData);
            // Update current price from the last K-line data point
            let lastPrice = klineData[klineData.length - 1]?.close || basePrice;
            
            // Add small random variation (±1%) to make price more dynamic
            const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
            lastPrice = lastPrice * (1 + variation);
            
            setCurrentPrice(lastPrice.toFixed(7));
            // Calculate 24h price change from K-line data
            if (klineData.length >= 24) {
              const price24hAgo = klineData[klineData.length - 24]?.close || lastPrice;
              const change = ((lastPrice - price24hAgo) / price24hAgo) * 100;
              setPriceChange24h(change);
            }
            return;
          }
        }
        const klineData = await getKlineDataFromDexScreener(pairAddress, 250);
        if (klineData && klineData.length > 0) {
          setChartData(klineData);
          // Update current price from the last K-line data point
          let lastPrice = klineData[klineData.length - 1]?.close || basePrice;
          
          // Add small random variation (±1%) to make price more dynamic
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          lastPrice = lastPrice * (1 + variation);
          
          setCurrentPrice(lastPrice.toFixed(7));
          // Calculate price changes from K-line data
          if (klineData.length >= 1) {
            const price1hAgo = klineData[Math.max(0, klineData.length - 2)]?.close || lastPrice;
            const change1h = ((lastPrice - price1hAgo) / price1hAgo) * 100;
            setPriceChange1h(change1h);
            setPriceChange5m(change1h * 0.083); // Approximate 5m change
          }
          if (klineData.length >= 6) {
            const price6hAgo = klineData[klineData.length - 6]?.close || lastPrice;
            const change6h = ((lastPrice - price6hAgo) / price6hAgo) * 100;
            setPriceChange6h(change6h);
          }
          if (klineData.length >= 24) {
            const price24hAgo = klineData[klineData.length - 24]?.close || lastPrice;
            const change24h = ((lastPrice - price24hAgo) / price24hAgo) * 100;
            setPriceChange24h(change24h);
          }
        } else {
          const mockData = getMockHistoricalData(250, basePrice);
          setChartData(mockData);
          // Update current price from the last mock data point
          let lastPrice = mockData[mockData.length - 1]?.close || basePrice;
          
          // Add small random variation (±1%) to make price more dynamic
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          lastPrice = lastPrice * (1 + variation);
          
          setCurrentPrice(lastPrice.toFixed(7));
          // Calculate price changes from mock data
          if (mockData.length >= 1) {
            const price1hAgo = mockData[Math.max(0, mockData.length - 2)]?.close || lastPrice;
            const change1h = ((lastPrice - price1hAgo) / price1hAgo) * 100;
            setPriceChange1h(change1h);
            setPriceChange5m(change1h * 0.083); // Approximate 5m change
          }
          if (mockData.length >= 6) {
            const price6hAgo = mockData[mockData.length - 6]?.close || lastPrice;
            const change6h = ((lastPrice - price6hAgo) / price6hAgo) * 100;
            setPriceChange6h(change6h);
          }
          if (mockData.length >= 24) {
            const price24hAgo = mockData[mockData.length - 24]?.close || lastPrice;
            const change24h = ((lastPrice - price24hAgo) / price24hAgo) * 100;
            setPriceChange24h(change24h);
          }
        }
      } catch (e2) {
        const mockData = getMockHistoricalData(250, basePrice);
        setChartData(mockData);
          // Update current price from the last mock data point
          let lastPrice = mockData[mockData.length - 1]?.close || basePrice;
          
          // Add small random variation (±1%) to make price more dynamic
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          lastPrice = lastPrice * (1 + variation);
          
          setCurrentPrice(lastPrice.toFixed(7));
        // Calculate 24h price change from mock data
        if (mockData.length >= 24) {
          const price24hAgo = mockData[mockData.length - 24]?.close || lastPrice;
          const change = ((lastPrice - price24hAgo) / price24hAgo) * 100;
          setPriceChange24h(change);
        }
      }
    }
  }, [pairAddress, tokenFromState?.symbol, tokenFromState?.price, chartInterval]);

  // Initial data fetch
  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, [fetchData]);

  // Polling: Update data every 2 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 2000); // 2 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData, chartInterval]);

  const handleActionClick = () => {
    if (!isLoggedIn) {
      onOpenLogin();
    } else {
      console.log('Executing trade...');
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0a0b0d] h-full">
      {/* Left Main View */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-800 h-full overflow-hidden">
        <div className="flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-800 bg-[#0a0b0d] flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              {/* Left: All data elements */}
              <div className="flex items-center gap-3 flex-1">
                {/* Star icon */}
                <button className="p-1 hover:bg-white/5 rounded transition-colors text-gray-400 hover:text-yellow-400">
                  <Star className="w-4 h-4" />
                </button>
                
                {/* Badge with token logo and overlapping icons */}
                <div className="relative flex-shrink-0">
                  {/* Main badge with token logo */}
                  <div className="rounded-lg border-2 border-[#00ffa3] bg-[#0a0b0d] relative flex items-center gap-2">
                    {/* Token logo image */}
                    <div className="w-10 h-10 rounded-lg bg-[#1a1b1f] border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {tokenImage ? (
                        <img 
                          src={tokenImage} 
                          alt={tokenSymbol}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('span')) {
                              const fallback = document.createElement('span');
                              fallback.className = 'text-[10px]';
                              fallback.textContent = tokenSymbol?.slice(0, 2).toUpperCase() || '💰';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-[10px]">{tokenSymbol?.slice(0, 2).toUpperCase() || '💰'}</span>
                      )}
                    </div>
                    {/* Thumbs up icon overlapping bottom-right */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00ffa3] flex items-center justify-center">
                      <ThumbsUp className="w-2.5 h-2.5 text-black" />
                    </div>
                  </div>
                </div>

                {/* Token info - two rows */}
                <div className="flex flex-col gap-1">
                  {/* First row: Token name and action icons */}
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-lg text-white">
                      {tokenName}
                    </h1>
                    <span className="text-gray-400 text-sm">{tokenName}</span>
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
                        <Boxes className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
                        <User className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Second row: Address and icons */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>1d</span>
                    <span className="font-mono">{pairAddress ? `${pairAddress.slice(0, 4)}...${pairAddress.slice(-4)}` : '0x0a...4444'}</span>
                    <User className="w-3 h-3 text-blue-400" />
                    <User className="w-3 h-3 text-blue-400" />
                    <AlertTriangle className="w-3 h-3 text-yellow-400" />
                    <Send className="w-3 h-3 text-blue-400" />
                    <BarChart3 className="w-3 h-3 text-blue-400" />
                    <MessageCircle className="w-3 h-3 text-blue-400" />
                    <Search className="w-3 h-3 text-gray-400" />
                    <ChefHat className="w-3 h-3 text-blue-400" />
                    <span>DS 3d</span>
                    <Crown className="w-3 h-3 text-yellow-400" />
                    <span>1/177</span>
                  </div>
                </div>

                {/* Market cap - independent element, calculated from current price */}
                <div className="text-2xl font-bold text-white flex-shrink-0">
                  ${calculatedMarketCap >= 1000 ? `${(calculatedMarketCap / 1000).toFixed(2)}M` : `${calculatedMarketCap.toFixed(1)}K`}
                </div>

                {/* Metrics table - four columns */}
                <div className="flex items-center gap-6 flex-shrink-0">
                <div className="flex flex-col gap-1 text-[11px]">
                    <div className="text-gray-500 text-[10px] mb-1">价格</div>
                    <div className="text-gray-300 font-mono">{tokenPrice}</div>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="text-gray-500 text-[10px] mb-1">池子</div>
                    <div className="text-gray-300 font-mono">${pairInfo?.liquidity?.usd ? (pairInfo.liquidity.usd >= 1000 ? `${(pairInfo.liquidity.usd / 1000).toFixed(1)}K` : pairInfo.liquidity.usd.toFixed(0)) : '61.1K'}</div>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="text-gray-500 text-[10px] mb-1">24h 成交额</div>
                    <div className="text-gray-300 font-mono">${pairInfo?.volume?.h24 ? (pairInfo.volume.h24 >= 1000 ? `${(pairInfo.volume.h24 / 1000).toFixed(1)}K` : pairInfo.volume.h24.toFixed(0)) : '857.2K'}</div>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="text-gray-500 text-[10px] mb-1">总手续费</div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded flex items-center justify-center text-[8px] text-black font-bold">B</div>
                      <span className="text-gray-300 font-mono">15.2</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="text-gray-500 text-[10px] mb-1">供应量</div>
                    <div className="text-gray-300 font-mono">1B</div>
                  </div>
                </div>
              </div>

              {/* Right: Only alarm clock icon */}
              <button className="p-2 hover:bg-white/5 rounded border border-gray-800 flex-shrink-0">
                <Clock className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Chart Toolbar */}
        <div className="h-10 px-4 flex items-center justify-between bg-[#0a0b0d] flex-shrink-0">
          {/* Left: Time Interval Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {(['1s', '30s', '1m', '1H', '4H', '1D'] as const).map((iv) => (
                <button
                  key={iv}
                  onClick={() => {
                    setChartInterval(iv);
                    // Trigger data refetch by updating a dependency
                    setIsLoading(true);
                  }}
                  className={`px-2 py-1 text-[11px] font-bold rounded transition-colors ${
                    chartInterval === iv
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {iv}
                </button>
              ))}
              <button className="px-1 py-1 text-gray-400 hover:text-white">
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            
            {/* Separator */}
            <div className="w-px h-4 bg-gray-800 mx-1" />
            
            {/* Layout/Chart Type Controls */}
            <div className="flex items-center gap-2">
              <button className="p-1 text-gray-400 hover:text-white">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <span className="text-[11px] text-gray-400">多图表</span>
            </div>
            
            <div className="w-px h-4 bg-gray-800 mx-1" />
            
            <div className="flex items-center gap-2">
              <button className="p-1 text-gray-400 hover:text-white">
                <BarChart3 className="w-4 h-4" />
              </button>
              <span className="text-[11px] text-gray-400">fx</span>
            </div>
            
            <div className="w-px h-4 bg-gray-800 mx-1" />
            
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400">显示</span>
              <button className="px-1 py-1 text-gray-400 hover:text-white">
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            
            <div className="w-px h-4 bg-gray-800 mx-1" />
            
            <span className="text-[11px] text-gray-400">价格/市值</span>
            
            <div className="w-px h-4 bg-gray-800 mx-1" />
            
            <span className="text-[11px] text-gray-400">USD/BNB</span>
          </div>
          
          {/* Right: Action Icons */}
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
              <Camera className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="h-[350px] relative flex-shrink-0">
           {isLoading ? (
             <div className="absolute inset-0 flex items-center justify-center bg-[#0a0b0d]">
                <div className="w-8 h-8 border-2 border-[#00ffa3] border-t-transparent rounded-full animate-spin"></div>
             </div>
           ) : (
             <TradingChart 
               data={chartData} 
               symbol={tokenSymbol}
               interval={chartInterval as any}
             />
           )}
        </div>

        <div className="h-12 border-t border-gray-800 flex items-center px-4 gap-4 bg-[#0a0b0d] flex-shrink-0">
           <div className="flex items-center gap-2 text-[11px] font-bold text-[#00ffa3] border-b-2 border-[#00ffa3] h-full px-2 cursor-pointer">
             <List className="w-3.5 h-3.5" /> 交易记录
           </div>
           <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 hover:text-white h-full px-2 cursor-pointer">
             <Terminal className="w-3.5 h-3.5" /> 智能合约
           </div>
        </div>

        <div className="flex-1 overflow-hidden bg-[#0d0e12] min-h-0 flex flex-col">
          <div className="flex-shrink-0 bg-[#0a0b0d] border-b border-gray-800/50">
            <table className="w-full text-left border-collapse min-w-[600px]">
               <colgroup>
                 <col style={{ width: '16.66%' }} />
                 <col style={{ width: '16.66%' }} />
                 <col style={{ width: '16.66%' }} />
                 <col style={{ width: '16.66%' }} />
                 <col style={{ width: '16.66%' }} />
                 <col style={{ width: '16.66%' }} />
               </colgroup>
               <thead className="text-[10px] text-gray-600 font-black uppercase">
                 <tr>
                    <th className="px-4 py-2.5">时间</th>
                    <th className="px-4 py-2.5">类型</th>
                    <th className="px-4 py-2.5">价格</th>
                    <th className="px-4 py-2.5">数量</th>
                    <th className="px-4 py-2.5 text-right">总额 USD</th>
                    <th className="px-4 py-2.5 text-right">交易者</th>
                 </tr>
               </thead>
            </table>
          </div>
          <div 
            className="overflow-y-auto overflow-x-hidden bg-[#0d0e12]"
            style={{ 
              height: '400px',
              overscrollBehavior: 'contain',
              maxHeight: '100%'
            }}
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            <table className="w-full text-left border-collapse min-w-[600px]">
               <colgroup>
                 <col style={{ width: '16.66%' }} />
                 <col style={{ width: '16.66%' }} />
                 <col style={{ width: '16.66%' }} />
                 <col style={{ width: '16.66%' }} />
                 <col style={{ width: '16.66%' }} />
                 <col style={{ width: '16.66%' }} />
               </colgroup>
               <tbody className="text-[11px] font-mono divide-y divide-gray-800/30">
                 {[...Array(50)].map((_, i) => {
                   const timeAgo = i < 10 ? `${i * 12}s ago` : i < 30 ? `${Math.floor(i / 10)}m ${(i % 10) * 12}s ago` : `${Math.floor(i / 30)}h ${Math.floor((i % 30) / 10)}m ago`;
                   const isSell = i % 3 === 0;
                   const price = parseFloat(tokenPrice.replace('$', '')) || 0.003165;
                   const quantity = (Math.random() * 900 + 10).toFixed(1);
                   const total = (parseFloat(quantity) * price).toFixed(2);
                   // Format price to 2 decimal places
                   const formattedPrice = price.toFixed(2);
                   return (
                     <tr key={i} className="hover:bg-white/[0.03] group border-b border-white/[0.02]">
                       <td className="px-4 py-2.5 text-gray-500">{timeAgo}</td>
                       <td className={`px-4 py-2.5 font-black ${isSell ? 'text-red-500' : 'text-[#00ffa3]'}`}>{isSell ? 'SELL' : 'BUY'}</td>
                       <td className="px-4 py-2.5 text-gray-400 font-bold">${formattedPrice}</td>
                       <td className="px-4 py-2.5 text-gray-300">{quantity}K</td>
                       <td className={`px-4 py-2.5 text-right font-black ${isSell ? 'text-red-500' : 'text-[#00ffa3]'}`}>${total}</td>
                       <td className="px-4 py-2.5 text-right text-gray-500">0x{Math.random().toString(16).substring(2, 6)}...{Math.random().toString(16).substring(2, 6)} <User className="inline w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></td>
                     </tr>
                   );
                 })}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar - High Fidelity Matching with Collapsible Sections */}
      <div className="w-80 flex flex-col bg-[#0a0b0d] flex-shrink-0 border-l border-gray-800 overflow-y-auto custom-scrollbar select-none h-full">
        
        {/* Performance & Quick Stats */}
        <div className="grid grid-cols-4 gap-[1px] bg-gray-800/50 border-b border-gray-800 p-2 flex-shrink-0">
          <StatBox label="5m" value={`${priceChange5m >= 0 ? '+' : ''}${priceChange5m.toFixed(2)}%`} color={priceChange5m >= 0 ? 'text-green-500' : 'text-red-500'} />
          <StatBox label="1h" value={`${priceChange1h >= 0 ? '+' : ''}${priceChange1h.toFixed(2)}%`} color={priceChange1h >= 0 ? 'text-green-500' : 'text-red-500'} />
          <StatBox label="6h" value={`${priceChange6h >= 0 ? '+' : ''}${priceChange6h.toFixed(2)}%`} color={priceChange6h >= 0 ? 'text-green-500' : 'text-red-500'} />
          <StatBox label="24h" value={`${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`} color={priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'} />
        </div>
        
        <div className="p-3 border-b border-gray-800/50 flex flex-col gap-2 bg-[#0a0b0d] flex-shrink-0">
          <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-tight">
            <div className="text-gray-500">成交额 <span className="text-gray-300 font-mono ml-1">$2.68K</span></div>
            <div className="text-gray-500">买入 <span className="text-green-500 font-mono ml-1">12 / $2K</span></div>
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-tight">
            <div className="text-gray-500">卖出 <span className="text-red-500 font-mono ml-1">14 / $1K</span></div>
            <div className="text-gray-500">净买入 <span className="text-green-500 font-mono ml-1">+$478</span></div>
          </div>
        </div>

        {/* Trade Panel */}
        <div className="p-4 flex flex-col gap-4 bg-[#0a0b0d] flex-shrink-0 border-b border-gray-800 border-t-0">
          <div className="flex items-center justify-between">
            <div className="flex bg-[#1a1b1f] p-0.5 rounded-lg border border-gray-800/50">
              {(['P1', 'P2', 'P3'] as const).map(p => (
                <button 
                  key={p}
                  onClick={() => setPanelTab(p)}
                  className={`px-3 py-1 rounded text-[11px] font-black transition-all ${panelTab === p ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Settings className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
          </div>

          <div className="flex bg-[#1a1b1f] p-1 rounded-xl border border-gray-800/50">
            <button 
              onClick={() => setTradeType('BUY')}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${tradeType === 'BUY' ? 'bg-[#2d2f36] text-[#00ffa3]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              买入
            </button>
            <button 
              onClick={() => setTradeType('SELL')}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${tradeType === 'SELL' ? 'bg-[#2d2f36] text-red-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
              卖出
            </button>
            <button 
              onClick={() => setIsAuto(!isAuto)}
              className={`px-3 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${isAuto ? 'text-blue-400' : 'text-gray-500'}`}
            >
              自动 <span className={`w-1.5 h-1.5 rounded-full ${isAuto ? 'bg-blue-400' : 'bg-gray-700'}`}></span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-gray-600 uppercase">数量</span>
              <span className="text-[10px] font-black text-gray-500 uppercase">余额: 0 USDT</span>
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#1a1b1f] border border-gray-800 rounded px-3 py-2.5 text-sm font-black font-mono focus:outline-none focus:border-gray-700 transition-all text-gray-200"
                placeholder="0.0"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600 uppercase">USDT</div>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {['0.01', '0.02', '0.5', '1'].map(val => (
                <button 
                  key={val} 
                  onClick={() => setAmount(val)} 
                  className="py-1.5 rounded bg-gray-800/30 border border-gray-800/50 text-[10px] font-black text-gray-500 hover:border-gray-600 hover:text-white transition-all"
                >
                  {val}
                </button>
              ))}
              <button className="py-1.5 rounded bg-gray-800/30 border border-gray-800/50 text-gray-500 flex items-center justify-center">
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </div>

          <button 
            onClick={handleActionClick}
            className={`w-full py-3.5 rounded-lg font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              tradeType === 'BUY' 
              ? 'bg-[#26a69a]/70 hover:bg-[#26a69a] text-black' 
              : 'bg-[#ef5350]/70 hover:bg-[#ef5350] text-white'
            }`}
          >
            {tradeType === 'BUY' ? '买入' : '卖出'}
          </button>

          <div className="flex items-center justify-between text-[10px] font-black text-gray-500">
             <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" /> 自动
                <span className="text-gray-400 font-mono ml-1 border border-gray-800 px-1 rounded">0.12</span>
             </div>
             <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Security Summary Panel (Fixed grid items) */}
        <div className="px-4 py-4 border-b border-gray-800">
           <div className="grid grid-cols-4 gap-y-4 text-[10px] font-black uppercase">
              <SecurityMini label="Top 10" value="18.05%" icon={<ShieldCheck className="w-3 h-3 text-green-500" />} />
              <SecurityMini label="DEV" value="0%" icon={<ShieldCheck className="w-3 h-3 text-green-500" />} />
              <SecurityMini label="持有者" value="1,042" />
              <SecurityMini label="狙击者" value="0%" icon={<Zap className="w-3 h-3 text-gray-500" />} />
              
              <SecurityMini label="老鼠仓" value="0%" color="text-green-500" />
              <SecurityMini label="钓鱼钱包" value="4.1%" color="text-green-500" />
              <SecurityMini label="捆绑交易" value="3.7%" color="text-green-500" />
              <SecurityMini label="Dex付费" value="$299 CTO" icon={<Zap className="w-3 h-3 text-gray-400" />} />

              <SecurityMini label="非貔貅" value={<ShieldCheck className="w-3.5 h-3.5 text-green-500" />} />
              <SecurityMini label="开源" value={<ShieldCheck className="w-3.5 h-3.5 text-green-500" />} />
              <SecurityMini label="弃权" value={<ShieldCheck className="w-3.5 h-3.5 text-green-500" />} />
              <SecurityMini label="锁定" value={<Flame className="w-3.5 h-3.5 text-orange-500" />} />
           </div>
        </div>

        {/* --- Collapsible Sections --- */}

        {/* 1. Pool Info */}
        <div className="border-b border-gray-800">
          <div 
            onClick={() => setIsPoolInfoOpen(!isPoolInfoOpen)}
            className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-gray-300 tracking-tight">
              {tokenSymbol}/USDT 池信息 {isPoolInfoOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
            <Activity className="w-4 h-4 text-gray-500" />
          </div>
          {isPoolInfoOpen && (
            <div className="px-4 pb-4 flex flex-col gap-3 text-[11px] font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              <Row label="总流动性" value="$49.23K(29.21 USDT)" color="text-gray-300" extra={<Flame className="w-3 h-3 text-orange-500 ml-1" />} />
              
              <div className="grid grid-cols-3 gap-2 py-1 text-[10px] text-gray-500 font-black border-y border-gray-800/30">
                <span>池子</span>
                <span>当前数量/初始</span>
                <span className="text-right">价值</span>
              </div>
              <Row label={tokenSymbol} value="143.7M/0(0)" valueRight="$24.6K" />
              <Row label="USDT" value="29.21/0" valueRight="$24.6K" />

              <div className="pt-2 border-t border-gray-800/30 flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">开发者</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-300 font-mono underline decoration-dotted underline-offset-4">0xf1...a86f(0.0₅234 USDT)</span>
                    <Copy className="w-3 h-3 text-gray-500 cursor-pointer" />
                    <Search className="w-3 h-3 text-gray-500 cursor-pointer" />
                    <Activity className="w-3 h-3 text-gray-500 cursor-pointer" />
                  </div>
                </div>
                <Row label="资金来源" value="--" />
                <Row label="市值" value="$171.21K" color="text-gray-200" />
                <Row label="持有者" value="1042" color="text-gray-200" />
                <Row label="总供应量" value="1B" color="text-gray-200" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">币对</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-300 font-mono">0x5a...b499</span>
                    <Copy className="w-3 h-3 text-gray-500 cursor-pointer" />
                  </div>
                </div>
                <Row label="代币创建时间" value="12/26/2025 17:49:55" />
                <Row label="池子创建时间" value="12/26/2025 17:57:20" />
              </div>
            </div>
          )}
        </div>

        {/* 2. Token Banner */}
        <div className="border-b border-gray-800">
          <div 
            onClick={() => setIsBannerOpen(!isBannerOpen)}
            className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-gray-300">
              代币Banner {isBannerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>
          {isBannerOpen && (
            <div className="p-4 pt-0">
               <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-900/50 border border-gray-800 relative group">
                  <img src="https://assets.coingecko.com/coins/images/30391/large/bob.png?1696529324" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-500" alt="banner" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-2xl font-black text-yellow-500 drop-shadow-lg">BOOK OF BSC</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* 3. Security Detection (Detailed) */}
        <div className="border-b border-gray-800">
          <div 
            onClick={() => setIsSecurityOpen(!isSecurityOpen)}
            className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-gray-300">
              安全检测 {isSecurityOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>
          {isSecurityOpen && (
            <div className="px-4 pb-4 flex flex-col gap-2.5 text-[11px]">
               <SecurityRow label="已开源合约" icon={<Info className="w-3 h-3 text-gray-600" />} checked />
               <SecurityRow label="非貔貅" icon={<Info className="w-3 h-3 text-gray-600" />} checked />
               <SecurityRow label="弃权" icon={<Info className="w-3 h-3 text-gray-600" />} checked />
               <SecurityRow label="无黑名单" icon={<Info className="w-3 h-3 text-gray-600" />} checked />
               
               <div className="flex justify-between items-center py-1">
                 <div className="flex items-center gap-1 text-gray-500">买卖税 <Info className="w-3 h-3" /></div>
                 <div className="flex items-center gap-3">
                    <span className="text-gray-300">买入 <span className="text-green-500 font-bold">0.00%</span></span>
                    <span className="text-gray-500">/</span>
                    <span className="text-gray-300">卖出 <span className="text-red-500 font-bold">0.00%</span></span>
                 </div>
               </div>

               <div className="flex justify-between items-center py-1">
                 <div className="flex items-center gap-1 text-gray-500">税费 <Info className="w-3 h-3" /></div>
                 <div className="flex items-center gap-3">
                    <span className="text-gray-300">平均 <span className="font-bold">0.00%</span></span>
                    <span className="text-gray-500">/</span>
                    <span className="text-gray-300">最高 <span className="font-bold">0.00%</span></span>
                 </div>
               </div>

               <div className="flex justify-between items-center py-1 border-t border-gray-800/30 pt-2">
                 <span className="text-gray-500">安全指标</span>
                 <div className="flex items-center gap-1 text-green-500 font-black">
                   0 <ShieldCheck className="w-3.5 h-3.5" />
                 </div>
               </div>

               <div className="flex items-center justify-center gap-8 pt-2">
                  <div className="flex items-center gap-1.5 text-gray-400 font-black hover:text-white transition-colors cursor-pointer">
                    <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center text-green-500 font-black text-[10px]">G+</div>
                    <span>GoPlus</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 font-black hover:text-white transition-colors cursor-pointer">
                    <div className="w-5 h-5 rounded bg-orange-500/20 flex items-center justify-center text-orange-500">🍯</div>
                    <span>Honeypot.is</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* 4. Duplicate Image Tokens */}
        <div className="border-b border-gray-800">
           <div 
             onClick={() => setIsDuplicateOpen(!isDuplicateOpen)}
             className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer"
           >
             <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-gray-300">
               图片重复代币 {isDuplicateOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
             </div>
             <span className="text-[10px] text-gray-500 font-black">市值</span>
           </div>
           {isDuplicateOpen && (
             <div className="p-8 text-center text-gray-500 text-[11px] font-black uppercase opacity-60">
               无图片重复代币
             </div>
           )}
        </div>

        {/* 5. Same Name Tokens */}
        <div className="border-b border-gray-800 mb-8">
           <div 
             onClick={() => setIsSameNameOpen(!isSameNameOpen)}
             className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer"
           >
             <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-gray-300">
               同名代币 {isSameNameOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
             </div>
             <div className="flex items-center gap-2 text-[10px] text-gray-500 font-black">
               <span>市值</span> <ArrowLeft className="w-3 h-3 rotate-180" />
             </div>
           </div>
           {isSameNameOpen && (
             <div className="flex flex-col">
               <SameNameItem 
                 icon="https://avatar.vercel.sh/bob1.png" 
                 name="BOB" 
                 desc="Build On BSC" 
                 lastTx="28m" 
                 mcap="$7.5M" 
                 mcapColor="text-yellow-500"
               />
               <SameNameItem 
                 icon="https://avatar.vercel.sh/bob2.png" 
                 name="BOB" 
                 desc="Book Of BSC" 
                 lastTx="29m" 
                 mcap="$637.7K" 
                 mcapColor="text-yellow-500"
                 active
               />
               <SameNameItem 
                 icon="https://avatar.vercel.sh/bob3.png" 
                 name="BOB" 
                 desc="Build On BSC" 
                 lastTx="78d" 
                 mcap="$278.8K" 
                 mcapColor="text-yellow-500"
                 age="79d"
               />
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const Row = ({ label, value, valueRight, color = 'text-gray-500', extra }: any) => (
  <div className="flex justify-between items-center group">
    <span className="text-gray-500">{label}</span>
    <div className="flex items-center">
      <span className={`${color} font-mono flex items-center`}>{value} {extra}</span>
      {valueRight && <span className="ml-4 font-mono text-gray-300 font-bold">{valueRight}</span>}
    </div>
  </div>
);

const SecurityRow = ({ label, icon, checked }: { label: string; icon: React.ReactNode; checked?: boolean }) => (
  <div className="flex justify-between items-center py-0.5">
    <div className="flex items-center gap-1 text-gray-500">
      {label} {icon}
    </div>
    {checked && <ShieldCheck className="w-4 h-4 text-green-500" />}
  </div>
);

const SameNameItem = ({ icon, name, desc, lastTx, mcap, mcapColor, age, active }: any) => (
  <div className={`flex items-center justify-between p-3 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-gray-800/20 ${active ? 'bg-white/[0.02]' : ''}`}>
    <div className="flex items-center gap-2.5">
      <img src={icon} alt="" className="w-6 h-6 rounded-full" />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black text-gray-100">{name}</span>
          <span className="text-[10px] text-gray-500 font-medium">{desc}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
           <span className="text-gray-600">Last TX:</span>
           <span className="text-green-500/80 font-mono">{lastTx}</span>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-0.5">
       {age && <span className="text-[10px] text-gray-500 font-mono">{age}</span>}
       <span className={`text-[11px] font-black font-mono ${mcapColor}`}>{mcap}</span>
    </div>
  </div>
);

const StatItem = ({ label, value, color = 'text-gray-300' }: { label: string; value: string; color?: string }) => (
  <div className="flex items-center gap-1.5 whitespace-nowrap">
    <span className="text-[10px] text-gray-500 font-bold uppercase">{label}</span>
    <span className={`text-[11px] font-mono font-bold ${color}`}>{value}</span>
  </div>
);

const StatBox = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-[#1a1b1f] p-2 rounded flex flex-col items-center justify-center gap-0.5 border border-gray-800/30">
    <span className="text-[10px] text-gray-500 font-black tracking-tight">{label}</span>
    <span className={`text-[11px] font-mono font-black ${color}`}>{value}</span>
  </div>
);

const SecurityMini = ({ label, value, icon, color = 'text-gray-400' }: any) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] text-gray-600 font-black">{label}</span>
    <div className={`flex items-center gap-0.5 text-[10px] font-black ${color}`}>
      {icon} {value}
    </div>
  </div>
);

export default Trade;
