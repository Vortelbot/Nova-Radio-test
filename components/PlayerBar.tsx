
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

  const duration = activeSong?.duration || 180;
  const progress = (globalTime / duration) * 100;

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-20 md:h-24 bg-[#0a0112]/90 backdrop-blur-2xl border-t border-white/5 z-[200] flex flex-col">
      <audio ref={audioRef} crossOrigin="anonymous" />
      
      {/* Dynamic Progress Line at the very top */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5">
        <div 
          className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7] transition-all duration-500 ease-linear" 
          style={{ width: `${Math.min(100, progress)}%` }}
        ></div>
      </div>

      <div className="flex-1 flex items-center justify-between px-4 md:px-10 gap-4">
        
        {/* Left: Song Info */}
        <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
          <div className="relative shrink-0">
            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-900 shadow-xl flex items-center justify-center overflow-hidden border border-white/10`}>
              {activeSong ? (
                <div className={`absolute inset-0 bg-purple-400/20 ${!isMuted ? 'animate-pulse' : ''}`}></div>
              ) : null}
              <svg className={`w-5 h-5 md:w-7 md:h-7 ${activeSong ? 'text-white' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            </div>
            {!isMuted && activeSong && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-[#0a0112] animate-ping"></div>
            )}
          </div>
          
          <div className="min-w-0">
            <h4 className="text-[11px] md:text-sm font-black text-white truncate uppercase tracking-tight leading-tight">
               {activeSong ? activeSong.title : 'Nova Offline'}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[8px] md:text-[10px] text-purple-400 font-bold truncate uppercase tracking-widest">
                 {activeSong ? activeSong.artist : 'Waiting for Signal'}
              </p>
              {activeSong && (
                <span className="text-[7px] md:text-[9px] text-white/20 font-mono hidden sm:block">
                  {formatTime(globalTime)} / {formatTime(duration)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Controls (Mobile: Right side) */}
        <div className="flex items-center justify-center shrink-0">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            disabled={!activeSong}
            className={`group relative w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${!isMuted && activeSong ? 'bg-white text-black scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-white hover:bg-white/10'} ${!activeSong ? 'opacity-10 cursor-not-allowed' : 'active:scale-90'}`}
          >
            {!isMuted && activeSong ? (
              <svg className="w-5 h-5 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-5 h-5 md:w-7 md:h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
            
            {/* Visualizer bars only visible on desktop and when playing */}
            {!isMuted && activeSong && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 hidden md:flex gap-[2px] items-end h-2">
                <div className="w-[2px] bg-black/40 h-1 animate-[bounce_0.8s_infinite]"></div>
                <div className="w-[2px] bg-black/40 h-2 animate-[bounce_1.1s_infinite]"></div>
                <div className="w-[2px] bg-black/40 h-1.5 animate-[bounce_0.9s_infinite]"></div>
              </div>
            )}
          </button>
        </div>

        {/* Right: Volume & Extra (Desktop Only) */}
        <div className="hidden lg:flex items-center justify-end gap-6 flex-1">
          <div className="flex items-center gap-3 w-32">
             <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 9H3a1 1 0 00-1 1v4a1 1 0 001 1h2l4 4V5L5 9z" />
             </svg>
             <div className="flex-1 h-[3px] bg-white/5 rounded-full relative group">
                <input 
                  type="range" min="0" max="1" step="0.01" value={volume}
                  onChange={e => setVolume(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-purple-400 transition-colors" style={{ width: `${volume * 100}%` }}></div>
             </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">HQ Stereo</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default PlayerBar;
