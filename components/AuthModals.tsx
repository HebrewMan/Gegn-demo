
import React, { useState } from 'react';
import { X, Send, Mail, Ghost, Wallet } from 'lucide-react';
import { AuthMode } from '../types';

interface AuthModalsProps {
  mode: AuthMode;
  onClose: () => void;
  onSwitch: (mode: AuthMode) => void;
  onLogin: () => void;
}

const AuthModals: React.FC<AuthModalsProps> = ({ mode, onClose, onSwitch, onLogin }) => {
  const [email, setEmail] = useState('');
  
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

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase">邮箱</label>
              <input
                type="email"
                placeholder="输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0b0d] border border-gray-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00ffa3] transition-colors"
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
              onClick={onLogin}
              className="w-full bg-[#00ffa3] text-black font-bold py-3 rounded-lg hover:bg-[#00e692] transition-colors mt-4 shadow-lg shadow-[#00ffa3]/10"
            >
              {mode === AuthMode.LOGIN ? '登录' : '注册'}
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
            <SocialButton icon={<Send className="w-5 h-5 text-blue-400" />} label="Telegram" />
            <SocialButton icon={<Ghost className="w-5 h-5 text-purple-400" />} label="Phantom" />
            <SocialButton icon={<Wallet className="w-5 h-5 text-orange-400" />} label="MetaMask" />
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

const SocialButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
      {icon}
    </div>
    <span className="text-[10px] text-gray-400">{label}</span>
  </button>
);

export default AuthModals;
