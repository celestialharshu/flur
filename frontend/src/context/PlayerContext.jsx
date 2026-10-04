import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { historyApi } from '../api/backend';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const { token } = useAuth();
  const audioRef = useRef(new Audio());
  const [queue, setQueue] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack?.streamUrl) return;
    audio.src = currentTrack.streamUrl;
    audio.volume = volume / 100;
    setCurrentTime(0);
    if (isPlaying) audio.play().catch((err) => console.warn('Playback failed:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // Log every newly started track to the user's listen history
  // (powers the "Recently played" section on the Explorer page).
  useEffect(() => {
    if (!token || !currentTrack?.id) return;
    historyApi.record(token, currentTrack.id).catch((err) =>
      console.warn('Failed to record listen history:', err.message)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) audio.play().catch((err) => console.warn('Playback failed:', err));
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNext();
      }
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRepeat, currentTrack]);

  // playTrack now optionally takes the full list it was played from
  // (e.g. the Songs page's 50 recommended tracks) — that list BECOMES
  // the queue, so next/prev and the Queue panel reflect what you were
  // actually browsing, not a leftover fixed list.
  const playTrack = useCallback((song, songList = null) => {
    if (songList) {
      setQueue(songList);
    } else {
      // No list given (e.g. played from Queue panel itself) — just make
      // sure the song is present in the existing queue so next/prev works.
      setQueue((prevQueue) => {
        const alreadyInQueue = prevQueue.some((t) => t.id === song.id);
        return alreadyInQueue ? prevQueue : [...prevQueue, song];
      });
    }
    setCurrentTrack(song);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  const handleNext = useCallback(() => {
    setQueue((currentQueue) => {
      if (currentQueue.length === 0) return currentQueue;
      const currentIndex = currentQueue.findIndex((t) => t.id === currentTrack?.id);
      const nextIndex = isShuffle
        ? Math.floor(Math.random() * currentQueue.length)
        : (currentIndex + 1) % currentQueue.length;
      setCurrentTrack(currentQueue[nextIndex]);
      setIsPlaying(true);
      return currentQueue;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, isShuffle]);

  const handlePrev = useCallback(() => {
    setQueue((currentQueue) => {
      if (currentQueue.length === 0) return currentQueue;
      const currentIndex = currentQueue.findIndex((t) => t.id === currentTrack?.id);
      const prevIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
      setCurrentTrack(currentQueue[prevIndex]);
      setIsPlaying(true);
      return currentQueue;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((vol) => {
    setVolumeState(vol);
    audioRef.current.volume = vol / 100;
  }, []);

  const value = {
    queue,
    currentTrack,
    isPlaying,
    currentTime,
    volume,
    isShuffle,
    isRepeat,
    playTrack,
    togglePlay,
    next: handleNext,
    prev: handlePrev,
    seek,
    setVolume,
    toggleShuffle: () => setIsShuffle((p) => !p),
    toggleRepeat: () => setIsRepeat((p) => !p),
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
}