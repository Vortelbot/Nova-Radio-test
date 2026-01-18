
export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  uploadedAt: number;
  isLiveShow?: boolean; // Distinguishes between a single track and a full show file
}

export interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  songId: string;
}

export interface User {
  username: string;
  role: 'admin' | 'user';
}

export enum AppView {
  STATION = 'station',
  STUDIO = 'studio',
  AUTH = 'auth'
}
