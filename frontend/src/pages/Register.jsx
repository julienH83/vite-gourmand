import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Seo from '../components/Seo';
import '../styles/register-premium.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '',
    email: '', address: '', password: '', confirmPassword: '',
    rgpd_consent: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/.test(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }

    if (!passwordValid) {
      return setError('Le mot de passe doit contenir au moins 10 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
    }

    if (!form.rgpd_consent) {
      return setError('Vous devez accepter la politique de confidentialité.');
    }

    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await register(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (key, value) => setForm({ ...form, [key]: value });

  return (
    <div className="rg">
      <Seo
        title="Inscription"
        description="Créez votre compte Vite & Gourmand pour commander vos prestations traiteur à Bordeaux."
        canonical="/register"
      />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="rg-hero" aria-labelledby="rg-h1">
        <div className="rg-hero__inner">
          <span className="rg-hero__kicker">Rejoignez-nous</span>
          <h1 id="rg-h1" className="rg-hero__title">Inscription</h1>
          <p className="rg-hero__sub">
            Créez votre compte pour accéder à vos devis, commandes et avantages.
          </p>
          <div className="rg-hero__rule" aria-hidden="true" />
          <p className="rg-hero__note">Rapide · Sécurisé · Gratuit</p>
        </div>
      </section>

      {/* ── BLOC PRINCIPAL — 2 colonnes ──────────────────────────── */}
      <section className="rg-section" aria-label="Inscription">
        <div className="rg-container">
          <div className="rg-grid">

            {/* Colonne gauche — rassurance */}
            <div className="rg-aside">
              <div className="rg-aside__block">
                <h2 className="rg-aside__title">Pourquoi créer un compte ?</h2>
                <div className="rg-aside__rule" aria-hidden="true" />
                <ul className="rg-aside__list">
                  <li className="rg-aside__item">
                    <span className="rg-aside__check" aria-hidden="true" />
                    Demandes de devis simplifiées et suivi en temps réel
                  </li>
                  <li className="rg-aside__item">
                    <span className="rg-aside__check" aria-hidden="true" />
                    Historique complet de vos commandes et factures
                  </li>
                  <li className="rg-aside__item">
                    <span className="rg-aside__check" aria-hidden="true" />
                    Coordonnées enregistrées pour vos prochains événements
                  </li>
                  <li className="rg-aside__item">
                    <span className="rg-aside__check" aria-hidden="true" />
                    Espace personnel sécurisé et confidentiel
                  </li>
                </ul>
              </div>

              <div className="rg-aside__links">
                <Link className="rg-link" to="/request-quote">Demander un devis</Link>
                <Link className="rg-link" to="/menus">Voir nos menus</Link>
              </div>
            </div>

            {/* Colonne droite — formulaire */}
            <div className="rg-form-wrap">
              <div className="rg-card">
                <h2 className="rg-card__title">Créer un compte</h2>
                <div className="rg-card__rule" aria-hidden="true" />

                {error && (
                  <div className="rg-alert" role="alert" aria-live="assertive">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="rg-form">
                  {/* Prénom / Nom — 2 colonnes */}
                  <div className="rg-form__row">
                    <div className="rg-field">
                      <label htmlFor="reg-firstname" className="rg-field__label">Prénom *</label>
                      <input
                        id="reg-firstname"
                        type="text"
                        className="rg-field__input"
                        required
                        autoComplete="given-name"
                        placeholder="Jean"
                        value={form.first_name}
                        onChange={e => update('first_name', e.target.value)}
                      />
                    </div>
                    <div className="rg-field">
                      <label htmlFor="reg-lastname" className="rg-field__label">Nom *</label>
                      <input
                        id="reg-lastname"
                        type="text"
                        className="rg-field__input"
                        required
                        autoComplete="family-name"
                        placeholder="Dupont"
                        value={form.last_name}
                        onChange={e => update('last_name', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="rg-field">
                    <label htmlFor="reg-phone" className="rg-field__label">Téléphone *</label>
                    <input
                      id="reg-phone"
                      type="tel"
                      className="rg-field__input"
                      required
                      autoComplete="tel"
                      placeholder="06 12 34 56 78"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                    />
                  </div>

                  <div className="rg-field">
                    <label htmlFor="reg-email" className="rg-field__label">Email *</label>
                    <input
                      id="reg-email"
                      type="email"
                      className="rg-field__input"
                      required
                      autoComplete="email"
                      placeholder="vous@exemple.com"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                    />
                  </div>

                  <div className="rg-field">
                    <label htmlFor="reg-address" className="rg-field__label">Adresse postale *</label>
                    <input
                      id="reg-address"
                      type="text"
                      className="rg-field__input"
                      required
                      autoComplete="street-address"
                      placeholder="10 Place de la Bourse, 33000 Bordeaux"
                      value={form.address}
                      onChange={e => update('address', e.target.value)}
                    />
                  </div>

                  <div className="rg-field">
                    <label htmlFor="reg-password" className="rg-field__label">Mot de passe *</label>
                    <input
                      id="reg-password"
                      type="password"
                      className="rg-field__input"
                      required
                      autoComplete="new-password"
                      placeholder="Votre mot de passe"
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                    />
                    <small className={`rg-field__hint${passwordValid ? ' rg-field__hint--valid' : ''}`}>
                      Min. 10 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
                    </small>
                  </div>

                  <div className="rg-field">
                    <label htmlFor="reg-confirm" className="rg-field__label">Confirmer le mot de passe *</label>
                    <input
                      id="reg-confirm"
                      type="password"
                      className="rg-field__input"
                      required
                      autoComplete="new-password"
                      placeholder="Confirmez votre mot de passe"
                      value={form.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)}
                    />
                  </div>

                  {/* Checkbox RGPD */}
                  <label className="rg-checkbox" htmlFor="reg-rgpd">
                    <input
                      id="reg-rgpd"
                      type="checkbox"
                      className="rg-checkbox__input"
                      checked={form.rgpd_consent}
                      onChange={e => update('rgpd_consent', e.target.checked)}
                    />
                    <span className="rg-checkbox__text">
                      J'accepte les <Link to="/legal/mentions_legales" target="_blank">mentions légales</Link>,
                      les <Link to="/legal/cgv" target="_blank">CGV</Link> et consens au traitement de mes
                      données personnelles conformément au RGPD. *
                    </span>
                  </label>

                  <button type="submit" className="rg-btn" disabled={loading}>
                    {loading ? 'Inscription…' : 'Créer mon compte'}
                  </button>

                  <div className="rg-form__divider" aria-hidden="true" />

                  <p className="rg-form__register">
                    Déjà un compte ?{' '}
                    <Link to="/login" className="rg-form__link rg-form__link--accent">Se connecter</Link>
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
