
import React, { useMemo } from 'react';
import { Song, ScheduleEntry } from '../types';

interface RadioStationProps {
  songs: Song[];
  activeSongId: string | null;
  schedule: ScheduleEntry[];
  stationStartTime: number;
}

const RadioStation: React.FC<RadioStationProps> = ({ songs, activeSongId, schedule, stationStartTime }) => {
  const currentSong = useMemo(() => songs.find(s => s && s.id === activeSongId), [songs, activeSongId]);
  
  const { history, nextSong } = useMemo(() => {
    if (songs.length === 0) return { history: [], nextSong: null };
    
    const totalLoop = songs.reduce((acc, s) => acc + (s?.duration || 180), 0) * 1000;
    const elapsed = (Date.now() - stationStartTime) % totalLoop;
    
    let running = 0;
    let currentIdx = 0;
    for (let i = 0; i < songs.length; i++) {
      const d = (songs[i]?.duration || 180) * 1000;
      if (elapsed < running + d) { 
        currentIdx = i; 
        break; 
      }
      running += d;
    }

    const next = songs[(currentIdx + 1) % songs.length];
    const hist = [];
    // Calculate past songs for history display
    for (let i = 1; i <= Math.min(5, songs.length - 1); i++) {
      const idx = (currentIdx - i + songs.length) % songs.length;
      hist.push(songs[idx]);
    }
    return { history: hist, nextSong: next };
  }, [songs, stationStartTime]);

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in duration-1000">
        <div className="w-24 h-24 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-8 animate-pulse">
           <svg className="w-10 h-10 text-purple-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </div>
        <h2 className="syncopate text-2xl md:text-3xl text-white font-bold tracking-tighter uppercase mb-4">Station Offline</h2>
        <p className="text-purple-300/30 text-[10px] font-black uppercase tracking-[0.4em]">Waiting for transmission from Studio Vault</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-1000">
      
      {/* GLOBAL STREAM INDICATOR */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Synchronized Global Broadcast</span>
        </div>
        <div className="flex gap-4">
           <span className="text-[8px] font-mono text-purple-400 uppercase">Live: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ON AIR HERO */}
      <div className="glass-card p-6 md:p-14 relative overflow-hidden border-t-4 border-t-purple-600 bg-gradient-to-br from-purple-900/10 to-transparent">
        <div className="absolute top-4 right-4">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 border border-red-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
              <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">On Air</span>
           </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="w-32 h-32 md:w-52 md:h-52 rounded-[2.5rem] bg-gradient-to-br from-purple-700 to-indigo-900 shadow-2xl flex items-center justify-center shrink-0 border border-white/5 relative overflow-hidden group">
             <div className="absolute inset-0 bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <svg className="w-16 h-16 md:w-24 md:h-24 text-white/90 drop-shadow-2xl relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
          
          <div className="flex-1 text-center md:text-left min-w-0">
            <span className="text-[10px] md:text-xs font-black text-purple-500/60 uppercase tracking-[0.4em] mb-4 block italic">Now Broadcasting</span>
            <h1 className="syncopate text-3xl md:text-6xl font-bold text-white tracking-tighter leading-none shimmer-text uppercase truncate">
              {currentSong?.title || 'Finding Signal...'}
            </h1>
            <p className="text-lg md:text-2xl font-bold text-white/30 uppercase tracking-[0.2em] mt-4 md:mt-6">
              {currentSong?.artist || 'Nova Radio'}
            </p>
          </div>
        </div>
      </div>

      {/* QUEUE & INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8 h-[400px] flex flex-col">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 border border-purple-500/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h2 className="text-lg font-bold uppercase tracking-tight italic">Broadcast History</h2>
           </div>
           <div className="space-y-1 overflow-y-auto custom-scroll flex-1 pr-2">
              {history.map((song, i) => (
                <div key={song.id + i} className="flex items-center gap-4 p-3 rounded-xl border border-transparent hover:bg-white/[0.02] hover:border-white/5 transition-all">
                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 text-[10px] font-black">{history.length - i}</div>
                   <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs truncate uppercase text-white/60">{song.title}</h4>
                      <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{song.artist}</p>
                   </div>
                </div>
              ))}
              {history.length === 0 && <p className="text-white/10 text-[10px] font-black uppercase tracking-widest text-center py-10">Starting Rotation...</p>}
           </div>
        </div>

        <div className="glass-card p-8 flex flex-col justify-between">
           <div>
              <span className="text-[10px] font-black text-purple-500/40 uppercase tracking-[0.3em] mb-4 block">Coming Up Next</span>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight truncate">{nextSong?.title || 'Rotation'}</h3>
              <p className="text-xs font-bold text-white/20 uppercase tracking-widest mt-2">{nextSong?.artist || 'Nova Radio'}</p>
           </div>
           <div className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-white font-black text-xs uppercase">Source</span>
                 <span className="text-[8px] text-white/20 font-bold uppercase">Studio Vault</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.5 9.5 0 0113.132 0"/></svg>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RadioStation;
