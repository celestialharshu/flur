import { memo } from 'react';

function NavItem({ icon, label, viewKey, activeView, onNavigate }) {
  const isActive = activeView === viewKey;

  return (
    <button
      className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
      onClick={() => onNavigate(viewKey)}
    >
      <span className="nav-item__icon">{icon}</span>
      <span className="nav-item__label">{label}</span>
    </button>
  );
}

export default memo(NavItem);
