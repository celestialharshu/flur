import { useState, useEffect, useRef, useMemo } from 'react';
import { X } from 'lucide-react';
import { usePlayer, usePlayerTime } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { lyricsApi } from '../../api/backend';

// Remember results for the session so reopening / replaying is instant
const lyricsCache = new Map();

// Index of the last line whose time has passed (lines are sorted by time)
function lastReached(lines, t) {
  let lo = 0;
  let hi = lines.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= t) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return found;
}

function LyricsPanel({ onClose }) {
  const { token } = useAuth();
  const { currentTrack, seek } = usePlayer();
  const currentTime = usePlayerTime();
  const [lyrics, setLyrics] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | none | error
  const bodyRef = useRef(null);
  const linesRef = useRef(null);
  const lastUserScroll = useRef(0);
  const trackId = currentTrack?.id;
  const trackRef = useRef(currentTrack);
  trackRef.current = currentTrack;

  // Fetch lyrics whenever the track changes
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !token) return undefined;
    const key = `${track.id}`;

    if (lyricsCache.has(key)) {
      const cached = lyricsCache.get(key);
      setLyrics(cached);
      setStatus(cached ? 'ready' : 'none');
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');
    setLyrics(null);

    lyricsApi.get(token, {
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.durationSeconds,
    })
      .then(({ lyrics }) => {
        if (cancelled) return;
        lyricsCache.set(key, lyrics);
        setLyrics(lyrics);
        setStatus(lyrics ? 'ready' : 'none');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });

    return () => { cancelled = true; };
  }, [trackId, token]);

  const synced = lyrics?.synced || null;

  // Active line = last line whose timestamp has passed (small look-ahead feels better)
  const activeIndex = useMemo(
    () => (synced ? lastReached(synced, currentTime + 0.3) : -1),
    [synced, currentTime]
  );

  // Keep the active line centred, unless the user is scrolling by hand
  useEffect(() => {
    if (activeIndex < 0) return;
    if (Date.now() - lastUserScroll.current < 3000) return;
    const body = bodyRef.current;
    const line = linesRef.current?.children[activeIndex];
    if (!body || !line) return;
    body.scrollTo({
      top: line.offsetTop - body.clientHeight / 2 + line.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [activeIndex]);

  const markUserScroll = () => { lastUserScroll.current = Date.now(); };

  // one click handler for all lines instead of one closure per line
  const handleLineClick = (e) => {
    const el = e.target.closest('[data-i]');
    if (el && synced) seek(synced[Number(el.dataset.i)].time);
  };

  return (
    <div className="lyrics-panel" role="dialog" aria-label="Lyrics">
      <div className="lyrics-panel__header">
        <div className="lyrics-panel__heading">
          <span className="lyrics-panel__title">{currentTrack?.title}</span>
          <span className="lyrics-panel__artist">{currentTrack?.artist}</span>
        </div>
        <button className="lyrics-panel__close" onClick={onClose} aria-label="Close lyrics">
          <X size={18} />
        </button>
      </div>

      <div
        className="lyrics-panel__body"
        ref={bodyRef}
        onWheel={markUserScroll}
        onTouchMove={markUserScroll}
      >
        {status === 'loading' && <p className="lyrics-panel__message">Finding lyrics...</p>}
        {status === 'error' && <p className="lyrics-panel__message">Couldn't load lyrics right now.</p>}
        {status === 'none' && <p className="lyrics-panel__message">No lyrics found for this song.</p>}
        {status === 'ready' && lyrics?.instrumental && (
          <p className="lyrics-panel__message">Instrumental — enjoy the music ♪</p>
        )}

        {status === 'ready' && synced && (
          <div className="lyrics-panel__lines" ref={linesRef} onClick={handleLineClick}>
            {synced.map((line, i) => (
              <p
                key={i}
                data-i={i}
                className={`lyrics-line ${i === activeIndex ? 'lyrics-line--active' : ''} ${i < activeIndex ? 'lyrics-line--past' : ''}`}
              >
                {line.text || '♪'}
              </p>
            ))}
          </div>
        )}

        {status === 'ready' && !synced && lyrics?.plain && (
          <>
            <p className="lyrics-panel__note">Synced lyrics aren't available — showing plain text.</p>
            <pre className="lyrics-panel__plain">{lyrics.plain}</pre>
          </>
        )}
      </div>
    </div>
  );
}

export default LyricsPanel;
