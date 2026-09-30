import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import IconButton from '../common/IconButton';

function getVolumeIcon(volume) {
  if (volume === 0) return <VolumeX size={18} />;
  if (volume < 50) return <Volume1 size={18} />;
  return <Volume2 size={18} />;
}

function VolumeControl({ volume = 70, onVolumeChange, onToggleMute }) {
  const handleTrackClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.round(Math.min(Math.max(clickRatio, 0), 1) * 100);
    onVolumeChange?.(newVolume);
  };

  return (
    <div className="volume-control">
      <IconButton
        icon={getVolumeIcon(volume)}
        onClick={onToggleMute}
        size="sm"
        ariaLabel="Mute"
      />
      <div className="volume-control__track" onClick={handleTrackClick}>
        <div
          className="volume-control__fill"
          style={{ width: `${volume}%` }}
        />
      </div>
    </div>
  );
}

export default VolumeControl;