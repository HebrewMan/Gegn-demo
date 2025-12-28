
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Filter, Zap, LayoutGrid, List, Search } from 'lucide-react';
import { getTrendingTokens, HotToken } from '../services/dexScreener';

const Hot: React.FC = () => {
  const [hotTokens, setHotTokens] = useState<HotToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch hot tokens function
  const fetchHotTokens = React.useCallback(async () => {
    try {
      const tokens = await getTrendingTokens(20);
      setHotTokens(tokens);
    } catch (error) {
      console.error('Error fetching hot tokens:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    setIsLoading(true);
    fetchHotTokens().finally(() => setIsLoading(false));
  }, [fetchHotTokens]);

  // Polling: Update data every 2 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchHotTokens();
    }, 2000); // 2 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchHotTokens]);
  return (
    <div className="flex-1 overflow-auto bg-[#0a0b0d] flex flex-col">
      {/* Search Overlay for Hot page logic (mimicking UI) */}
      <div className="h-14 px-6 border-b border-gray-800/50 flex items-center justify-between sticky top-0 bg-[#0a0b0d] z-20">
        <div className="flex items-center gap-8 h-full">
          <div className="flex items-center gap-6 h-full">
            <TabItem label="新币" />
            <TabItem label="热门" active />
            <TabItem label="币安" />
            <TabItem label="飙升" />
            <TabItem label="下个蓝筹" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-1.5 text-gray-500 hover:text-white transition-colors"><LayoutGrid className="w-4 h-4" /></button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1b1f] border border-gray-800 text-[11px] font-bold text-gray-400 hover:border-gray-600 transition-colors">
            <Filter className="w-3.5 h-3.5" /> 筛选
          </button>
          <div className="flex bg-[#1a1b1f] border border-gray-800 rounded p-0.5">
            <button className="px-2 py-1 text-[10px] bg-gray-700 text-white rounded font-bold">P1</button>
            <button className="px-2 py-1 text-[10px] text-gray-500 hover:text-white font-bold transition-colors">P2</button>
            <button className="px-2 py-1 text-[10px] text-gray-500 hover:text-white font-bold transition-colors">P3</button>
          </div>
        </div>
      </div>

      <div className="p-0 overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse table-fixed min-w-[1300px]">
          <thead className="bg-[#0a0b0d] sticky top-0 z-10">
            <tr className="text-[10px] text-gray-500 font-bold uppercase tracking-wider border-b border-gray-800 bg-[#0a0b0d]">
              <th className="px-4 py-3.5 w-20">排名 / 评分 <ChevronDown className="inline w-3 h-3 ml-1" /></th>
              <th className="px-4 py-3.5 w-56">币种 / 时间 <ChevronDown className="inline w-3 h-3 ml-1" /></th>
              <th className="px-4 py-3.5 w-32 text-center">广场热度值 <ChevronDown className="inline w-3 h-3 ml-1" /></th>
              <th className="px-4 py-3.5 w-32">价格 <ChevronDown className="inline w-3 h-3 ml-1" /></th>
              <th className="px-4 py-3.5 w-32">历史最高市值 <ChevronDown className="inline w-3 h-3 ml-1" /></th>
              <th className="px-4 py-3.5 w-24">池子 <ChevronDown className="inline w-3 h-3 ml-1" /></th>
              <th className="px-4 py-3.5 w-28">成交额 <ChevronDown className="inline w-3 h-3 ml-1" /></th>
              <th className="px-4 py-3.5 w-36">交易数 <ChevronDown className="inline w-3 h-3 ml-1" /></th>
              <th className="px-4 py-3.5 w-24">持有者 <ChevronDown className="inline w-3 h-3 ml-1" /></th>
              <th className="px-4 py-3.5 w-32">总手续费 <ChevronDown className="inline w-3 h-3 ml-1" /></th>
              <th className="px-4 py-3.5 w-48">代币信息</th>
              <th className="px-4 py-3.5 w-28 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/30">
            {isLoading ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="w-5 h-5 border-2 border-[#00ffa3] border-t-transparent rounded-full animate-spin"></div>
                    <span>加载中...</span>
                  </div>
                </td>
              </tr>
            ) : hotTokens.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              hotTokens.map((token, i) => (
                <tr key={i} className="group hover:bg-white/[0.03] transition-colors text-[12px] font-medium border-b border-gray-800/20">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-bold">{token.rank || i + 1}</span>
                      <span className="text-gray-500 text-[10px] font-mono">{token.rating?.toFixed(2) || '3.5'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Link 
                      to={`/trade/${token.address}`}
                      state={{ 
                        token: {
                          name: token.name,
                          symbol: token.symbol,
                          price: token.price,
                          address: token.address,
                          image: token.image
                        }
                      }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#1a1b1f] border border-white/5 flex items-center justify-center text-xl shadow-inner overflow-hidden flex-shrink-0">
                        {token.image ? (
                          <img 
                            src={token.image} 
                            alt={token.symbol}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('span')) {
                                const fallback = document.createElement('span');
                                fallback.className = 'group-hover:scale-110 transition-transform';
                                fallback.textContent = token.icon || '💰';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <span className="group-hover:scale-110 transition-transform">{token.icon || '💰'}</span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-bold text-gray-200 text-[13px]">{token.name}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono mt-0.5">
                          <span className="text-orange-400 font-bold">{token.time || '1h'}</span>
                          <span className="opacity-60">{token.symbol}</span>
                          <span className="opacity-60">{token.address.slice(0, 4)}...{token.address.slice(-4)}</span>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-gray-400">0</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col font-mono">
                      <span className="text-yellow-500 font-bold">{token.price || '$0'}</span>
                      <span className={`text-[10px] ${token.mcapGrowth?.startsWith('+') ? 'text-green-500' : token.mcapGrowth?.startsWith('-') ? 'text-red-500' : 'text-gray-500'}`}>{token.mcapGrowth || '0%'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-yellow-500/80">{token.peakMcap || '$0'}</td>
                  <td className="px-4 py-4 font-mono text-gray-300">{token.pool || '$0'}</td>
                  <td className="px-4 py-4 font-mono text-blue-400 font-bold">{token.volume || '$0'}</td>
                  <td className="px-4 py-4 font-mono">
                     <div className="flex flex-col">
                       <span className="text-gray-300 font-bold">{token.txns || '0'}</span>
                       <span className="text-[10px] text-gray-500">
                         <span className="text-green-500">{token.txnsSplit?.split('/')[0] || '0'}</span> / <span className="text-red-500">{token.txnsSplit?.split('/')[1] || '0'}</span>
                       </span>
                     </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-gray-300">{token.holders || '0'}</td>
                  <td className="px-4 py-4 font-mono text-red-400/80">{token.totalFee || '0 USDT'}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 items-center">
                      <Tag text="3%" color="green" />
                      <Tag text="DS" color="blue" />
                      <Tag text="2%" color="gray" />
                      <Tag text="未付费" color="red" />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link 
                      to={`/trade/${token.address}`}
                      state={{ 
                        token: {
                          name: token.name,
                          symbol: token.symbol,
                          price: token.price,
                          address: token.address,
                          image: token.image
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#00ffa3]/10 text-[#00ffa3] font-bold hover:bg-[#00ffa3] hover:text-black transition-all border border-[#00ffa3]/20"
                    >
                      <Zap className="w-3 h-3 fill-current" /> 买入
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TabItem = ({ label, active }: { label: string; active?: boolean }) => (
  <button className={`h-full px-2 flex items-center text-[13px] font-bold border-b-2 transition-all ${active ? 'text-[#00ffa3] border-[#00ffa3]' : 'text-gray-400 border-transparent hover:text-white'}`}>
    {label}
  </button>
);

const Tag = ({ text, color }: { text: string; color: string }) => {
  const colors: any = {
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    gray: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return <span className={`px-1.5 py-0.5 rounded text-[9px] border font-bold ${colors[color]}`}>{text}</span>;
};

export default Hot;
