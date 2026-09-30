function IconButton({ icon, onClick, active = false, size = 'md', ariaLabel }) {
  return (
    <button
      className={`icon-button icon-button--${size} ${active ? 'icon-button--active' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
}

export default IconButton;