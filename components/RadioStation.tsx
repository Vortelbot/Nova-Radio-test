
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
  const todayStr = new Date().toISOString().split('T')[0];
  
  const { history, nextSong } = useMemo(() => {
    if (songs.length === 0) return { history: [], nextSong: null };
    
    const totalLoopDuration = songs.reduce((acc, s) => acc + (s?.duration || 180), 0) * 1000;
    const currentTime = Date.now();
    const timeSinceStart = currentTime - stationStartTime;
    const currentLoopElapsed = timeSinceStart % totalLoopDuration;
    
    let runningSum = 0;
    let currentIndex = 0;
    for (let i = 0; i < songs.length; i++) {
      const dur = (songs[i]?.duration || 180) * 1000;
      if (currentLoopElapsed < runningSum + dur) {
        currentIndex = i;
        break;
      }
      runningSum += dur;
    }

    const nextIndex = (currentIndex + 1) % songs.length;
    const next = songs[nextIndex];

    const hist: Song[] = [];
    // We only show songs that finished playing in the last 24 hours OR the last 10 tracks
    // for a better "History" feeling.
    let tempIdx = currentIndex;
    for (let i = 0; i < Math.min(songs.length - 1, 10); i++) {
      tempIdx = (tempIdx - 1 + songs.length) % songs.length;
      const prevSong = songs[tempIdx];
      if (prevSong && prevSong.id !== activeSongId) {
        hist.push(prevSong);
      }
    }

    return { history: hist, nextSong: next };
  }, [songs, activeSongId, stationStartTime]);

  const todaysScheduleItems = useMemo(() => {
    return schedule
      .filter(s => s && s.date === todayStr)
      .sort((a, b) => a.hour - b.hour)
      .map(entry => {
        const song = songs.find(s => s && s.id === entry.songId);
        return { ...entry, song };
      });
  }, [schedule, songs, todayStr]);

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center animate-in fade-in zoom-in duration-1000">
        <div className="w-20 h-20 bg-purple-600/10 rounded-3xl border border-purple-500/20 flex items-center justify-center mb-8 shadow-2xl">
          <svg className="w-10 h-10 text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth="1.5" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        <h1 className="syncopate text-3xl font-bold text-white uppercase italic tracking-tighter mb-4">Bereit zum Senden</h1>
        <p className="text-white/30 text-xs font-black uppercase tracking-[0.3em] mb-10">Keine Tracks im Archiv gefunden</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-1000 pb-20">
      
      {/* ON AIR SECTION */}
      <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 glass-card p-10 flex items-center gap-10 relative overflow-hidden group border-l-4 border-l-purple-500">
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-900 shadow-2xl flex-shrink-0 flex items-center justify-center active-glow relative z-10">
             <svg className="w-12 h-12 text-white relative z-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
          
          <div className="flex-1 min-w-0 relative z-10">
            <div className="flex items-center gap-2 mb-4">
               <div className="px-2 py-0.5 bg-red-600/20 rounded border border-red-500/30 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></div>
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Live On Air</span>
               </div>
               <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Nova Broadcast Console</span>
            </div>
            <h1 className="syncopate text-4xl md:text-6xl font-bold text-white uppercase tracking-tighter truncate leading-none shimmer-text">
              {currentSong ? currentSong.title : 'No Signal'}
            </h1>
            <p className="text-purple-400 font-bold uppercase tracking-[0.2em] text-sm mt-4">
              {currentSong ? currentSong.artist : 'Reconnecting...'}
            </p>
          </div>
        </div>

        <div className="glass-card p-8 border-l-4 border-l-blue-500/30 flex flex-col justify-center bg-blue-500/5">
           <span className="text-[9px] font-black text-blue-400/60 uppercase tracking-[0.3em] mb-3">Als Nächstes</span>
           <h3 className="text-lg font-bold text-white truncate uppercase tracking-tight">
             {nextSong ? nextSong.title : 'Rotation'}
           </h3>
           <p className="text-white/20 font-bold uppercase tracking-widest text-[9px] mt-2">
             {nextSong ? nextSong.artist : 'Loop'}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HISTORY */}
        <div className="glass-card p-8 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 border border-purple-500/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h2 className="text-lg font-bold uppercase tracking-tight italic">Letzte Tracks</h2>
            </div>
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Historie</span>
          </div>

          <div className="space-y-2 overflow-y-auto custom-scroll flex-1 pr-2">
            {history.map((song, idx) => (
              <div key={`${song.id}-${idx}`} className="flex items-center gap-4 group hover:bg-white/[0.02] p-3 rounded-xl transition-all border border-transparent hover:border-white/5">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/10 group-hover:text-purple-500/40 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[11px] truncate uppercase tracking-tight text-white/60 group-hover:text-white transition-colors">{song.title}</h4>
                  <p className="text-[9px] text-white/20 truncate font-medium uppercase tracking-widest">{song.artist}</p>
                </div>
                <div className="text-right">
                   <div className="text-[8px] font-mono text-purple-500/30">BEENDET</div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
               <div className="flex flex-col items-center justify-center h-full opacity-10">
                  <p className="text-[10px] uppercase tracking-widest font-black italic">Warte auf Sendedaten...</p>
               </div>
            )}
          </div>
        </div>

        {/* SCHEDULE */}
        <div className="glass-card p-8 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 border border-blue-500/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg>
              </div>
              <h2 className="text-lg font-bold uppercase tracking-tight italic">Sendeplan</h2>
            </div>
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Programm</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll pr-2 space-y-3">
            {todaysScheduleItems.length > 0 ? (
              todaysScheduleItems.map((entry) => (
                <div key={`${entry.date}-${entry.hour}`} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${new Date().getHours() === entry.hour ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                  <div className="w-12 text-center">
                    <span className="mono text-sm font-black text-blue-400/60">{entry.hour.toString().padStart(2, '0')}:00</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-[11px] uppercase truncate ${new Date().getHours() === entry.hour ? 'text-white' : 'text-white/40'}`}>
                      {entry.song ? entry.song.title : 'Standard Rotation'}
                    </h4>
                  </div>
                  {new Date().getHours() === entry.hour && (
                    <div className="px-2 py-0.5 bg-blue-500/20 rounded text-[7px] font-black text-blue-400 uppercase animate-pulse">On Air</div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                <p className="text-[10px] uppercase tracking-widest font-black italic">Keine geplanten Shows</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadioStation;
