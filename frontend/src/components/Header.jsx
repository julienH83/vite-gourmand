import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const dashboardLabel =
    user?.role === 'admin'
      ? 'Administration'
      : user?.role === 'employee'
      ? 'Espace employé'
      : 'Mon espace';

  return (
    <header className="header" role="banner">
      <div className="header-inner">
        <Link
          to="/"
          className="logo"
          onClick={() => setMenuOpen(false)}
          aria-label="Vite & Gourmand - Accueil"
        >
          <img
            src="/images/logo.jpg"
            alt="Vite & Gourmand"
            className="logo-img"
          />
          <span className="logo-text">
            Vite <span className="logo-accent">&</span> Gourmand
          </span>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          aria-label="Menu de navigation"
          type="button"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav
          id="main-nav"
          className={menuOpen ? 'open' : ''}
          role="navigation"
          aria-label="Navigation principale"
        >
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>
            Accueil
          </NavLink>

          <NavLink to="/menus" onClick={() => setMenuOpen(false)}>
            Nos Menus
          </NavLink>

          <NavLink to="/prestations" onClick={() => setMenuOpen(false)}>
            Prestations
          </NavLink>

          <NavLink to="/boissons" onClick={() => setMenuOpen(false)}>
            Boissons
          </NavLink>

          <NavLink to="/contact" onClick={() => setMenuOpen(false)}>
            Contact
          </NavLink>

          {user ? (
            <>
              <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
                {dashboardLabel}
              </NavLink>
              <button
                className="nav-btn nav-btn--outline"
                onClick={handleLogout}
                type="button"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setMenuOpen(false)}>
                Connexion
              </NavLink>
              <NavLink
                to="/register"
                className="nav-btn nav-btn--primary"
                onClick={() => setMenuOpen(false)}
              >
                Inscription
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
