import { memo } from 'react';
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat } from 'lucide-react';
import IconButton from '../common/IconButton';

function PlaybackControls({
  isPlaying = false,
  isShuffle = false,
  isRepeat = false,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
}) {
  return (
    <div className="playback-controls">
      <IconButton
        icon={<Shuffle size={16} />}
        onClick={onToggleShuffle}
        active={isShuffle}
        size="sm"
        ariaLabel="Shuffle"
      />
      <IconButton
        icon={<SkipBack size={18} fill="currentColor" />}
        onClick={onPrev}
        size="md"
        ariaLabel="Previous track"
      />
      <IconButton
        icon={
          isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" />
          )
        }
        onClick={onTogglePlay}
        size="lg"
        ariaLabel={isPlaying ? 'Pause' : 'Play'}
      />
      <IconButton
        icon={<SkipForward size={18} fill="currentColor" />}
        onClick={onNext}
        size="md"
        ariaLabel="Next track"
      />
      <IconButton
        icon={<Repeat size={16} />}
        onClick={onToggleRepeat}
        active={isRepeat}
        size="sm"
        ariaLabel="Repeat"
      />
    </div>
  );
}

export default memo(PlaybackControls);