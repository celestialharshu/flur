import QueueHeader from './QueueHeader';
import QueueItem from './QueueItem';
import { usePlayer } from '../../context/PlayerContext';

function Queue() {
  const { queue, currentTrack, playTrack } = usePlayer();
  const activeId = currentTrack?.id;

  return (
    <div className="queue">
      <QueueHeader />
      <div className="queue__list">
        {queue.map((track) => (
          <QueueItem
            key={track.id}
            track={track}
            isActive={track.id === activeId}
            onPlay={playTrack}
          />
        ))}
      </div>
    </div>
  );
}

export default Queue;
