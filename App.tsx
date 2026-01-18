
import React, { useState, useEffect, useRef } from 'react';
import { AppView, Song, ScheduleEntry, User } from './types';
import RadioStation from './components/RadioStation';
import Studio from './components/Studio';
import Auth from './components/Auth';
import PlayerBar from './components/PlayerBar';
import Navbar from './components/Navbar';
// Import StoredSong to resolve type inference issues with indexedDB results
import { getSongData, StoredSong } from './services/db';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.STATION);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [audioUrlMap, setAudioUrlMap] = useState<Record<string, string>>({});
  const [volume, setVolume] = useState(0.8);
  const [stationStartTime, setStationStartTime] = useState<number>(() => {
    const saved = localStorage.getItem('station_start_time');
    return saved ? parseInt(saved, 10) : Date.now();
  });

  // Load initial state with safety checks
  useEffect(() => {
    try {
      const savedSongs = localStorage.getItem('radio_songs');
      const savedSchedule = localStorage.getItem('radio_schedule');
      const savedUser = localStorage.getItem('radio_user');
      
      if (savedSongs) {
        const parsed = JSON.parse(savedSongs);
        if (Array.isArray(parsed)) {
          // Filter out any nulls or invalid entries from storage
          // Explicitly cast to Song[] using a type guard to avoid unknown inference later
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
      console.error("Critical: Failed to load station state from localStorage", e);
    }
  }, []);

  // Map database blobs to blob URLs
  // Fix: Explicitly handle songId and url types to avoid unknown errors
  useEffect(() => {
    const loadBlobs = async () => {
      const newMap: Record<string, string> = {};
      for (const song of songs) {
        // Ensure song and song.id exist before querying DB
        if (!song || !song.id) continue;
        const songId: string = String(song.id);
        try {
          // Explicitly type the result from getSongData to ensure correct property access
          const stored: StoredSong | null = await getSongData(songId);
          if (stored) {
            // Fix: Use String() to ensure mimeType is a string and handle blob creation safely
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
      // Fix: Ensure values from audioUrlMap are treated as strings for revokeObjectURL
      Object.values(audioUrlMap).forEach(url => {
        if (typeof url === 'string') {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [songs.length]);

  // Global Station Logic (Rotation)
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

  // Double check existence of objects during render mapping
  const enrichedSongs = songs
    .filter(s => s && s.id)
    .map(s => ({ 
      ...s, 
      url: audioUrlMap[String(s.id)] || s.url 
    }));
  
  const activeSong = enrichedSongs.find(s => s && s.id === activeSongId) || null;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-[#07010f]">
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

      <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scroll pb-32">
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
              const newStart = Date.now();
              setStationStartTime(newStart); 
              localStorage.setItem('station_start_time', newStart.toString());
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
