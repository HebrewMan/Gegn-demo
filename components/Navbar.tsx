
import React, { useState } from 'react';
import { Search, Star, Trophy, Smartphone, ChevronDown, Settings, Bell } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';
import UserMenu from './UserMenu';
import Logo from './Logo';

interface NavbarProps {
  isLoggedIn: boolean;
  currentUser?: User | null;
  onOpenAuth: (mode: any) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, currentUser, onOpenAuth, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { label: '战壕', path: '/trenches' },
    { label: '热门', path: '/' },
    { label: '跟单', path: '#' },
    { label: '监控', path: '#' },
    { label: '追踪', path: '#' },
    { label: '资产', path: '#' },
    { label: '奖励', path: '#' },
  ];

  return (
    <nav className="h-12 border-b border-gray-800 bg-[#0a0b0d] flex items-center px-4 sticky top-0 z-[60]">
      <div className="flex items-center gap-6 flex-1">
        <Link to="/" className="flex items-center gap-1.5">
          <Logo className="h-7" showText={true} />
        </Link>

        <div className="hidden lg:flex items-center gap-5">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`text-sm font-bold transition-colors ${
                (location.pathname === item.path || (item.path === '/' && location.pathname === '/')) 
                ? 'text-[#00ffa3]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center bg-[#1a1b1f] border border-gray-800 rounded-lg px-2.5 py-1.5 w-60 group focus-within:border-gray-600 transition-all">
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="搜索代币名称, 合约, 钱包"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                const query = searchQuery.trim();
                // Check if it's a wallet address (starts with 0x and has 42 characters)
                if (query.startsWith('0x') && query.length === 42) {
                  navigate(`/wallet/${query}`);
                  setSearchQuery('');
                } else {
                  // Otherwise, search for token
                  navigate(`/trade/${query}`);
                  setSearchQuery('');
                }
              }
            }}
            className="bg-transparent border-none text-[11px] text-gray-300 focus:outline-none w-full ml-2 placeholder:text-gray-600"
          />
          <span className="text-[10px] text-gray-700 font-mono">/</span>
        </div>

        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1b1f] border border-gray-800 text-yellow-500 hover:bg-gray-800 transition-colors">
          <Trophy className="w-3.5 h-3.5 fill-yellow-500/20" />
          <span className="text-[11px] font-bold">2025</span>
        </button>

        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1b1f] border border-gray-800 text-[#00ffa3] hover:bg-gray-800">
          <Smartphone className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase">App</span>
        </button>

        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#1a1b1f] border border-gray-800 cursor-pointer hover:bg-gray-800">
          <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[8px] text-black font-bold">B</div>
          <span className="text-[11px] font-bold">BSC</span>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </div>
        
        <div className="h-5 w-px bg-gray-800 mx-1"></div>

        <div className="flex items-center gap-3">
          <Star className="w-4 h-4 text-gray-500 hover:text-yellow-500 cursor-pointer" />
          <Settings className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" />
          
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div className="text-[11px] text-gray-400">
                {currentUser?.email || (currentUser?.walletAddress ? `${currentUser.walletAddress.slice(0, 6)}...${currentUser.walletAddress.slice(-4)}` : '')}
              </div>
              <div className="text-[10px] text-[#00ffa3] font-bold">
                {currentUser?.balance.toFixed(2)} USDT
              </div>
              <button 
                onClick={() => setShowUserMenu(true)} 
                className="w-8 h-8 rounded-full border border-gray-700 bg-gray-800 flex items-center justify-center overflow-hidden hover:border-[#00ffa3] transition-colors cursor-pointer"
              >
                <img src="https://picsum.photos/32/32?random=auth" alt="" />
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => onOpenAuth('REGISTER')} className="text-[12px] font-bold text-gray-400 hover:text-white px-2">注册</button>
              <button onClick={() => onOpenAuth('LOGIN')} className="h-8 px-4 rounded-lg bg-white text-black font-bold text-[12px] hover:bg-gray-200 transition-colors">登录</button>
            </>
          )}
        </div>
      </div>

      {/* User Menu Modal */}
      {showUserMenu && currentUser && (
        <UserMenu
          user={currentUser}
          onClose={() => setShowUserMenu(false)}
          onLogout={onLogout}
        />
      )}
    </nav>
  );
};

export default Navbar;
