import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { lyricsApi } from '../../api/backend';

// Remember results for the session so reopening / replaying is instant
const lyricsCache = new Map();

function trackKey(track) {
  return `${track.id}`;
}

function LyricsPanel({ onClose }) {
  const { token } = useAuth();
  const { currentTrack, currentTime, seek } = usePlayer();
  const [lyrics, setLyrics] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | none | error
  const bodyRef = useRef(null);
  const lineRefs = useRef([]);
  const lastUserScroll = useRef(0);

  // Fetch lyrics whenever the track changes
  useEffect(() => {
    if (!currentTrack || !token) return;
    const key = trackKey(currentTrack);

    if (lyricsCache.has(key)) {
      const cached = lyricsCache.get(key);
      setLyrics(cached);
      setStatus(cached ? 'ready' : 'none');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setLyrics(null);

    lyricsApi.get(token, {
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
      duration: currentTrack.durationSeconds,
    })
      .then(({ lyrics }) => {
        if (cancelled) return;
        lyricsCache.set(key, lyrics);
        setLyrics(lyrics);
        setStatus(lyrics ? 'ready' : 'none');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });

    return () => { cancelled = true; };
  }, [currentTrack?.id, token]);

  const synced = lyrics?.synced || null;

  // Active line = last line whose timestamp has passed (small look-ahead feels better)
  let activeIndex = -1;
  if (synced) {
    const t = currentTime + 0.3;
    for (let i = 0; i < synced.length; i++) {
      if (synced[i].time <= t) activeIndex = i;
      else break;
    }
  }

  // Keep the active line centred, unless the user is scrolling by hand
  useEffect(() => {
    if (activeIndex < 0) return;
    if (Date.now() - lastUserScroll.current < 3000) return;
    const body = bodyRef.current;
    const line = lineRefs.current[activeIndex];
    if (!body || !line) return;
    body.scrollTo({
      top: line.offsetTop - body.clientHeight / 2 + line.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [activeIndex]);

  const markUserScroll = () => { lastUserScroll.current = Date.now(); };

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
          <div className="lyrics-panel__lines">
            {synced.map((line, i) => (
              <p
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                className={`lyrics-line ${i === activeIndex ? 'lyrics-line--active' : ''} ${i < activeIndex ? 'lyrics-line--past' : ''}`}
                onClick={() => seek(line.time)}
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
