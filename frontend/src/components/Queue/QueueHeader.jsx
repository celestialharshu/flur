function QueueHeader({ title = 'Queue' }) {
  return (
    <div className="queue-header">
      <h2 className="queue-header__title">{title}</h2>
    </div>
  );
}

export default QueueHeader;