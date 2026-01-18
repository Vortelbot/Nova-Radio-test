
import React from 'react';
import { AppView, User } from '../types';

interface NavbarProps {
  view: AppView;
  setView: (v: any) => void;
  currentUser: User | null;
  onLogout: () => void;
  isActive: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ view, setView, currentUser, onLogout, isActive }) => {
  const navItems = [
    { label: 'Bots', id: 'bots' },
    { label: 'Team', id: 'team' },
  ];
  const navItemsRight = [
    { label: 'Partner', id: 'partner' },
    { label: 'Story', id: 'geschichte' },
  ];

  const NavLink: React.FC<{ item: { label: string; id: string } }> = ({ item }) => {
    const isCurrent = view === (item.id as any);
    return (
      <button 
        onClick={() => setView(item.id)} 
        className={`relative group px-2 md:px-4 py-2 transition-all duration-300 flex flex-col items-center pointer-events-auto`}
      >
        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all duration-300 ${isCurrent ? 'text-purple-400' : 'text-white/30 group-hover:text-white'}`}>
          {item.label}
        </span>
        <div className={`mt-1 h-0.5 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7] transition-all duration-500 ${isCurrent ? 'w-3 md:w-4' : 'w-0 group-hover:w-2 group-hover:bg-white/20'}`}></div>
      </button>
    );
  };

  return (
    <div className="w-full px-4 md:px-6 pt-4 md:pt-6 pb-2 sticky top-0 z-[100] pointer-events-none flex justify-center">
      <nav className="w-full max-w-5xl h-[60px] md:h-[72px] flex items-center glass-card pointer-events-auto border-white/5 bg-black/60 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
        
        {/* Left Side Navigation Group */}
        <div className="flex-1 flex justify-center items-center gap-2 md:gap-8">
          {navItems.map(item => (
            <NavLink key={item.id} item={item} />
          ))}
        </div>

        {/* Center Brand Area */}
        <div 
          className="flex flex-col items-center justify-center cursor-pointer group relative px-4 md:px-10 h-full border-x border-white/5" 
          onClick={() => setView(AppView.STATION)}
        >
          <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap">
            {isActive ? (
              <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 bg-red-600/10 border border-red-600/20 rounded-full scale-[0.7] md:scale-[0.8]">
                <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[5px] md:text-[6px] font-black text-red-500 uppercase tracking-widest">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 bg-white/5 border border-white/5 rounded-full scale-[0.7] md:scale-[0.8]">
                <span className="text-[5px] md:text-[6px] font-black text-white/20 uppercase tracking-widest">Off</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <h1 className="syncopate text-lg md:text-2xl font-bold text-white tracking-tighter leading-none group-hover:text-purple-400 transition-colors duration-500">
              NOVA
            </h1>
          </div>
          <span className="text-[6px] md:text-[8px] font-black text-purple-600 tracking-[0.4em] md:tracking-[0.6em] leading-none mt-1 opacity-60 group-hover:opacity-100 transition-opacity">RADIO</span>
        </div>

        {/* Right Side Navigation Group */}
        <div className="flex-1 flex justify-center items-center gap-2 md:gap-8">
          <div className="hidden sm:flex items-center gap-4 md:gap-8">
            {navItemsRight.map(item => (
              <NavLink key={item.id} item={item} />
            ))}
          </div>
          
          <div className="hidden sm:block w-px h-5 bg-white/10 mx-1"></div>

          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' ? (
              <button 
                onClick={() => setView(AppView.STUDIO)} 
                className={`px-3 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[7px] md:text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${view === AppView.STUDIO ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'}`}
              >
                Studio
              </button>
            ) : (
              !currentUser && (
                <button 
                  onClick={() => setView(AppView.AUTH)} 
                  className="text-[7px] md:text-[9px] font-black text-white/20 hover:text-white uppercase tracking-[0.2em] px-2 py-1 transition-colors"
                >
                  Login
                </button>
              )
            )}

            {currentUser && (
              <button 
                onClick={onLogout} 
                className="p-1.5 md:p-2 text-white/20 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-lg group"
                title="Logout"
              >
                <svg className="w-3.5 h-3.5 md:w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
