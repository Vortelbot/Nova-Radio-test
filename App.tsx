
import React, { useState, useEffect, useRef } from 'react';
import { AppView, Song, ScheduleEntry, User } from './types';
import RadioStation from './components/RadioStation';
import Studio from './components/Studio';
import Auth from './components/Auth';
import PlayerBar from './components/PlayerBar';
import Navbar from './components/Navbar';
import { getSongData, StoredSong } from './services/db';

// Using a fixed epoch for more consistent timing across clients
const GLOBAL_EPOCH = 1704067200000; // Jan 1st 2024

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.STATION);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [audioUrlMap, setAudioUrlMap] = useState<Record<string, string>>({});
  const [volume, setVolume] = useState(0.8);
  // Use a fixed station start time for global feel
  const [stationStartTime] = useState<number>(GLOBAL_EPOCH);

  useEffect(() => {
    try {
      const savedSongs = localStorage.getItem('radio_songs');
      const savedSchedule = localStorage.getItem('radio_schedule');
      const savedUser = localStorage.getItem('radio_user');
      
      if (savedSongs) {
        const parsed = JSON.parse(savedSongs);
        if (Array.isArray(parsed)) {
          const validSongs = parsed.filter((s: any): s is Song => !!(s && typeof s === 'object' && s.id));
          setSongs(validSongs);
        }
      }
      
      if (savedSchedule) {
        const parsed = JSON.parse(savedSchedule);
        if (Array.isArray(parsed)) {
          const validSchedule = parsed.filter((s: any): s is ScheduleEntry => !!(s && s.songId));
          setSchedule(validSchedule);
        }
      }
      
      if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user && user.username) setCurrentUser(user);
      }
    } catch (e) {
      console.error("Critical: Failed to load station state", e);
    }
  }, []);

  useEffect(() => {
    const loadBlobs = async () => {
      const newMap: Record<string, string> = {};
      for (const song of songs) {
        if (!song || !song.id) continue;
        const songId: string = String(song.id);
        try {
          const stored: StoredSong | null = await getSongData(songId);
          if (stored) {
            const mimeTypeStr: string = String(stored.mimeType || 'audio/mpeg');
            const blob = new Blob([stored.data], { type: mimeTypeStr });
            newMap[songId] = URL.createObjectURL(blob);
          }
        } catch (e) { 
          console.error(`Failed to load audio for song ${songId}`, e); 
        }
      }
      setAudioUrlMap(newMap);
    };
    if (songs.length > 0) loadBlobs();

    return () => {
      Object.values(audioUrlMap).forEach(url => {
        if (typeof url === 'string') {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [songs.length]);

  useEffect(() => {
    if (songs.length === 0) {
      setActiveSongId(null);
      return;
    }

    const tick = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      
      const scheduled = schedule.find(s => s && s.date === todayStr && s.hour === currentHour);
      if (scheduled && scheduled.songId) {
        if (activeSongId !== scheduled.songId) {
          setActiveSongId(scheduled.songId);
        }
      } else {
        const totalDuration = songs.reduce((acc, s) => acc + (s?.duration || 180), 0) * 1000;
        if (totalDuration === 0) return;
        
        const elapsed = (Date.now() - stationStartTime) % totalDuration;
        
        let runningSum = 0;
        let foundSongId = songs[0]?.id || null;
        
        for (const song of songs) {
          if (!song) continue;
          const songDur = (song.duration || 180) * 1000;
          if (elapsed < runningSum + songDur) {
            foundSongId = song.id;
            break;
          }
          runningSum += songDur;
        }
        
        if (foundSongId && foundSongId !== activeSongId) {
          setActiveSongId(foundSongId);
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [songs, stationStartTime, activeSongId, schedule]);

  const enrichedSongs = songs
    .filter(s => s && s.id)
    .map(s => ({ 
      ...s, 
      url: audioUrlMap[String(s.id)] || s.url 
    }));
  
  const activeSong = enrichedSongs.find(s => s && s.id === activeSongId) || null;

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden bg-[#07010f]">
      <Navbar 
        view={view} 
        setView={setView} 
        currentUser={currentUser} 
        onLogout={() => { 
          setCurrentUser(null); 
          localStorage.removeItem('radio_user'); 
          setView(AppView.STATION); 
        }}
        isActive={!!activeSong && !isMuted}
      />

      <main className="flex-1 p-4 md:p-12 overflow-y-auto custom-scroll pb-24 md:pb-32">
        {view === AppView.STATION && (
          <RadioStation 
            songs={enrichedSongs} 
            activeSongId={activeSongId}
            schedule={schedule}
            stationStartTime={stationStartTime}
          />
        )}
        {view === AppView.STUDIO && currentUser?.role === 'admin' && (
          <Studio 
            songs={enrichedSongs} 
            onUpdateSongs={(s) => { 
              const validSongs = s.filter(i => i && i.id);
              setSongs(validSongs); 
              localStorage.setItem('radio_songs', JSON.stringify(validSongs)); 
            }} 
            schedule={schedule} 
            onUpdateSchedule={(sch) => { 
              const validSchedule = sch.filter(i => i && i.songId);
              setSchedule(validSchedule); 
              localStorage.setItem('radio_schedule', JSON.stringify(validSchedule)); 
            }} 
            onDirectPlay={(id) => { 
              setActiveSongId(id); 
              setIsMuted(false); 
              setView(AppView.STATION); 
            }} 
          />
        )}
        {view === AppView.AUTH && (
          <Auth onLogin={(u) => { 
            setCurrentUser(u); 
            localStorage.setItem('radio_user', JSON.stringify(u)); 
            setView(AppView.STUDIO); 
          }} />
        )}
        
        {(['bots', 'team', 'partner', 'geschichte'] as any[]).includes(view) && (
          <div className="flex items-center justify-center h-full">
            <div className="glass-card p-12 text-center max-w-lg animate-in zoom-in duration-500">
              <h2 className="text-3xl font-bold uppercase mb-4 text-purple-400 tracking-tighter syncopate">{view}</h2>
              <div className="w-16 h-1 bg-purple-500/20 mx-auto mb-6 rounded-full"></div>
              <p className="text-white/40 font-medium uppercase text-xs tracking-[0.2em]">Coming Soon to Nova Radio</p>
            </div>
          </div>
        )}
      </main>

      <PlayerBar 
        activeSong={activeSong}
        songs={enrichedSongs}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        stationStartTime={stationStartTime}
        volume={volume}
        setVolume={setVolume}
      />
    </div>
  );
};

export default App;
