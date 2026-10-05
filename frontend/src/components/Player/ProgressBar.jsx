import { usePlayerTime } from '../../context/PlayerContext';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function ProgressBar({ duration = 0 }) {
  const currentTime = usePlayerTime();
  return (
    <div className="progress-bar">
      <span className="progress-bar__time">{formatTime(currentTime)}</span>
      <span className="progress-bar__time">{formatTime(duration)}</span>
    </div>
  );
}

export default ProgressBar;
