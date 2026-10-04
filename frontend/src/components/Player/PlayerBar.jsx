import { useState } from 'react';
import { Mic2 } from 'lucide-react';
import LyricsPanel from './LyricsPanel';
import IconButton from '../common/IconButton';
import CurrentTrack from './CurrentTrack';
import PlaybackControls from './PlaybackControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import PlayerProgressStrip from './PlayerProgressStrip';
import { usePlayer } from '../../context/PlayerContext';
import { useFavorites } from '../../context/FavoritesContext';

function PlayerBar() {
  // ALL hooks called first, unconditionally, every render — no exceptions.
  const {
    currentTrack, isPlaying, currentTime, volume,
    isShuffle, isRepeat,
    togglePlay, next, prev, seek, setVolume, toggleShuffle, toggleRepeat,
  } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showLyrics, setShowLyrics] = useState(false);

  // Early return comes AFTER all hooks, never before or between them.
  if (!currentTrack) {
    return <div className="player-bar" />;
  }

  return (
    <div className="player-bar">
      <PlayerProgressStrip />

      <CurrentTrack
        thumbnail={currentTrack.thumbnail}
        title={currentTrack.title}
        artist={currentTrack.artist}
        isFavorite={isFavorite(currentTrack.id)}
        onToggleFavorite={() => toggleFavorite(currentTrack.id)}
      />

      <div className="player-bar__center">
        <PlaybackControls
          isPlaying={isPlaying}
          isShuffle={isShuffle}
          isRepeat={isRepeat}
          onTogglePlay={togglePlay}
          onPrev={prev}
          onNext={next}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={toggleRepeat}
        />
        <ProgressBar
          currentTime={currentTime}
          duration={currentTrack.durationSeconds}
        />
      </div>

      <div className="player-bar__right">
        <IconButton
          icon={<Mic2 size={18} />}
          onClick={() => setShowLyrics((v) => !v)}
          active={showLyrics}
          size="sm"
          ariaLabel="Toggle lyrics"
        />
        <VolumeControl volume={volume} onVolumeChange={setVolume} />
      </div>

      {showLyrics && <LyricsPanel onClose={() => setShowLyrics(false)} />}
    </div>
  );
}

export default PlayerBar;