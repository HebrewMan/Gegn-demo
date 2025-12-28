import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { 
  Copy, QrCode, ChevronDown, Share2, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, ExternalLink
} from 'lucide-react';
import { WalletToken, WalletActivity, User } from '../types';
import { getUserHoldings, getUserActivities, getUserBalance } from '../services/tradeService';
import { searchPairs } from '../services/dexScreener';
import { getHoldingsByUserId as getHoldingRecordsByUserId, type HoldingRecord } from '../data/database';

interface WalletProps {
  currentUser?: User | null;
}

const Wallet: React.FC<WalletProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens');
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState<number>(0);

  // Redirect to login if not logged in
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const fetchData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // Get user balance (USDT)
      const balance = await getUserBalance(currentUser.id);
      setUserBalance(balance);

      // Get holdings from database (based on real trades)
      // First get holdings without prices to fetch current prices
      const holdingsWithoutPrices = await getHoldingRecordsByUserId(currentUser.id);
      
      // Always show USDT as a holding if user has balance
      const allTokens: WalletToken[] = [];
      
      // Add USDT as a holding if user has balance
      if (balance > 0) {
        allTokens.push({
          address: 'USDT',
          name: 'Tether USD',
          symbol: 'USDT',
          image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
          balance: balance,
          balanceUsd: balance,
          holdingPercent: 0, // Will be calculated later
          holdingDuration: '<1d',
          unrealizedProfit: 0,
          unrealizedProfitPercent: 0,
          totalProfit: 0,
          totalProfitPercent: 0,
          totalBuy: balance,
          averageBuy: 1,
          totalSell: 0,
          averageSell: 0,
          transactionCount: 0,
          lastActive: new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          price: '$1.0000000',
          marketCap: 0,
        });
      }
      
      if (holdingsWithoutPrices.length === 0 && balance === 0) {
        // No holdings found and no balance, set empty data
        setTokens([]);
        setActivities([]);
        setTotalPortfolioValue(0);
        setIsLoading(false);
        return;
      }

      // If no token holdings but has USDT balance, show only USDT
      if (holdingsWithoutPrices.length === 0 && balance > 0) {
        setTokens([{
          ...allTokens[0],
          holdingPercent: 100,
        }]);
        setActivities([]);
        setTotalPortfolioValue(balance);
        setIsLoading(false);
        return;
      }

      // Fetch current prices for all holdings
      const priceMap: Record<string, number> = {};
      await Promise.all(
        holdingsWithoutPrices.map(async (holding) => {
          try {
            // Only search if symbol is valid (at least 2 characters)
            if (holding.token_symbol && holding.token_symbol.trim().length >= 2) {
              const pairs = await searchPairs(holding.token_symbol);
              if (pairs.length > 0) {
                const price = parseFloat(pairs[0].priceUsd || '0');
                if (price > 0) {
                  priceMap[holding.token_address.toLowerCase()] = price;
                } else {
                  // Use average buy price as fallback
                  priceMap[holding.token_address.toLowerCase()] = holding.average_buy_price;
                }
              } else {
                // Use average buy price as fallback
                priceMap[holding.token_address.toLowerCase()] = holding.average_buy_price;
              }
            } else {
              // Symbol too short, use average buy price as fallback
              priceMap[holding.token_address.toLowerCase()] = holding.average_buy_price;
            }
          } catch (e) {
            // Use average buy price as fallback if API fails
            priceMap[holding.token_address.toLowerCase()] = holding.average_buy_price;
          }
        })
      );

      // Get holdings with updated prices and correct calculations
      // First calculate total portfolio value (all tokens + USDT balance)
      const holdingsWithPrices = await getUserHoldings(currentUser.id, priceMap);
      
      // Calculate total portfolio value = 所有币种asset的总和
      // Total assets = sum of all token values (balanceUsd) + USDT balance
      const totalTokenValue = holdingsWithPrices.reduce((sum, token) => sum + token.balanceUsd, 0);
      const portfolioValue = totalTokenValue + balance; // 所有币种asset的总和
      setTotalPortfolioValue(portfolioValue);

      // Recalculate holdings with correct portfolio value for holding percent
      const holdingsWithCorrectPercent = await getUserHoldings(currentUser.id, priceMap, portfolioValue);

      // Recalculate holding percent for all tokens including USDT
      const allHoldingsWithPercent = [
        ...(balance > 0 ? [{
          ...allTokens[0],
          holdingPercent: portfolioValue > 0 ? (balance / portfolioValue) * 100 : 0,
        }] : []),
        ...holdingsWithCorrectPercent.map(token => ({
          ...token,
          holdingPercent: portfolioValue > 0 ? (token.balanceUsd / portfolioValue) * 100 : 0,
        }))
      ];
      
      setTokens(allHoldingsWithPercent);

      // Get activities (trades)
      const trades = await getUserActivities(currentUser.id, 50);
      setActivities(trades);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="flex-1 overflow-auto bg-[#0a0b0d]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0a0b0d] sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00ffa3] to-[#00cc83] flex items-center justify-center text-xl font-bold">
                {currentUser?.email?.charAt(0).toUpperCase() || currentUser?.walletAddress?.slice(2, 4).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-[13px] font-bold text-white">
                  {currentUser?.email || formatAddress(currentUser?.walletAddress || currentUser?.id || '')}
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {currentUser?.walletAddress || currentUser?.id || ''}
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center gap-6">
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-black">USDT余额</div>
                <div className="text-[13px] font-bold text-white font-mono">
                  {userBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-black">总资产</div>
                <div className="text-[13px] font-bold text-white font-mono">
                  ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const addr = currentUser?.walletAddress || currentUser?.id || '';
                  if (addr) {
                    navigator.clipboard.writeText(addr);
                  }
                }}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                title="复制地址"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors" title="二维码">
                <QrCode className="w-4 h-4" />
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={fetchData}
                className="px-3 py-1.5 rounded-lg bg-[#1a1b1f] border border-gray-800 text-[11px] font-bold text-gray-400 hover:text-white transition-colors"
              >
                刷新
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-4">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`pb-3 px-2 text-[13px] font-bold transition-colors border-b-2 ${
              activeTab === 'tokens'
                ? 'text-[#00ffa3] border-[#00ffa3]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            持有代币
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-2 text-[13px] font-bold transition-colors border-b-2 ${
              activeTab === 'activity'
                ? 'text-[#00ffa3] border-[#00ffa3]'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            活动
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#00ffa3] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'tokens' ? (
          /* 持有代币表格 */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-[#0a0b0d] sticky top-0 text-[10px] text-gray-600 font-black uppercase border-b border-gray-800/50 z-10">
                <tr>
                  <th className="px-4 py-3">币种/最后活跃</th>
                  <th className="px-4 py-3">未实现利润</th>
                  <th className="px-4 py-3">总利润</th>
                  <th className="px-4 py-3">余额</th>
                  <th className="px-4 py-3">持仓%</th>
                  <th className="px-4 py-3">持仓时长</th>
                  <th className="px-4 py-3">总买入/平均</th>
                  <th className="px-4 py-3">总卖出/平均</th>
                  <th className="px-4 py-3">交易数</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-mono divide-y divide-gray-800/30">
                {tokens.map((token, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] group border-b border-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link to={`/trade/${token.address}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1a1b1f] border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img src={token.image} alt={token.symbol} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{token.symbol}</span>
                            <span className="text-[#00ffa3] font-black text-[10px]">{token.name}</span>
                          </div>
                          <div className="text-[10px] text-gray-500">{token.lastActive}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className={token.unrealizedProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {token.unrealizedProfit >= 0 ? '+' : ''}{formatNumber(token.unrealizedProfit)}
                        </span>
                        <span className={`text-[10px] ${token.unrealizedProfitPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {token.unrealizedProfitPercent >= 0 ? '+' : ''}{token.unrealizedProfitPercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className={token.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {token.totalProfit >= 0 ? '+' : ''}{formatNumber(token.totalProfit)}
                        </span>
                        <span className={`text-[10px] ${token.totalProfitPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {token.totalProfitPercent >= 0 ? '+' : ''}{token.totalProfitPercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-gray-300">{token.balance.toFixed(4)} {token.symbol}</span>
                        <span className="text-[10px] text-gray-500">≈ {formatNumber(token.balanceUsd)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{token.holdingPercent.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-gray-500">{token.holdingDuration}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-gray-300">{formatNumber(token.totalBuy)}</span>
                        <span className="text-[10px] text-gray-500">${token.averageBuy.toFixed(7)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-gray-300">{formatNumber(token.totalSell)}</span>
                        <span className="text-[10px] text-gray-500">
                          {token.averageSell > 0 ? `$${token.averageSell.toFixed(7)}` : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{token.transactionCount}</td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* 活动表格 */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-[#0a0b0d] sticky top-0 text-[10px] text-gray-600 font-black uppercase border-b border-gray-800/50 z-10">
                <tr>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">币种</th>
                  <th className="px-4 py-3">市值</th>
                  <th className="px-4 py-3">数量</th>
                  <th className="px-4 py-3">总额 USD</th>
                  <th className="px-4 py-3">利润</th>
                  <th className="px-4 py-3">时长</th>
                  <th className="px-4 py-3">Gas费用</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-mono divide-y divide-gray-800/30">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-white/[0.03] group border-b border-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1.5 font-black ${activity.type === 'BUY' ? 'text-[#00ffa3]' : 'text-red-500'}`}>
                        {activity.type === 'BUY' ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                        {activity.type}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/trade/${activity.token.address}`} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-[#1a1b1f] border border-white/5 flex items-center justify-center overflow-hidden">
                          <img src={activity.token.image} alt={activity.token.symbol} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-white">{activity.token.symbol}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatNumber(activity.marketCap)}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {activity.quantity >= 1000 
                        ? `${(activity.quantity / 1000).toFixed(2)}K`
                        : activity.quantity >= 1
                        ? activity.quantity.toFixed(4)
                        : activity.quantity.toFixed(6)
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-300">{formatNumber(activity.totalUsd)}</td>
                    <td className="px-4 py-3">
                      {activity.profit !== undefined ? (
                        <div className="flex flex-col">
                          <span className={activity.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {activity.profit >= 0 ? '+' : ''}{formatNumber(activity.profit)}
                          </span>
                          {activity.profitPercent !== undefined && (
                            <span className={`text-[10px] ${activity.profitPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {activity.profitPercent >= 0 ? '+' : ''}{activity.profitPercent.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{activity.duration}</td>
                    <td className="px-4 py-3 text-gray-500">${activity.gasFee.toFixed(3)}</td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;

