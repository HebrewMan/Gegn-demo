import React, { useState } from 'react';
import { X, Send, Mail, Ghost, Wallet, Loader2 } from 'lucide-react';
import { AuthMode, User } from '../types';
import { registerWithEmail, registerWithMetaMask, loginWithEmail, loginWithMetaMask } from '../services/userService';
import { connectMetaMask, signMessage, getSignMessage, isMetaMaskInstalled } from '../services/metamaskService';

interface AuthModalsProps {
  mode: AuthMode;
  onClose: () => void;
  onSwitch: (mode: AuthMode) => void;
  onLogin: (user: User) => void;
}

const AuthModals: React.FC<AuthModalsProps> = ({ mode, onClose, onSwitch, onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [metamaskLoading, setMetamaskLoading] = useState(false);

  const handleEmailAuth = async () => {
    setError('');
    setLoading(true);

    try {
      if (mode === AuthMode.REGISTER) {
        const result = await registerWithEmail(email);
        if (result.success && result.user) {
          onLogin(result.user);
        } else {
          setError(result.message || '注册失败');
        }
      } else {
        const result = await loginWithEmail(email);
        if (result.success && result.user) {
          onLogin(result.user);
        } else {
          setError(result.message || '登录失败');
        }
      }
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleMetaMaskAuth = async () => {
    setError('');
    setMetamaskLoading(true);

    try {
      if (!isMetaMaskInstalled()) {
        setError('请先安装 MetaMask 钱包');
        setMetamaskLoading(false);
        return;
      }

      // Connect to MetaMask
      const walletAddress = await connectMetaMask();
      
      // Generate message for signing
      const timestamp = Date.now();
      const message = getSignMessage(walletAddress, timestamp);
      
      // Request signature
      const signature = await signMessage(walletAddress, message);

      if (mode === AuthMode.REGISTER) {
        const result = await registerWithMetaMask(walletAddress, signature);
        if (result.success && result.user) {
          onLogin(result.user);
        } else {
          setError(result.message || '注册失败');
        }
      } else {
        const result = await loginWithMetaMask(walletAddress);
        if (result.success && result.user) {
          onLogin(result.user);
        } else {
          setError(result.message || '登录失败');
        }
      }
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setMetamaskLoading(false);
    }
  };

  if (mode === AuthMode.NONE) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`relative bg-[#1a1b1f] border border-gray-800 rounded-2xl overflow-hidden w-full max-w-2xl flex flex-col md:flex-row shadow-2xl transition-all`}>
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white z-10">
          <X className="w-6 h-6" />
        </button>

        {/* Left Side: Forms */}
        <div className={`flex-1 p-8 ${mode === AuthMode.LOGIN ? 'md:border-r border-gray-800' : ''}`}>
          <h2 className="text-2xl font-bold mb-2">
            {mode === AuthMode.LOGIN ? '登录' : '注册'}
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            {mode === AuthMode.LOGIN ? (
              <>还没有账号？ <button onClick={() => onSwitch(AuthMode.REGISTER)} className="text-[#00ffa3] hover:underline">立即注册</button></>
            ) : (
              <>已有账号？ <button onClick={() => onSwitch(AuthMode.LOGIN)} className="text-[#00ffa3] hover:underline">去登录</button></>
            )}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase">邮箱</label>
              <input
                type="email"
                placeholder="输入邮箱"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleEmailAuth();
                  }
                }}
                className="w-full bg-[#0a0b0d] border border-gray-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00ffa3] transition-colors"
                disabled={loading}
              />
            </div>

            {mode === AuthMode.REGISTER && (
              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase">邀请码</label>
                <input
                  type="text"
                  placeholder="邀请码"
                  className="w-full bg-[#0a0b0d] border border-gray-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00ffa3]"
                  value="kWLGG4LQ"
                  readOnly
                />
                <p className="text-[10px] text-gray-500 mt-1">邀请码绑定后不可修改，请保证输入正确的邀请码</p>
              </div>
            )}

            <button 
              onClick={handleEmailAuth}
              disabled={loading || !email.trim()}
              className="w-full bg-[#00ffa3] text-black font-bold py-3 rounded-lg hover:bg-[#00e692] transition-colors mt-4 shadow-lg shadow-[#00ffa3]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === AuthMode.LOGIN ? '登录中...' : '注册中...'}
                </>
              ) : (
                mode === AuthMode.LOGIN ? '登录' : '注册'
              )}
            </button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-800"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a1b1f] px-2 text-gray-500">
                {mode === AuthMode.LOGIN ? '或者' : '其它注册方式'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <SocialButton 
              icon={<Send className="w-5 h-5 text-blue-400" />} 
              label="Telegram" 
              onClick={() => setError('Telegram 登录功能暂未开放')}
            />
            <SocialButton 
              icon={<Ghost className="w-5 h-5 text-purple-400" />} 
              label="Phantom" 
              onClick={() => setError('Phantom 登录功能暂未开放')}
            />
            <SocialButton 
              icon={<Wallet className="w-5 h-5 text-orange-400" />} 
              label="MetaMask" 
              onClick={handleMetaMaskAuth}
              loading={metamaskLoading}
            />
          </div>

          <div className="mt-8 flex justify-center gap-4 text-[10px] text-gray-500">
            <a href="#" className="hover:text-gray-300">服务条款</a>
            <span>|</span>
            <a href="#" className="hover:text-gray-300">隐私政策</a>
          </div>
        </div>

        {/* Right Side: QR Code (Only for Login) */}
        {mode === AuthMode.LOGIN && (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 bg-[#0a0b0d]">
            <div className="bg-white p-4 rounded-xl mb-6 shadow-xl">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=gmgn-clone" alt="QR Code" className="w-40 h-40" />
            </div>
            <p className="text-sm text-gray-400 text-center">
              请使用<span className="text-[#00ffa3]">手机App</span>扫描二维码登录
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const SocialButton: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  onClick?: () => void;
  loading?: boolean;
}> = ({ icon, label, onClick, loading }) => (
  <button 
    onClick={onClick}
    disabled={loading}
    className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
      {loading ? <Loader2 className="w-5 h-5 text-orange-400 animate-spin" /> : icon}
    </div>
    <span className="text-[10px] text-gray-400">{label}</span>
  </button>
);

export default AuthModals;
