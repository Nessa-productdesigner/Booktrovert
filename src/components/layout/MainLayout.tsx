import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import './MainLayout.css';

export default function MainLayout() {
  const navigate = useNavigate();
  const { profile, setSession, setProfile } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : profile?.email?.slice(0, 2).toUpperCase() || '?';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowDropdown(false);
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    navigate('/auth?mode=login');
  };

  return (
    <div className="main-layout">
      <header className="main-layout__header">
        <div className="main-layout__header-container">
          <div className="main-layout__brand">
            <NavLink to="/shelf" className="main-layout__logo">
              Booktrovert
            </NavLink>
          </div>
          {/* Desktop nav — hidden on mobile via CSS */}
          <nav className="main-layout__nav">
            <NavLink 
              to="/shelf" 
              className={({ isActive }) => `main-layout__nav-link ${isActive ? 'main-layout__nav-link--active' : ''}`}
            >
              My Shelf
            </NavLink>
            <NavLink 
              to="/recommendations" 
              className={({ isActive }) => `main-layout__nav-link ${isActive ? 'main-layout__nav-link--active' : ''}`}
            >
              Recommendations
            </NavLink>
          </nav>
          <div className="main-layout__actions" ref={dropdownRef}>
            <button
              className="main-layout__profile-btn"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="Profile menu"
            >
              <span className="main-layout__avatar">{initials}</span>
            </button>

            {showDropdown && (
              <div className="main-layout__dropdown">
                <div className="main-layout__dropdown-header">
                  <span className="main-layout__dropdown-name">
                    {profile?.display_name || profile?.email || 'User'}
                  </span>
                  {profile?.email && profile?.display_name && (
                    <span className="main-layout__dropdown-email">{profile.email}</span>
                  )}
                </div>
                <div className="main-layout__dropdown-divider" />
                <button className="main-layout__dropdown-item" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="main-layout__content">
        <Outlet />
      </main>

      {/* Mobile bottom navigation bar — shown on mobile via CSS */}
      <nav className="main-layout__bottom-nav" aria-label="Mobile navigation">
        <div className="main-layout__bottom-nav-inner">
          <NavLink
            to="/shelf"
            className={({ isActive }) =>
              `main-layout__bottom-nav-link ${isActive ? 'main-layout__bottom-nav-link--active' : ''}`
            }
          >
            <svg className="main-layout__bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="main-layout__bottom-nav-label">My Shelf</span>
          </NavLink>
          <NavLink
            to="/recommendations"
            className={({ isActive }) =>
              `main-layout__bottom-nav-link ${isActive ? 'main-layout__bottom-nav-link--active' : ''}`
            }
          >
            <svg className="main-layout__bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="main-layout__bottom-nav-label">For You</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
