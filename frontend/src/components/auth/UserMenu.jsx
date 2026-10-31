/**
 * UserMenu.jsx — User avatar / name + dropdown with logout option.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserMenu() {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const [open, setOpen]   = useState(false);
  const menuRef           = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            className="user-avatar-img"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="user-avatar-initials">{initials}</span>
        )}
        <span className="user-name">{user.name?.split(' ')[0]}</span>
        <span className="user-menu-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          {/* Profile header */}
          <div className="user-menu-profile">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="user-avatar-img lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="user-avatar-initials lg">{initials}</span>
            )}
            <div>
              <p className="user-menu-name">{user.name}</p>
              <p className="user-menu-email">{user.email}</p>
              {user.google_id && (
                <span className="user-menu-badge">Google Account</span>
              )}
            </div>
          </div>

          <div className="user-menu-divider" />

          <button className="user-menu-item" onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
