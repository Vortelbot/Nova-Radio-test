
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

interface StoredUser extends User {
  password: string;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Initialisiere die Benutzerdatenbank im localStorage, falls nicht vorhanden
  useEffect(() => {
    const users = localStorage.getItem('radio_users_db');
    if (!users) {
      const initialUsers: StoredUser[] = [
        { username: 'Julian', password: 'admin', role: 'admin' }
      ];
      localStorage.setItem('radio_users_db', JSON.stringify(initialUsers));
    }
  }, []);

  const getUsers = (): StoredUser[] => {
    const users = localStorage.getItem('radio_users_db');
    return users ? JSON.parse(users) : [];
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Bitte fülle alle Felder aus.');
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (user) {
      onLogin({ username: user.username, role: user.role });
    } else {
      setError('Ungültiger Benutzername oder Passwort.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Bitte fülle alle Felder aus.');
      return;
    }

    const users = getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      setError('Benutzername bereits vergeben.');
      return;
    }

    // Spezieller Check für Admin-Status
    const role = username.toLowerCase() === 'julian' ? 'admin' : 'user';
    const newUser: StoredUser = { username, password, role };
    
    const updatedUsers = [...users, newUser];
    localStorage.setItem('radio_users_db', JSON.stringify(updatedUsers));
    
    onLogin({ username: newUser.username, role: newUser.role });
  };

  return (
    <div className="max-w-md mx-auto py-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="glass-panel p-10 md:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border border-purple-500/20 bg-black/40 backdrop-blur-xl">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full"></div>
        
        <div className="text-center mb-10 relative z-10">
          <div className="w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-500/30 text-purple-400 animate-float">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 0a10.003 10.003 0 0110 10c0 1.033-.155 2.03-.44 2.962m-1.32 4.038L20 21M12 3v19" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic syncopate">
            {isLogin ? 'Welcome Back' : 'Join Nova'}
          </h2>
          <p className="text-purple-300/40 mt-2 font-black text-[9px] uppercase tracking-[0.4em]">
            {isLogin ? 'Enter your broadcast credentials' : 'Create your listener profile'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 relative z-10 border border-white/5">
          <button 
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isLogin ? 'bg-purple-600 text-white shadow-lg' : 'text-white/30 hover:text-white'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${!isLogin ? 'bg-purple-600 text-white shadow-lg' : 'text-white/30 hover:text-white'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-6 relative z-10">
          {error && (
            <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center animate-shake">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-purple-300/30 uppercase tracking-[0.3em] ml-4">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full bg-black/60 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold placeholder:text-white/5 text-sm" 
              placeholder="Your name..." 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-purple-300/30 uppercase tracking-[0.3em] ml-4">Security Phrase</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-black/60 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold placeholder:text-white/5 text-sm" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-5 bg-purple-600 text-white hover:bg-purple-500 rounded-2xl font-black shadow-[0_10px_30px_rgba(168,85,247,0.3)] transition-all uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02] active:scale-95 mt-4"
          >
            {isLogin ? 'Initiate Link' : 'Register Account'}
          </button>
        </form>

        <p className="text-center mt-8 text-[9px] font-bold text-white/10 uppercase tracking-widest relative z-10">
          Nova Radio Secure Protocol v2.4
        </p>
      </div>
    </div>
  );
};

export default Auth;
