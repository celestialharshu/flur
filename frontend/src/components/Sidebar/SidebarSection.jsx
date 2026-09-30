function SidebarSection({ title, children }) {
  return (
    <div className="sidebar-section">
      {title && <span className="sidebar-section__title">{title}</span>}
      <div className="sidebar-section__items">
        {children}
      </div>
    </div>
  );
}

export default SidebarSection;