import { usePlayer } from '../../context/PlayerContext';

function PlayerProgressStrip() {
  const { currentTime, currentTrack, seek } = usePlayer();
  const duration = currentTrack.durationSeconds || 0;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    seek(clickRatio * duration);
  };

  return (
    <div className="player-progress-strip" onClick={handleClick}>
      <div
        className="player-progress-strip__fill"
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  );
}

export default PlayerProgressStrip;