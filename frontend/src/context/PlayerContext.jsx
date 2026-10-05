import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { historyApi } from '../api/backend';
import { audioEngine } from '../audio/audioEngine';

const PlayerContext = createContext(null);

const STORAGE_KEY = 'flur_player_state';

// Read what the player looked like before the page was reloaded.
// Wrapped in try/catch: storage can be blocked or hold bad data.
function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSavedState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function PlayerProvider({ children }) {
  const { token } = useAuth();
  const audioRef = useRef(new Audio());

  // Restore the last session (only if someone is logged in)
  const savedRef = useRef(token ? loadSavedState() : null);
  const saved = savedRef.current;
  // position (seconds) to jump to once the restored track's audio has loaded
  const resumeTimeRef = useRef(saved?.currentTime || 0);
  // id of a restored track — reopening the app must not count as a new listen
  const restoredIdRef = useRef(saved?.currentTrack?.id ?? null);

  const [queue, setQueue] = useState(saved?.queue || []);
  const [currentTrack, setCurrentTrack] = useState(saved?.currentTrack || null);
  const [isPlaying, setIsPlaying] = useState(false); // always starts paused after a reload
  const [currentTime, setCurrentTime] = useState(saved?.currentTime || 0);
  const [volume, setVolumeState] = useState(saved?.volume ?? 70);
  const [isShuffle, setIsShuffle] = useState(saved?.isShuffle || false);
  const [isRepeat, setIsRepeat] = useState(saved?.isRepeat || false);

  // keeps the latest play state available to async code below
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  // hand the <audio> element to the effects engine (EQ, speed, pitch, ...)
  useEffect(() => {
    audioEngine.attachElement(audioRef.current);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack?.streamUrl) return;
    let cancelled = false;

    const load = async () => {
      // Can this stream go through Web Audio (needs CORS)? Cached per server,
      // so only the first song pays for the check.
      const corsOk = await audioEngine.supportsCors(currentTrack.streamUrl);
      if (cancelled) return;

      // crossOrigin has to be set BEFORE src, or effects would output silence
      audio.crossOrigin = corsOk ? 'anonymous' : null;
      audio.src = currentTrack.streamUrl;
      audio.volume = volume / 100;

      const resumeAt = resumeTimeRef.current;
      resumeTimeRef.current = 0;
      if (resumeAt > 0) {
        // restored after a reload: continue from where it stopped
        const onLoaded = () => {
          audio.currentTime = resumeAt;
          setCurrentTime(resumeAt);
        };
        audio.addEventListener('loadedmetadata', onLoaded, { once: true });
      } else {
        setCurrentTime(0);
      }

      audioEngine.onTrackLoaded();
      if (isPlayingRef.current) {
        audioEngine.resume();
        audio.play().catch((err) => console.warn('Playback failed:', err));
      }
    };
    load();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // Safety net: if a CORS-enabled load fails (server blocks it after all),
  // reload the same song the normal way and switch effects off.
  useEffect(() => {
    const audio = audioRef.current;
    const handleError = () => {
      if (audio.crossOrigin === 'anonymous' && !audioEngine.graphActive && audio.src) {
        const url = audio.src;
        const at = audio.currentTime;
        audioEngine.markCorsFailed(url);
        audio.crossOrigin = null;
        audio.src = url;
        audio.addEventListener('loadedmetadata', () => { audio.currentTime = at; }, { once: true });
        if (isPlayingRef.current) audio.play().catch(() => {});
      }
    };
    audio.addEventListener('error', handleError);
    return () => audio.removeEventListener('error', handleError);
  }, []);

  // Log every newly started track to the user's listen history
  // (powers the "Recently played" section on the Explorer page).
  useEffect(() => {
    if (!token || !currentTrack?.id) return;
    if (currentTrack.id === restoredIdRef.current) return; // restored, not newly played
    restoredIdRef.current = null;
    historyApi.record(token, currentTrack.id).catch((err) =>
      console.warn('Failed to record listen history:', err.message)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audioEngine.resume(); // browsers keep Web Audio suspended until a user action
      audio.play().catch((err) => console.warn('Playback failed:', err));
    } else audio.pause();
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

  // Save the player so a page reload doesn't wipe the bar and the queue.
  // Position is saved about every 2 seconds, everything else on change.
  const savedSecond = Math.floor(currentTime / 2);
  useEffect(() => {
    if (!token) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        queue, currentTrack, currentTime: audioRef.current.currentTime || currentTime,
        volume, isShuffle, isRepeat,
      }));
    } catch { /* storage full or blocked — not critical */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, currentTrack, volume, isShuffle, isRepeat, savedSecond, token]);

  // On logout: stop playback and forget the saved session
  useEffect(() => {
    if (token) return;
    clearSavedState();
    audioRef.current.pause();
    setQueue([]);
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [token]);

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