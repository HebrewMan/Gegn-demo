
import React from 'react';

const Trenches: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0b0d] text-gray-500 p-8 text-center">
      <div className="w-20 h-20 bg-gray-800/50 rounded-3xl flex items-center justify-center mb-6 border border-gray-700 shadow-2xl">
        <span className="text-4xl animate-pulse">👷‍♂️</span>
      </div>
      <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">战壕模式 (Trenches Mode)</h1>
      <p className="text-sm max-w-xs leading-relaxed text-gray-400 mb-8 font-medium">
        我们正在构建一个全新的实时代币监控系统。目前该功能正在内测中。
      </p>
      <div className="px-6 py-2 bg-[#00ffa3]/10 border border-[#00ffa3]/20 rounded-full text-[#00ffa3] text-[10px] font-black uppercase tracking-widest">
        Coming Soon 2025
      </div>
    </div>
  );
};

export default Trenches;
