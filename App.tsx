
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthModals from './components/AuthModals';
import Hot from './pages/Hot';
import Trade from './pages/Trade';
import Trenches from './pages/Trenches';
import Wallet from './pages/Wallet';
import { AuthMode, User } from './types';

const CURRENT_USER_KEY = 'gmgn_current_user';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(AuthMode.NONE);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    setAuthMode(AuthMode.NONE);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#0a0b0d] text-white selection:bg-[#00ffa3]/30">
        <Navbar 
          isLoggedIn={!!currentUser} 
          currentUser={currentUser}
          onOpenAuth={setAuthMode} 
          onLogout={handleLogout} 
        />
        
        <main className="flex-1 overflow-hidden flex flex-col">
          <Routes>
            <Route path="/" element={<Hot />} />
            <Route path="/trenches" element={<Trenches />} />
            <Route path="/trade/:pairAddress" element={<Trade isLoggedIn={!!currentUser} onOpenLogin={() => setAuthMode(AuthMode.LOGIN)} />} />
            <Route path="/wallet/:address" element={<Wallet />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <AuthModals 
          mode={authMode} 
          onClose={() => setAuthMode(AuthMode.NONE)} 
          onSwitch={setAuthMode}
          onLogin={handleLogin}
        />

        {/* Global Footer (Mimicking screenshot status bar) */}
        <footer className="h-7 bg-[#0a0b0d] border-t border-gray-800/50 flex items-center justify-between px-3 text-[10px] text-gray-500 font-medium">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Stable 47 MS | 60 FPS</div>
             <div className="flex items-center gap-1.5">战壕</div>
             <div className="flex items-center gap-1.5">钱包追踪</div>
             <div className="flex items-center gap-1.5">监控</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-orange-400 font-bold font-mono">₿ $87.6K</div>
            <div className="flex items-center gap-1 text-blue-400 font-bold font-mono">Ξ $123.11</div>
            <div className="flex items-center gap-1 text-[#00ffa3] font-bold font-mono">◎ $839.67</div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
