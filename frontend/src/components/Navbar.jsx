import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar" role="navigation">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
          💍 {t('app.title')}
        </Link>

        <button
          className="nav-menu-btn"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(o => !o)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <ul className={`navbar__links ${menuOpen ? '' : 'hidden'}`}>
          <li><NavLink to="/search?gender=female" onClick={() => setMenuOpen(false)}>👰 {t('nav.brides')}</NavLink></li>
          <li><NavLink to="/search?gender=male"   onClick={() => setMenuOpen(false)}>🤵 {t('nav.grooms')}</NavLink></li>

          {token ? (
            <>
              <li><NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>{t('nav.dashboard')}</NavLink></li>
              <li><NavLink to="/profile/new" onClick={() => setMenuOpen(false)}>{t('nav.post')}</NavLink></li>
              {role === 'admin' && (
                <li><NavLink to="/admin" onClick={() => setMenuOpen(false)}>
                  <span style={{ color: '#a78bfa' }}>⚙️ {t('nav.admin')}</span>
                </NavLink></li>
              )}
              <li><button className="btn btn-ghost btn-sm" onClick={logout}>{t('nav.logout')}</button></li>
            </>
          ) : (
            <>
              <li><NavLink to="/login"    onClick={() => setMenuOpen(false)}>{t('nav.login')}</NavLink></li>
              <li><NavLink to="/register" onClick={() => setMenuOpen(false)}><button className="btn btn-primary btn-sm">{t('nav.register')}</button></NavLink></li>
            </>
          )}

          <li><LanguageSwitcher /></li>
        </ul>
      </div>
    </nav>
  );
}
