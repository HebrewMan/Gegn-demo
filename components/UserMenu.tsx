import React, { useState } from 'react';
import { X, Copy, RefreshCw, ArrowUpDown, Share2, ChevronRight, Infinity, Folder, Shield, DollarSign, LogOut, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface UserMenuProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onClose, onLogout }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    const address = user.walletAddress || '';
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayAddress = user.walletAddress 
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : user.email || '';

  const actionButtons = [
    { icon: <RefreshCw className="w-5 h-5" />, label: '充值', onClick: () => {} },
    { icon: <RefreshCw className="w-5 h-5" />, label: '法币买币', onClick: () => {} },
    { icon: <RefreshCw className="w-5 h-5" />, label: '提取', onClick: () => {} },
    { icon: <Share2 className="w-5 h-5" />, label: '归集', onClick: () => {} },
    { icon: <Share2 className="w-5 h-5" />, label: '分发', onClick: () => {} },
    { icon: <ArrowUpDown className="w-5 h-5" />, label: '转账', onClick: () => {} },
    { icon: <Infinity className="w-5 h-5" />, label: '跨链兑换', onClick: () => {} },
  ];

  const menuItems = [
    { icon: <Folder className="w-5 h-5" />, label: '我的资产', onClick: () => {} },
    { 
      icon: <Shield className="w-5 h-5" />, 
      label: '账户安全', 
      onClick: () => {},
      badge: '未绑定',
      badgeColor: 'text-red-500'
    },
    { icon: <DollarSign className="w-5 h-5" />, label: '邀请返佣', onClick: () => {} },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-[#1a1b1f] border border-gray-800 rounded-2xl overflow-hidden w-full max-w-md shadow-2xl">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-gray-400 hover:text-white z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header: BNB Balance */}
          <div className="mb-6">
            <div className="text-sm text-gray-400 mb-2">BNB总余额</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-yellow-500 font-bold text-lg">B</span>
              </div>
              <div>
                <div className="text-xl font-bold text-white">
                  {user.balance.toFixed(4)} <span className="text-sm text-gray-400">$</span>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Address */}
          {user.walletAddress && (
            <div className="mb-6 flex items-center justify-between p-3 bg-[#0a0b0d] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-mono">{displayAddress}</span>
              </div>
              <button
                onClick={handleCopyAddress}
                className="text-gray-400 hover:text-[#00ffa3] transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-[#00ffa3]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Action Grid */}
          <div className="mb-6">
            <div className="grid grid-cols-4 gap-3">
              {actionButtons.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-2 p-3 bg-[#0a0b0d] rounded-lg border border-gray-800 hover:border-[#00ffa3]/50 transition-colors"
                >
                  <div className="text-gray-400">{action.icon}</div>
                  <span className="text-[11px] text-gray-400">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="mb-6 space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-3 bg-[#0a0b0d] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-400">{item.icon}</div>
                  <span className="text-sm text-gray-300">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] ${item.badgeColor || 'text-gray-500'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            ))}
          </div>

          {/* Promotional Banner */}
          <div className="mb-6 relative overflow-hidden rounded-lg bg-gradient-to-r from-[#00ffa3] to-blue-500 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🏆</span>
                </div>
                <span className="text-white font-bold text-sm">GMGN交易赛 S9</span>
              </div>
              <div className="text-white text-2xl">⭐</div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 p-3 bg-[#0a0b0d] rounded-lg border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">断开连接</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserMenu;

