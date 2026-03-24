import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Seo from '../components/Seo';
import '../styles/contact-premium.css';

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const FAQ_ITEMS = [
  {
    q: 'Sous quel délai répondez-vous ?',
    a: 'Nous nous engageons à répondre à chaque demande sous 24 à 48h ouvrées. Pour les demandes urgentes, n\'hésitez pas à nous appeler directement.',
  },
  {
    q: 'Proposez-vous des options végétariennes / sans gluten ?',
    a: 'Oui, tous nos menus peuvent être adaptés : végétarien, vegan, sans gluten, halal. Précisez vos besoins dans votre message ou lors de la demande de devis.',
  },
  {
    q: 'Quel est le minimum de convives ?',
    a: 'Nos prestations sont disponibles à partir de 10 convives. Pour les événements de grande envergure, nous pouvons accueillir jusqu\'à 500 personnes.',
  },
  {
    q: 'La livraison et l\'installation sont-elles incluses ?',
    a: 'Oui, la livraison à Bordeaux et en Gironde, la mise en place et le repli du matériel sont inclus dans chaque devis. Aucun frais caché.',
  },
];

/* ─── Accordéon FAQ — aucune librairie ──────────────────────── */
function FaqItem({ item, index, open, onToggle }) {
  const id = `ct-faq-${index}`;

  return (
    <div className={`ct-faq__item${open ? ' ct-faq__item--open' : ''}`}>
      <button
        className="ct-faq__trigger"
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        id={`${id}-btn`}
        onClick={onToggle}
      >
        <span className="ct-faq__question">{item.q}</span>
        <span className="ct-faq__icon" aria-hidden="true" />
      </button>
      <div
        className="ct-faq__panel"
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
      >
        <p className="ct-faq__answer">{item.a}</p>
      </div>
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────── */
export default function Contact() {
  const [form, setForm] = useState({ title: '', description: '', email: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    api.get('/hours')
      .then(res => res.json())
      .then(setHours)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/contact', form);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.errors?.join(', '));
      setSuccess('Votre message a été envoyé avec succès. Nous vous répondrons rapidement.');
      setForm({ title: '', description: '', email: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ct">
      <Seo
        title="Contact"
        description="Contactez Vite & Gourmand pour toute question ou demande de devis personnalisé. Traiteur événementiel à Bordeaux."
        canonical="/contact"
      />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="ct-hero" aria-labelledby="ct-h1">
        <div className="ct-hero__inner">
          <span className="ct-hero__kicker">Vite & Gourmand</span>
          <h1 id="ct-h1" className="ct-hero__title">Contact</h1>
          <p className="ct-hero__sub">
            Une question ? Un devis personnalisé ? Écrivez-nous.
          </p>
          <div className="ct-hero__rule" aria-hidden="true" />
          <p className="ct-hero__note">Réponse sous 24–48h</p>
        </div>
      </section>

      {/* ── BLOC PRINCIPAL — 2 colonnes ──────────────────────────── */}
      <section className="ct-section" aria-label="Coordonnées et formulaire">
        <div className="ct-container">
          <div className="ct-grid">

            {/* Colonne gauche — infos */}
            <div className="ct-info">
              {/* Coordonnées */}
              <div className="ct-card">
                <h2 className="ct-card__title">Coordonnées</h2>
                <div className="ct-card__rule" aria-hidden="true" />
                <address className="ct-card__body">
                  <p className="ct-card__line">
                    <span className="ct-card__label">Adresse</span>
                    10 Place de la Bourse, 33000 Bordeaux
                  </p>
                  <p className="ct-card__line">
                    <span className="ct-card__label">Téléphone</span>
                    <a href="tel:+33556000000">05 56 00 00 00</a>
                  </p>
                  <p className="ct-card__line">
                    <span className="ct-card__label">Email</span>
                    <a href="mailto:contact@vitegourmand.fr">contact@vitegourmand.fr</a>
                  </p>
                </address>
              </div>

              {/* Horaires */}
              <div className="ct-card">
                <h2 className="ct-card__title">Horaires</h2>
                <div className="ct-card__rule" aria-hidden="true" />
                <div className="ct-card__body">
                  {hours.length > 0 ? (
                    <ul className="ct-hours">
                      {hours.map(h => (
                        <li className="ct-hours__row" key={h.day_of_week}>
                          <span className="ct-hours__day">{DAY_NAMES[h.day_of_week]}</span>
                          <span className="ct-hours__time">
                            {h.is_closed ? 'Fermé' : `${h.open_time?.slice(0, 5)} – ${h.close_time?.slice(0, 5)}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ct-card__muted">Chargement des horaires…</p>
                  )}
                </div>
              </div>

              {/* Zone d'intervention */}
              <div className="ct-card">
                <h2 className="ct-card__title">Zone d'intervention</h2>
                <div className="ct-card__rule" aria-hidden="true" />
                <div className="ct-card__body">
                  <p className="ct-card__text">Bordeaux & Gironde — déplacement sur demande dans tout le Sud-Ouest.</p>
                  <p className="ct-card__muted">Livraison et installation possibles sur tous types de lieux.</p>
                </div>
              </div>
            </div>

            {/* Colonne droite — formulaire */}
            <div className="ct-form-wrap">
              <div className="ct-card ct-card--form">
                <h2 className="ct-card__title">Envoyez-nous un message</h2>
                <div className="ct-card__rule" aria-hidden="true" />

                {success && <div className="ct-alert ct-alert--success" role="status">{success}</div>}
                {error && <div className="ct-alert ct-alert--error" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="ct-form">
                  <div className="ct-field">
                    <label htmlFor="contact-title" className="ct-field__label">Sujet *</label>
                    <input
                      id="contact-title"
                      type="text"
                      className="ct-field__input"
                      required
                      placeholder="Ex : Demande de devis mariage"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                  </div>

                  <div className="ct-field">
                    <label htmlFor="contact-email" className="ct-field__label">Votre email *</label>
                    <input
                      id="contact-email"
                      type="email"
                      className="ct-field__input"
                      required
                      placeholder="vous@exemple.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div className="ct-field">
                    <label htmlFor="contact-desc" className="ct-field__label">Message *</label>
                    <textarea
                      id="contact-desc"
                      className="ct-field__input ct-field__input--textarea"
                      required
                      rows="6"
                      placeholder="Décrivez votre projet ou posez votre question…"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="ct-btn" disabled={loading}>
                    {loading ? 'Envoi en cours…' : 'Envoyer le message'}
                  </button>

                  <p className="ct-form__legal">
                    En envoyant ce message, vous acceptez notre{' '}
                    <Link to="/legal/confidentialite">politique de confidentialité</Link>.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA DEVIS ────────────────────────────────────────────── */}
      <section className="ct-devis" aria-label="Demande de devis">
        <div className="ct-container">
          <div className="ct-devis__inner">
            <h2 className="ct-devis__title">Vous avez déjà un projet en tête ?</h2>
            <p className="ct-devis__sub">
              Gagnez du temps : demandez directement un devis personnalisé en ligne.
            </p>
            <div className="ct-devis__actions">
              <Link className="ct-btn" to="/request-quote">Demander un devis</Link>
              <Link className="ct-link" to="/menus">Voir nos menus</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="ct-section ct-section--surface" aria-labelledby="ct-faq-h2">
        <div className="ct-container">
          <header className="ct-section__head">
            <h2 id="ct-faq-h2">Questions fréquentes</h2>
            <p>Les réponses aux questions les plus courantes.</p>
          </header>
          <div className="ct-faq">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                index={i}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
