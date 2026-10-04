function Loader({ inline = false }) {
  if (inline) {
    // Fills only the area it is placed in (e.g. the main page section)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          width: '100%',
        }}
      >
        <div className="loader-spinner" />
      </div>
    );
  }

  return (
    <div className="loader-overlay">
      <div className="loader-spinner" />
    </div>
  );
}

export default Loader;
