import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { historyApi } from '../api/backend';
import { audioEngine } from '../audio/audioEngine';
import { secureUrl } from '../utils/media';

// Two contexts: everything except the clock, and the clock on its own.
// The clock ticks ~4 times a second; only the few components that show it
// (progress bars, lyrics) subscribe, so the rest of the app doesn't re-render.
const PlayerContext = createContext(null);
const TimeContext = createContext(0);

const KEY = 'flur_player_state';
const TIME_KEY = 'flur_player_time'; // small, written often: { id, t }

function read(k) {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function write(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ }
}
function drop(k) {
  try { localStorage.removeItem(k); } catch { /* ignore */ }
}

// What the player looked like before the app was closed (only if someone is logged in).
function restore(token) {
  if (!token) return null;
  const s = read(KEY);
  if (!s) return null;
  const t = read(TIME_KEY);
  if (t && s.currentTrack && t.id === s.currentTrack.id) s.currentTime = t.t;
  return s;
}

export function PlayerProvider({ children }) {
  const { token } = useAuth();
  const [init] = useState(() => restore(token)); // storage is read once, not every render

  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = new Audio();
  const a = audioRef.current;

  const [queue, setQueue] = useState(init?.queue || []);
  const [currentTrack, setCurrentTrack] = useState(init?.currentTrack || null);
  const [isPlaying, setIsPlaying] = useState(false); // always starts paused after a restart
  const [currentTime, setCurrentTime] = useState(init?.currentTime || 0);
  const [volume, setVolume] = useState(init?.volume ?? 70);
  const [isShuffle, setIsShuffle] = useState(init?.isShuffle || false);
  const [isRepeat, setIsRepeat] = useState(init?.isRepeat || false);

  const resumeAt = useRef(init?.currentTime || 0); // jump here once the restored song has loaded
  const restoredId = useRef(init?.currentTrack?.id ?? null); // restoring must not count as a new listen
  const metaFn = useRef(null);
  const backup = useRef(null); // the original link, if we upgraded it to https
  const timeRef = useRef(currentTime);

  // Latest values for event handlers, so they never have to be re-attached.
  const live = useRef({});
  live.current = { queue, currentTrack, isPlaying, isShuffle, isRepeat, volume, token };

  // Start playing; a failure must not leave the UI claiming "playing".
  const play = useCallback(() => {
    const p = a.play();
    if (!p) return;
    p.catch((err) => {
      if (err.name === 'AbortError') return; // a newer load replaced this one
      console.warn('Playback failed:', err);
      if (err.name === 'NotAllowedError') setIsPlaying(false);
    });
  }, [a]);

  // Put the saved position back once the song's metadata is ready.
  const jumpTo = useCallback((t) => {
    if (metaFn.current) a.removeEventListener('loadedmetadata', metaFn.current);
    metaFn.current = null;
    if (!(t > 0)) return;
    metaFn.current = () => { a.currentTime = t; };
    a.addEventListener('loadedmetadata', metaFn.current, { once: true });
  }, [a]);

  useEffect(() => { audioEngine.attachElement(a); }, [a]);
  useEffect(() => { a.volume = volume / 100; }, [a, volume]);

  // ---- load the song ----
  // The song starts loading right away as plain audio. Nothing is awaited first:
  // plain playback works with any server and any webview, while CORS mode (needed
  // only for the equalizer / effects) can fail depending on where the app runs.
  const trackId = currentTrack?.id;
  const trackUrl = currentTrack?.streamUrl;
  useEffect(() => {
    if (!trackUrl) return undefined;
    const url = secureUrl(trackUrl);
    backup.current = url !== trackUrl ? trackUrl : null;
    let stale = false;

    const start = (cors) => {
      if (stale) return;
      const at = resumeAt.current;
      resumeAt.current = 0;
      jumpTo(at);
      timeRef.current = at;
      setCurrentTime(at);

      a.crossOrigin = cors ? 'anonymous' : null; // must be set BEFORE src
      a.preload = live.current.isPlaying ? 'auto' : 'metadata'; // a restored song doesn't download until played
      a.src = url;
      audioEngine.onTrackLoaded();
      if (live.current.isPlaying) {
        audioEngine.resume();
        play();
      }
      if (!cors) audioEngine.probe(url); // fills in the Equalizer page; never delays playback
    };

    if (audioEngine.needsCors()) audioEngine.prepare(url).then(start);
    else start(false);

    return () => { stale = true; };
  }, [trackId, trackUrl, a, play, jumpTo]);

  // Safety nets when a song fails to load.
  useEffect(() => {
    const reload = (u) => {
      const at = a.currentTime;
      jumpTo(at);
      a.src = u;
      if (live.current.isPlaying) play();
    };
    const onError = () => {
      const url = a.src;
      if (!url) return;
      // 1) CORS mode failed (server blocks it after all): same song, plain audio
      if (a.crossOrigin === 'anonymous' && !audioEngine.graphActive) {
        audioEngine.markCorsFailed(url);
        a.crossOrigin = null;
        reload(url);
        return;
      }
      // 2) the https upgrade failed: try the original link once
      if (backup.current) {
        const u = backup.current;
        backup.current = null;
        reload(u);
        return;
      }
      console.warn('Audio could not be loaded:', a.error?.code, a.error?.message, url);
      audioEngine.setIssue(`Song failed to load (error ${a.error?.code ?? '?'}): ${a.error?.message || 'no details'} - ${url}`);
      setIsPlaying(false);
    };
    const ok = () => audioEngine.setIssue(''); // it plays, so any earlier warning is out of date
    a.addEventListener('error', onError);
    a.addEventListener('playing', ok);
    return () => {
      a.removeEventListener('error', onError);
      a.removeEventListener('playing', ok);
    };
  }, [a, play, jumpTo]);

  // Log every newly started track to the user's listen history
  // (powers the "Recently played" section on the Explorer page).
  useEffect(() => {
    if (!token || !trackId) return;
    if (trackId === restoredId.current) return; // restored, not newly played
    restoredId.current = null;
    historyApi.record(token, trackId).catch((err) =>
      console.warn('Failed to record listen history:', err.message)
    );
  }, [token, trackId]);

  useEffect(() => {
    if (isPlaying) {
      audioEngine.resume(); // Web Audio stays suspended until a user action
      if (a.src) play();
    } else {
      a.pause();
    }
  }, [isPlaying, a, play]);

  // ---- clock, end of song ----
  const step = useCallback((dir) => {
    const { queue: q, currentTrack: cur, isShuffle: shuffle } = live.current;
    if (q.length === 0) return;
    const i = q.findIndex((t) => t.id === cur?.id);
    let j;
    if (dir < 0) j = (i - 1 + q.length) % q.length;
    else if (shuffle) {
      j = Math.floor(Math.random() * q.length);
      if (j === i && q.length > 1) j = (j + 1) % q.length; // never "skip" to the same song
    } else j = (i + 1) % q.length;
    setCurrentTrack(q[j]);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    const onTime = () => {
      const t = a.currentTime;
      if (t !== timeRef.current) {
        timeRef.current = t;
        setCurrentTime(t);
      }
    };
    const onEnded = () => {
      if (live.current.isRepeat) {
        a.currentTime = 0;
        play();
      } else {
        step(1);
      }
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnded);
    };
  }, [a, play, step]);

  // ---- save the player so a restart doesn't wipe the bar and the queue ----
  const saveAll = useCallback(() => {
    const s = live.current;
    if (!s.token) return;
    write(KEY, {
      queue: s.queue, currentTrack: s.currentTrack, currentTime: timeRef.current,
      volume: s.volume, isShuffle: s.isShuffle, isRepeat: s.isRepeat,
    });
  }, []);

  // everything except the position: when it changes (after a short pause)
  useEffect(() => {
    if (!token) return undefined;
    const id = setTimeout(saveAll, 400);
    return () => clearTimeout(id);
  }, [token, queue, currentTrack, volume, isShuffle, isRepeat, saveAll]);

  // the position: every 5 seconds while playing, and when the window closes
  useEffect(() => {
    if (!token) return undefined;
    const saveTime = () => write(TIME_KEY, { id: live.current.currentTrack?.id, t: timeRef.current });
    const onHide = () => { saveAll(); saveTime(); };
    window.addEventListener('pagehide', onHide);
    const id = isPlaying ? setInterval(saveTime, 5000) : null;
    if (!isPlaying) saveTime();
    return () => {
      window.removeEventListener('pagehide', onHide);
      if (id) clearInterval(id);
    };
  }, [token, isPlaying, saveAll]);

  // On logout: stop playback, release the stream and forget the saved session
  useEffect(() => {
    if (token) return;
    drop(KEY);
    drop(TIME_KEY);
    a.pause();
    a.removeAttribute('src');
    a.load();
    setQueue([]);
    setCurrentTrack(null);
    setIsPlaying(false);
    timeRef.current = 0;
    setCurrentTime(0);
  }, [token, a]);

  // ---- actions (stable, so memoized children don't re-render) ----
  // playTrack optionally takes the full list it was played from (e.g. the Songs
  // page's tracks) — that list BECOMES the queue, so next/prev and the Queue
  // panel reflect what you were actually browsing.
  const playTrack = useCallback((song, songList = null) => {
    if (songList) {
      setQueue(songList);
    } else {
      // No list given (e.g. played from the Queue panel itself): just make sure
      // the song is in the queue so next/prev works.
      setQueue((q) => (q.some((t) => t.id === song.id) ? q : [...q, song]));
    }
    setCurrentTrack(song);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);
  const toggleShuffle = useCallback(() => setIsShuffle((p) => !p), []);
  const toggleRepeat = useCallback(() => setIsRepeat((p) => !p), []);

  const seek = useCallback((t) => {
    a.currentTime = t;
    timeRef.current = t;
    setCurrentTime(t);
  }, [a]);

  const value = useMemo(() => ({
    queue, currentTrack, isPlaying, volume, isShuffle, isRepeat,
    playTrack, togglePlay, next, prev, seek, setVolume, toggleShuffle, toggleRepeat,
  }), [queue, currentTrack, isPlaying, volume, isShuffle, isRepeat,
    playTrack, togglePlay, next, prev, seek, toggleShuffle, toggleRepeat]);

  return (
    <PlayerContext.Provider value={value}>
      <TimeContext.Provider value={currentTime}>{children}</TimeContext.Provider>
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
}

// Seconds played in the current song. Re-renders ~4x/second: use it only where it is shown.
export function usePlayerTime() {
  return useContext(TimeContext);
}
