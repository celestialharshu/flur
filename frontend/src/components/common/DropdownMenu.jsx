import { useState, useRef, useEffect } from 'react';

function DropdownMenu({ trigger, children, align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggle = (e) => {
    e.stopPropagation(); // prevents parent row's onClick (e.g. play track) from firing
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="dropdown-menu" ref={menuRef}>
      <div className="dropdown-menu__trigger" onClick={toggle}>
        {trigger}
      </div>

      {isOpen && (
        <div className={`dropdown-menu__panel dropdown-menu__panel--${align}`}>
          {typeof children === 'function' ? children({ close: () => setIsOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}

export default DropdownMenu;