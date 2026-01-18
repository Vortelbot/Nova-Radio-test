
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Song } from '../types';
import { formatTime } from '../services/audioUtils';

interface PlayerBarProps {
  activeSong: Song | null;
  songs: Song[];
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  stationStartTime: number;
  volume: number;
  setVolume: (v: number) => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ activeSong, songs, isMuted, setIsMuted, stationStartTime, volume, setVolume }) => {
  const [globalTime, setGlobalTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getOffset = useCallback(() => {
    if (!activeSong || !activeSong.id || songs.length === 0) return 0;
    const totalDuration = songs.reduce((acc, s) => acc + (s?.duration || 180), 0) * 1000;
    if (totalDuration === 0) return 0;
    
    const elapsed = (Date.now() - stationStartTime) % totalDuration;
    let runningSum = 0;
    for (const song of songs) {
      if (!song) continue;
      const songDur = (song.duration || 180) * 1000;
      if (song.id === activeSong.id) {
        return (elapsed - runningSum) / 1000;
      }
      runningSum += songDur;
    }
    return 0;
  }, [activeSong, songs, stationStartTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGlobalTime(getOffset());
    }, 500);
    return () => clearInterval(timer);
  }, [getOffset]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeSong?.url) {
      if (audio) audio.pause();
      return;
    }

    const syncAndPlay = async () => {
      if (!isMuted) {
        const offset = getOffset();
        if (Math.abs(audio.currentTime - offset) > 1.5) {
          audio.currentTime = Math.max(0, offset);
        }
        try {
          await audio.play();
        } catch (e) {
          console.warn("Autoplay blocked or interrupted", e);
        }
      } else {
        audio.pause();
      }
    };

    if (audio.src !== activeSong.url) {
      audio.src = activeSong.url;
      audio.load();
      audio.onloadeddata = syncAndPlay;
    } else {
      syncAndPlay();
    }
  }, [activeSong?.url, isMuted, getOffset]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggleListen = () => {
    setIsMuted(!isMuted);
  };

  const duration = activeSong?.duration || 180;
  const progress = (globalTime / duration) * 100;

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-24 bg-[#0a0112]/95 backdrop-blur-xl border-t border-white/5 px-8 flex items-center justify-between z-[200]">
      <audio ref={audioRef} crossOrigin="anonymous" />
      
      <div className="flex items-center gap-4 w-1/3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-800 to-indigo-900 shadow-2xl flex-shrink-0 flex items-center justify-center relative overflow-hidden">
           <div className={`absolute inset-0 bg-purple-500/10 ${!isMuted && activeSong ? 'animate-pulse' : ''}`}></div>
           <svg className="w-6 h-6 text-white/20 relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-white truncate uppercase tracking-tight">
             {activeSong ? activeSong.title : 'Nothings Right now here'}
          </h4>
          <p className="text-[10px] text-white/40 truncate font-semibold uppercase tracking-widest mt-0.5">
             {activeSong ? `${activeSong.artist} • STATION LIVE` : 'Waiting for signal'}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 w-1/3">
        <div className="flex items-center gap-8">
           <button className="text-white/10 cursor-not-allowed"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
           <button 
             onClick={toggleListen}
             disabled={!activeSong}
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${!isMuted && activeSong ? 'bg-white text-black active-glow' : 'bg-white/10 text-white hover:bg-white/20'} ${!activeSong ? 'opacity-20 cursor-not-allowed' : ''}`}
           >
             {!isMuted && activeSong ? (
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
             ) : (
               <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
             )}
           </button>
           <button className="text-white/10 cursor-not-allowed"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6zM16 6v12h2V6z"/></svg></button>
        </div>
        
        {activeSong && (
          <div className="w-full max-w-xs flex items-center gap-3">
             <span className="mono text-[9px] text-white/30 font-bold">{formatTime(globalTime)}</span>
             <div className="flex-1 h-1 bg-white/5 rounded-full relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-purple-500 shadow-[0_0_8px_#a855f7] transition-all duration-300" style={{ width: `${Math.min(100, progress)}%` }}></div>
             </div>
             <span className="mono text-[9px] text-white/30 font-bold">{formatTime(duration)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 w-1/3">
        <div className="flex items-center gap-3 w-32">
           <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 9H3a1 1 0 00-1 1v4a1 1 0 001 1h2l4 4V5L5 9z" /></svg>
           <div className="flex-1 h-1 bg-white/5 rounded-full relative">
              <input 
                type="range" min="0" max="1" step="0.01" value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
              <div className="h-full bg-white rounded-full" style={{ width: `${volume * 100}%` }}></div>
              <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" style={{ left: `calc(${volume * 100}% - 4px)` }}></div>
           </div>
           <span className="text-[10px] font-bold text-white/40 w-8">{Math.round(volume * 100)}%</span>
        </div>
      </div>
    </footer>
  );
};

export default PlayerBar;
