
import React, { useState } from 'react';
import { Song, ScheduleEntry } from '../types';
import { saveSongData, deleteSongData } from '../services/db';

interface StudioProps {
  songs: Song[];
  onUpdateSongs: (songs: Song[]) => void;
  schedule: ScheduleEntry[];
  onUpdateSchedule: (schedule: ScheduleEntry[]) => void;
  onDirectPlay: (songId: string) => void;
}

const Studio: React.FC<StudioProps> = ({ songs, onUpdateSongs, schedule, onUpdateSchedule, onDirectPlay }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'planner'>('library');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'track' | 'show'>('track');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const newSongs: Song[] = [...songs];
    for (const file of Array.from(files) as File[]) {
      const id = Math.random().toString(36).substr(2, 9);
      const arrayBuffer = await file.arrayBuffer();
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      const duration = await new Promise<number>((r) => { audio.onloadedmetadata = () => r(audio.duration); });
      await saveSongData({ id, data: arrayBuffer, mimeType: file.type });
      
      let rawTitle = file.name.replace(/\.[^/.]+$/, "");
      let artist = uploadType === 'show' ? 'Broadcast Special' : 'Unknown';
      let title = rawTitle;
      if (rawTitle.includes('-')) {
        const parts = rawTitle.split('-');
        artist = parts[0].trim();
        title = parts.slice(1).join('-').trim();
      }
      newSongs.push({ id, title, artist, url: '', duration, uploadedAt: Date.now(), isLiveShow: uploadType === 'show' });
    }
    onUpdateSongs(newSongs);
    setIsUploading(false);
    e.target.value = '';
  };

  const removeSong = async (id: string) => {
    onUpdateSongs(songs.filter(s => s.id !== id));
    await deleteSongData(id);
  };

  const updateSchedule = (hour: number, songId: string) => {
    const filtered = schedule.filter(s => !(s.date === selectedDate && s.hour === hour));
    if (songId) {
      onUpdateSchedule([...filtered, { date: selectedDate, hour, songId }]);
    } else {
      onUpdateSchedule(filtered);
    }
  };

  return (
    <div className="w-full max-w-5xl glass-panel p-6 md:p-16 rounded-[2rem] md:rounded-[3rem] animate-in fade-in slide-in-from-top-12 duration-1000 mb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10 mb-10 md:mb-20">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2 md:mb-3">
            <div className="w-3 h-3 md:w-4 md:h-4 bg-purple-500 neon-glow-purple rounded-full"></div>
            <span className="text-[9px] md:text-[11px] font-black text-purple-400 uppercase tracking-[0.3em]">Master Console</span>
          </div>
          <h2 className="syncopate text-2xl md:text-4xl font-bold uppercase italic tracking-tighter text-white">Studio</h2>
        </div>
        
        <div className="flex bg-black/50 p-1 md:p-1.5 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl w-full md:w-auto">
          <button onClick={() => setActiveTab('library')} className={`flex-1 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'library' ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-300/40 hover:text-white'}`}>Vault</button>
          <button onClick={() => setActiveTab('planner')} className={`flex-1 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'planner' ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-300/40 hover:text-white'}`}>Timeline</button>
        </div>
      </div>

      {activeTab === 'library' ? (
        <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div 
              className={`relative group p-8 md:p-12 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-[1.02] ${uploadType === 'track' ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/[0.03]'}`}
              onClick={() => setUploadType('track')}
            >
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="audio/*" multiple onChange={handleFileUpload} disabled={isUploading} />
              <div className="text-3xl md:text-4xl mb-3 md:mb-4 group-hover:scale-110 transition-transform">🎧</div>
              <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] text-white">Add Tracks</span>
              <p className="text-[7px] md:text-[9px] text-white/30 mt-2 uppercase">MP3 / WAV</p>
            </div>
            <div 
              className={`relative group p-8 md:p-12 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-[1.02] ${uploadType === 'show' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/[0.03]'}`}
              onClick={() => setUploadType('show')}
            >
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="audio/*" multiple onChange={handleFileUpload} disabled={isUploading} />
              <div className="text-3xl md:text-4xl mb-3 md:mb-4 group-hover:scale-110 transition-transform">📼</div>
              <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] text-white">Add Show</span>
              <p className="text-[7px] md:text-[9px] text-white/30 mt-2 uppercase">Long Format</p>
            </div>
          </div>

          <div className="space-y-3 custom-scroll max-h-[40vh] md:max-h-[50vh] overflow-y-auto pr-2">
            {songs.map(song => (
              <div key={song.id} className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-[8px] md:text-[10px] font-bold border shrink-0 ${song.isLiveShow ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                    {song.isLiveShow ? 'SHOW' : 'SONG'}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-white uppercase text-xs md:text-base tracking-tight truncate">{song.title}</h5>
                    <p className="text-[8px] md:text-[10px] font-bold text-purple-300/40 uppercase tracking-[0.2em] mt-0.5 truncate">{song.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto justify-end">
                  <button onClick={() => onDirectPlay(song.id)} className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-white/5 hover:bg-purple-600 text-[8px] md:text-[10px] font-black rounded-lg md:rounded-2xl uppercase tracking-widest transition-all">Go Live</button>
                  <button onClick={() => removeSong(song.id)} className="p-2 text-white/10 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.8 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5"/></svg>
                  </button>
                </div>
              </div>
            ))}
            {songs.length === 0 && <p className="text-center py-20 text-purple-300/10 text-[9px] font-black uppercase tracking-[0.4em]">Vault is empty</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
          <div className="flex flex-col items-center gap-4 bg-black/30 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/5">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              className="w-full bg-purple-900/20 border border-purple-500/20 rounded-xl md:rounded-[1.5rem] px-6 py-3 md:py-4 text-xs md:text-sm text-white font-black outline-none focus:border-purple-500 transition-all text-center"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[45vh] md:max-h-[55vh] overflow-y-auto pr-2 custom-scroll">
            {Array.from({ length: 24 }).map((_, hour) => {
              const entry = schedule.find(s => s.date === selectedDate && s.hour === hour);
              return (
                <div key={hour} className={`group p-4 md:p-6 rounded-xl md:rounded-[2rem] border transition-all flex items-center justify-between gap-4 ${entry ? 'bg-purple-500/15 border-purple-500/40 shadow-lg' : 'bg-white/[0.02] border-white/5'}`}>
                  <span className="mono font-black text-sm md:text-lg text-purple-300/50 w-12 md:w-20 text-center shrink-0">{hour.toString().padStart(2, '0')}:00</span>
                  <div className="flex-1 min-w-0">
                    <select 
                      value={entry?.songId || ""} 
                      onChange={(e) => updateSchedule(hour, e.target.value)}
                      className="w-full bg-transparent text-[9px] md:text-[12px] font-black text-white uppercase outline-none cursor-pointer truncate"
                    >
                      <option value="" className="bg-slate-950">ROTATION</option>
                      {songs.map(s => <option key={s.id} value={s.id} className="bg-slate-950">{s.title.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Studio;
