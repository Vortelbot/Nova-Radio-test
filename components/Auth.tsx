
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Julian' && password === 'admin') {
      onLogin({ username: 'Julian', role: 'admin' });
    } else if (username && password) {
      onLogin({ username, role: 'user' });
    } else {
      setError('Zugriff verweigert.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 animate-in fade-in zoom-in-95 duration-700">
      <div className="glass-panel p-12 rounded-[4rem] shadow-2xl relative overflow-hidden border border-purple-500/20">
        {/* Glow behind logo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-600/20 blur-[60px] rounded-full"></div>
        
        <div className="text-center mb-12 relative z-10">
          <div className="w-20 h-20 bg-purple-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-purple-500/30 text-purple-300 animate-float">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 0a10.003 10.003 0 0110 10c0 1.033-.155 2.03-.44 2.962m-1.32 4.038L20 21M12 3v19" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Console</h2>
          <p className="text-purple-300/40 mt-3 font-black text-[10px] uppercase tracking-[0.4em]">Broadcast Credentials Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          {error && <div className="p-5 bg-red-600/10 border border-red-500/30 rounded-2xl text-red-500 text-[11px] font-black uppercase text-center animate-shake">{error}</div>}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-purple-300/30 uppercase tracking-[0.3em] ml-6">Admin Identity</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-5 text-white focus:outline-none focus:border-purple-500 transition-all font-bold placeholder:text-white/10" placeholder="Julian" />
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-purple-300/30 uppercase tracking-[0.3em] ml-6">Security Phrase</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-5 text-white focus:outline-none focus:border-purple-500 transition-all font-bold placeholder:text-white/10" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full py-6 bg-purple-600 text-white hover:bg-purple-500 rounded-[1.5rem] font-black shadow-[0_10px_30px_rgba(168,85,247,0.3)] transition-all uppercase tracking-[0.3em] text-[12px] hover:scale-[1.02] active:scale-95">Initiate Connection</button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
