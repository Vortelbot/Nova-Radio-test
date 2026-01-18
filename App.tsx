
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Song, ScheduleEntry, User } from './types';
import RadioStation from './components/RadioStation';
import Studio from './components/Studio';
import Auth from './components/Auth';
import PlayerBar from './components/PlayerBar';
import Navbar from './components/Navbar';
import { getSongData, StoredSong } from './services/db';

// Fixed starting point for all instances to synchronize the playback sequence
const GLOBAL_EPOCH = 1704067200000; 

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.STATION);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [audioUrlMap, setAudioUrlMap] = useState<Record<string, string>>({});
  const [volume, setVolume] = useState(0.8);

  // Load persistence data
  useEffect(() => {
    const savedSongs = localStorage.getItem('radio_songs');
    const savedSchedule = localStorage.getItem('radio_schedule');
    const savedUser = localStorage.getItem('radio_user');
    
    if (savedSongs) {
      try {
        const local = JSON.parse(savedSongs);
        setSongs(local);
      } catch (e) { 
        console.error("Error loading songs:", e); 
        setSongs([]);
      }
    }
    
    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  // Global Sync Engine: Calculates which song "should" be playing based on world time
  useEffect(() => {
    if (songs.length === 0) {
      setActiveSongId(null);
      return;
    }

    const syncPlayback = () => {
      const totalDuration = songs.reduce((acc, s) => acc + (s?.duration || 180), 0) * 1000;
      if (totalDuration === 0) return;

      const elapsed = (Date.now() - GLOBAL_EPOCH) % totalDuration;
      
      let runningSum = 0;
      let targetId = songs[0].id;
      
      for (const song of songs) {
        const songDur = (song.duration || 180) * 1000;
        if (elapsed < runningSum + songDur) {
          targetId = song.id;
          break;
        }
        runningSum += songDur;
      }
      
      if (targetId !== activeSongId) {
        setActiveSongId(targetId);
      }
    };

    syncPlayback();
    const interval = setInterval(syncPlayback, 1000);
    return () => clearInterval(interval);
  }, [songs, activeSongId]);

  // Handle local binary audio data retrieval from IndexedDB
  useEffect(() => {
    const loadBlobs = async () => {
      const newMap: Record<string, string> = {};
      for (const song of songs) {
        if (!song?.id) continue;
        try {
          const stored: StoredSong | null = await getSongData(song.id);
          if (stored) {
            const blob = new Blob([stored.data], { type: stored.mimeType });
            newMap[song.id] = URL.createObjectURL(blob);
          }
        } catch (e) { 
          console.error(`Error loading audio for ${song.id}:`, e); 
        }
      }
      setAudioUrlMap(newMap);
    };
    loadBlobs();
  }, [songs]);

  // Map URLs to song objects
  const enrichedSongs = songs.map(s => ({ 
    ...s, 
    url: audioUrlMap[s.id] || s.url 
  }));
  
  const activeSong = enrichedSongs.find(s => s.id === activeSongId) || null;

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden bg-[#07010f]">
      <Navbar 
        view={view} 
        setView={setView} 
        currentUser={currentUser} 
        onLogout={() => { setCurrentUser(null); localStorage.removeItem('radio_user'); setView(AppView.STATION); }}
        isActive={!!activeSong && !isMuted}
      />

      <main className="flex-1 p-4 md:p-12 overflow-y-auto custom-scroll pb-24 md:pb-32">
        {view === AppView.STATION && (
          <RadioStation 
            songs={enrichedSongs} 
            activeSongId={activeSongId}
            schedule={schedule}
            stationStartTime={GLOBAL_EPOCH}
          />
        )}
        {view === AppView.STUDIO && currentUser?.role === 'admin' && (
          <Studio 
            songs={enrichedSongs} 
            onUpdateSongs={(updatedList) => { 
              setSongs(updatedList); 
              localStorage.setItem('radio_songs', JSON.stringify(updatedList)); 
            }} 
            schedule={schedule} 
            onUpdateSchedule={(sch) => { 
              setSchedule(sch); 
              localStorage.setItem('radio_schedule', JSON.stringify(sch)); 
            }} 
            onDirectPlay={(id) => { setActiveSongId(id); setIsMuted(false); setView(AppView.STATION); }} 
          />
        )}
        {view === AppView.AUTH && (
          <Auth onLogin={(u) => { setCurrentUser(u); localStorage.setItem('radio_user', JSON.stringify(u)); setView(AppView.STUDIO); }} />
        )}
      </main>

      <PlayerBar 
        activeSong={activeSong}
        songs={enrichedSongs}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        stationStartTime={GLOBAL_EPOCH}
        volume={volume}
        setVolume={setVolume}
      />
    </div>
  );
};

export default App;
