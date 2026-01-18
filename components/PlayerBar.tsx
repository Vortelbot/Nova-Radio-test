
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
  const [localTime, setLocalTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Berechnet, an welcher Stelle des aktuellen Songs wir gerade sein MÜSSEN
  const getGlobalOffset = useCallback(() => {
    if (!activeSong || songs.length === 0) return 0;
    const totalDuration = songs.reduce((acc, s) => acc + (s?.duration || 180), 0) * 1000;
    const elapsed = (Date.now() - stationStartTime) % totalDuration;
    
    let runningSum = 0;
    for (const song of songs) {
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
      setLocalTime(getGlobalOffset());
    }, 500);
    return () => clearInterval(timer);
  }, [getGlobalOffset]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeSong?.url) {
      if (audio) audio.pause();
      return;
    }

    const syncAndPlay = () => {
      if (!isMuted) {
        const offset = getGlobalOffset();
        // Wenn die lokale Zeit mehr als 1.5s abweicht, erzwingen wir den Sprung (Global Sync)
        if (Math.abs(audio.currentTime - offset) > 1.5) {
          audio.currentTime = Math.max(0, offset);
        }
        audio.play().catch(() => {});
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
  }, [activeSong, isMuted, getGlobalOffset]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const duration = activeSong?.duration || 180;
  const progress = (localTime / duration) * 100;

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-20 md:h-24 bg-[#0a0112]/95 backdrop-blur-2xl border-t border-white/5 z-[200] flex flex-col">
      <audio ref={audioRef} crossOrigin="anonymous" />
      
      <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5">
        <div 
          className="h-full bg-purple-500 shadow-[0_0_15px_#a855f7] transition-all duration-500 ease-linear" 
          style={{ width: `${Math.min(100, progress)}%` }}
        ></div>
      </div>

      <div className="flex-1 flex items-center justify-between px-4 md:px-10 gap-4">
        <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
          <div className="relative shrink-0">
            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-900 shadow-xl flex items-center justify-center border border-white/10`}>
              <svg className={`w-5 h-5 md:w-7 md:h-7 ${activeSong ? 'text-white' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            </div>
            {!isMuted && activeSong && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-[#0a0112] animate-ping"></div>
            )}
          </div>
          
          <div className="min-w-0">
            <h4 className="text-[11px] md:text-sm font-black text-white truncate uppercase tracking-tight leading-tight">
               {activeSong ? activeSong.title : 'Radio Nova'}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[8px] md:text-[10px] text-purple-400 font-bold truncate uppercase tracking-widest">
                 {activeSong ? activeSong.artist : 'Global Stream'}
              </p>
              <span className="text-[7px] md:text-[9px] text-white/20 font-mono hidden sm:block uppercase">
                {formatTime(localTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center shrink-0">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all ${!isMuted ? 'bg-white text-black scale-105 shadow-2xl' : 'bg-white/5 text-white hover:bg-white/10'}`}
          >
            {!isMuted ? (
              <svg className="w-5 h-5 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-5 h-5 md:w-7 md:h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
        </div>

        <div className="hidden lg:flex items-center justify-end gap-6 flex-1">
          <div className="flex flex-col items-end mr-4">
             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Sync</span>
             <span className="text-[8px] font-mono text-purple-500/50 uppercase">Active</span>
          </div>
          <div className="w-24 h-[3px] bg-white/5 rounded-full relative group">
             <input 
               type="range" min="0" max="1" step="0.01" value={volume}
               onChange={e => setVolume(parseFloat(e.target.value))}
               className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
             />
             <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full" style={{ width: `${volume * 100}%` }}></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PlayerBar;
