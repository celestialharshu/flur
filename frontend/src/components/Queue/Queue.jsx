import QueueHeader from './QueueHeader';
import QueueItem from './QueueItem';
import { usePlayer } from '../../context/PlayerContext';

function Queue() {
  const { queue, currentTrack, playTrack } = usePlayer();

  return (
    <div className="queue">
      <QueueHeader />
      <div className="queue__list">
        {queue.map((track) => (
          <QueueItem
            key={track.id}
            thumbnail={track.thumbnail}
            title={track.title}
            artist={track.artist}
            duration={track.duration}
            isActive={track.id === currentTrack.id}
            onClick={() => playTrack(track)}
          />
        ))}
      </div>
    </div>
  );
}

export default Queue;