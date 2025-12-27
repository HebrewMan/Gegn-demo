import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Copy, QrCode, ChevronDown, Share2, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, ExternalLink, Search
} from 'lucide-react';
import { WalletToken, WalletActivity } from '../types';
import { getMockWalletTokens, getMockWalletActivities } from '../services/walletData';

const Wallet: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens');
  const [tokens, setTokens] = useState<WalletToken[]>([]);
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;
      setIsLoading(true);
      try {
        const [tokensData, activitiesData] = await Promise.all([
          getMockWalletTokens(address),
          getMockWalletActivities(address, 50)
        ]);
        setTokens(tokensData);
        setActivities(activitiesData);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [address]);

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
                {address?.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <div className="text-[13px] font-bold text-white">{formatAddress(address || '')}</div>
                <div className="text-[10px] text-gray-500 font-mono">{address}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                <Copy className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                <QrCode className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-[#1a1b1f] border border-gray-800 text-[11px] font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                全部 <ChevronDown className="w-3 h-3" />
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
                  <th className="px-4 py-3">余额: USD</th>
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
                    <td className="px-4 py-3 text-gray-300">{formatNumber(token.balanceUsd)}</td>
                    <td className="px-4 py-3 text-gray-300">{token.holdingPercent.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-gray-500">{token.holdingDuration}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-gray-300">{formatNumber(token.totalBuy)}</span>
                        <span className="text-[10px] text-gray-500">{token.price}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-gray-300">{formatNumber(token.totalSell)}</span>
                        <span className="text-[10px] text-gray-500">{token.price}</span>
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
                    <td className="px-4 py-3 text-gray-300">{(activity.quantity / 1000).toFixed(2)}K</td>
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

