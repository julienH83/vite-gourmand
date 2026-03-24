import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Seo from '../components/Seo';
import '../styles/login-premium.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate(redirect);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg">
      <Seo
        title="Connexion"
        description="Connectez-vous à votre espace Vite & Gourmand pour gérer vos commandes et devis."
        canonical="/login"
      />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="lg-hero" aria-labelledby="lg-h1">
        <div className="lg-hero__inner">
          <span className="lg-hero__kicker">Espace client</span>
          <h1 id="lg-h1" className="lg-hero__title">Connexion</h1>
          <p className="lg-hero__sub">
            Accédez à votre espace pour suivre vos devis et commandes.
          </p>
          <div className="lg-hero__rule" aria-hidden="true" />
          <p className="lg-hero__note">Sécurisé · Accès réservé</p>
        </div>
      </section>

      {/* ── BLOC PRINCIPAL — 2 colonnes ──────────────────────────── */}
      <section className="lg-section" aria-label="Connexion">
        <div className="lg-container">
          <div className="lg-grid">

            {/* Colonne gauche — rassurance */}
            <div className="lg-aside">
              <div className="lg-aside__block">
                <h2 className="lg-aside__title">Votre espace Vite & Gourmand</h2>
                <div className="lg-aside__rule" aria-hidden="true" />
                <ul className="lg-aside__list">
                  <li className="lg-aside__item">
                    <span className="lg-aside__check" aria-hidden="true" />
                    Suivi de devis et commandes
                  </li>
                  <li className="lg-aside__item">
                    <span className="lg-aside__check" aria-hidden="true" />
                    Historique & facturation
                  </li>
                  <li className="lg-aside__item">
                    <span className="lg-aside__check" aria-hidden="true" />
                    Coordonnées enregistrées pour vos prochains événements
                  </li>
                </ul>
              </div>

              <div className="lg-aside__links">
                <Link className="lg-link" to="/request-quote">Demander un devis</Link>
                <Link className="lg-link" to="/menus">Voir nos menus</Link>
              </div>
            </div>

            {/* Colonne droite — formulaire */}
            <div className="lg-form-wrap">
              <div className="lg-card">
                <h2 className="lg-card__title">Se connecter</h2>
                <div className="lg-card__rule" aria-hidden="true" />

                {error && (
                  <div className="lg-alert" role="alert" aria-live="assertive">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="lg-form">
                  <div className="lg-field">
                    <label htmlFor="login-email" className="lg-field__label">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      className="lg-field__input"
                      required
                      autoComplete="email"
                      placeholder="vous@exemple.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div className="lg-field">
                    <label htmlFor="login-password" className="lg-field__label">Mot de passe</label>
                    <input
                      id="login-password"
                      type="password"
                      className="lg-field__input"
                      required
                      autoComplete="current-password"
                      placeholder="Votre mot de passe"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="lg-btn" disabled={loading}>
                    {loading ? 'Connexion…' : 'Se connecter'}
                  </button>

                  <div className="lg-form__footer">
                    <Link to="/forgot-password" className="lg-form__link">Mot de passe oublié ?</Link>
                  </div>

                  <div className="lg-form__divider" aria-hidden="true" />

                  <p className="lg-form__register">
                    Pas encore de compte ?{' '}
                    <Link to="/register" className="lg-form__link lg-form__link--accent">S'inscrire</Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
