import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Seo from '../components/Seo';
import '../styles/boissons-premium.css';

/* ─── Collections — groupent les formules API par catégorie ── */
const COLLECTIONS = [
  {
    key: 'sans-alcool',
    title: 'Softs & Sans Alcool',
    intro: 'Eaux minérales, jus de fruits et boissons sans alcool soigneusement sélectionnés, pour que chaque convive trouve son accord.',
    match: label => /sans alcool/i.test(label),
  },
  {
    key: 'vins',
    title: 'Sélection de Vins',
    intro: 'Bordeaux et grandes régions — nos sommeliers composent une cave en harmonie avec votre menu.',
    match: label => /sélection vin/i.test(label),
  },
  {
    key: 'bieres',
    title: 'Bières & Pétillants',
    intro: 'Bières artisanales, champagnes et crémants — pour une ambiance festive et mémorable.',
    match: label => /bière|bulle/i.test(label),
  },
  {
    key: 'open-bar',
    title: 'Open Bar',
    intro: 'Service complet animé par notre équipe — cocktails, spiritueux et mocktails du début à la fin de soirée.',
    match: label => /open bar/i.test(label),
  },
];

function formatUnit(unit) {
  if (unit === 'par_personne') return '/ pers.';
  if (unit === 'par_heure')    return '/ h';
  return '(forfait)';
}

/* ─── Ligne de formule — style carte de restaurant ──────────── */
function BoissonItem({ opt }) {
  const price = Number(opt.unit_price) > 0
    ? `${Number(opt.unit_price).toFixed(2)} € ${formatUnit(opt.unit)}`
    : 'Sur devis';

  return (
    <div className="bv-item">
      <div className="bv-item__text">
        <h4 className="bv-item__name">{opt.label}</h4>
        {opt.description && (
          <p className="bv-item__desc">{opt.description}</p>
        )}
      </div>
      <span className="bv-item__price">{price}</span>
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────── */
export default function Boissons() {
  const [formules, setFormules] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const listRef = useRef(null);
  const heroRef = useRef(null);

  /* ── Parallax léger sur l'image hero ── */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onScroll = () => {
      hero.style.setProperty('--bv-parallax', `${window.scrollY * 0.15}px`);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    api.get('/quote-options?limit=100')
      .then(r => r.json())
      .then(data => {
        const all = data.data || [];

        const formulesKeywords = ['formule sans alcool', 'sélection vins', 'bières & bulles', 'open bar'];
        const svcKeywords      = ['cave à vin', 'bar à cocktails', 'verres & matériel'];

        setFormules(all.filter(o => formulesKeywords.some(kw => o.label.toLowerCase().includes(kw))));
        setServices(all.filter(o => svcKeywords.some(kw => o.label.toLowerCase().includes(kw))));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── Scroll reveal : fade-up sur chaque bloc catégorie ── */
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.bv-cat');
    if (!items.length) return;

    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('bv-cat--visible');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' }
    );

    items.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [formules]);

  return (
    <div className="bv">
      <Seo
        title="Boissons"
        description="Sélection de boissons pour vos événements à Bordeaux : vins, bières, softs, formules sans alcool. Inclus dans votre devis traiteur."
        canonical="/boissons"
      />

      {/* ── HERO (identique Prestations) ─────────────────────────── */}
      <section className="bv-hero" aria-labelledby="bv-h1" ref={heroRef}>
        <div className="bv-hero__inner">
          <span className="bv-hero__kicker">Service traiteur · Bordeaux</span>
          <h1 id="bv-h1" className="bv-hero__title">
            Nos <em>Boissons</em>
          </h1>
          <p className="bv-hero__sub">
            Du champagne d'apéritif aux digestifs de fin de soirée, nous composons la sélection idéale en accord avec vos menus et votre style d'événement.
          </p>
          <Link className="bv-btn" to="/request-quote">
            Demander un devis
          </Link>
          <p className="bv-hero__note">
            <Link to="/menus">Voir nos menus</Link>
            {' · '}Devis sous 48h — consultation gratuite
          </p>
        </div>
      </section>

      {/* ── NOS FORMULES ─────────────────────────────────────────── */}
      <section className="bv-section" aria-labelledby="formules-h2">
        <div className="bv-container">
          <header className="bv-config__head">
            <span className="bv-config__kicker">La carte</span>
            <h2 id="formules-h2">Nos formules boissons</h2>
            <p>Composez votre sélection parmi nos formules — notre équipe affine chaque détail avec vous.</p>
          </header>

          {loading ? (
            <p className="bv-loading">Chargement des formules…</p>
          ) : (
            <div className="bv-formules" ref={listRef}>
              {COLLECTIONS.map(col => {
                const items = formules.filter(o => col.match(o.label));
                if (items.length === 0) return null;
                return (
                  <div key={col.key} className="bv-cat">
                    <div className="bv-cat__header">
                      <h3 className="bv-cat__title">{col.title}</h3>
                      <div className="bv-cat__rule" aria-hidden="true" />
                    </div>
                    <p className="bv-cat__intro">{col.intro}</p>
                    <div className="bv-cat__list">
                      {items.map(opt => (
                        <BoissonItem key={opt.id} opt={opt} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Services complémentaires (identique Prestations pp-opts) */}
          {services.length > 0 && (
            <div className="bv-opts">
              <h3 className="bv-opts__title">Services complémentaires</h3>
              <div className="bv-opts__grid">
                {services.map(svc => (
                  <div key={svc.id} className="bv-opt">
                    <div>
                      <span className="bv-opt__label">{svc.label}</span>
                      {Number(svc.unit_price) > 0 && (
                        <span className="bv-opt__price">
                          {Number(svc.unit_price).toFixed(2)} € {formatUnit(svc.unit)}
                        </span>
                      )}
                      {svc.description && (
                        <span className="bv-opt__desc">{svc.description}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── NOTRE ENGAGEMENT (identique Prestations engagements) ── */}
      <section className="bv-section bv-section--surface" aria-labelledby="engage-h2">
        <div className="bv-container">
          <header className="bv-section__head">
            <h2 id="engage-h2">Notre engagement</h2>
            <p>Chaque sélection est pensée pour sublimer vos plats, jamais pour les écraser.</p>
          </header>
          <div className="bv-engagements">
            {[
              { label: 'Accords mets & boissons', desc: "Nos équipes travaillent en étroite collaboration avec les chefs pour composer des accords mets-boissons cohérents, de l'apéritif au digestif." },
              { label: 'Sur mesure', desc: 'Accompagnement personnalisé pour les événements avec contraintes spécifiques : régimes sans alcool, budgets encadrés, thèmes gastronomiques régionaux.' },
              { label: 'Devis transparent', desc: 'Conseil personnalisé par notre équipe, devis détaillé sous 48h, accord boissons / menus sur demande.' },
              { label: 'Tout est inclus', desc: "Livraison et mise en place sur site, repli et récupération du matériel. Aucun frais caché le jour J." },
            ].map((e, i) => (
              <div className="bv-engage" key={e.label}>
                <span className="bv-engage__num">{'0' + (i + 1)}</span>
                <h3 className="bv-engage__title">{e.label}</h3>
                <div className="bv-engage__rule" aria-hidden="true" />
                <p className="bv-engage__desc">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFICATION (identique Prestations timeline) ────────── */}
      <section className="bv-section" aria-labelledby="tarif-h2">
        <div className="bv-container">
          <header className="bv-section__head">
            <h2 id="tarif-h2">Comment est calculé votre devis ?</h2>
            <p>Les tarifs affichés sont indicatifs. Le devis final intègre l'ensemble des critères ci-dessous.</p>
          </header>

          <div className="bv-timeline">
            {[
              { label: 'Nombre de convives',     desc: 'Le volume détermine les quantités et peut ouvrir droit à des tarifs dégressifs.' },
              { label: 'Durée du service',       desc: "Apéritif d'1h, cocktail dînatoire ou soirée complète — chaque format a son calcul." },
              { label: 'Références choisies',    desc: "De l'entrée de gamme aux cuvées premium, la sélection est entièrement libre." },
              { label: 'Type de service',        desc: 'Self-service, service à table ou open bar animé : le personnel influe sur le tarif.' },
              { label: 'Fourniture du matériel', desc: 'Verres, carafes, glacières, frigos mobiles — tout peut être inclus ou non.' },
              { label: 'Lieu & logistique',      desc: 'Accessibilité du site, livraison en centre de Bordeaux ou en périphérie.' },
            ].map((item, i) => (
              <div className="bv-tl-step" key={item.label}>
                <div className="bv-tl-step__marker" aria-hidden="true">
                  <span className="bv-tl-step__num">{'0' + (i + 1)}</span>
                </div>
                <div className="bv-tl-step__body">
                  <h3 className="bv-tl-step__title">{item.label}</h3>
                  <div className="bv-tl-step__rule" aria-hidden="true" />
                  <p className="bv-tl-step__desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bv-included">
            <h3 className="bv-included__title">
              Toujours inclus dans votre devis
            </h3>
            <div className="bv-included__grid">
              {[
                'Conseil personnalisé par notre équipe',
                'Accord boissons / menus sur demande',
                'Devis détaillé sous 48h',
                'Livraison et mise en place sur site',
                'Repli et récupération du matériel',
                'Aucun frais caché le jour J',
              ].map(item => (
                <p className="bv-included__item" key={item}>
                  <span className="bv-included__check" aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL (identique Prestations) ────────────────────── */}
      <section className="bv-cta" aria-label="Appel à l'action">
        <h2 className="bv-cta__title">Composons ensemble votre carte des boissons</h2>
        <p className="bv-cta__sub">
          Notre équipe vous accompagne dans la composition de votre sélection, en accord avec vos menus et votre style d'événement.
        </p>
        <div className="bv-cta__actions">
          <Link className="bv-btn" to="/request-quote">
            Demander un devis
          </Link>
          <Link className="bv-link" to="/menus">Voir nos menus</Link>
          <Link className="bv-link" to="/prestations">Nos prestations</Link>
        </div>
      </section>
    </div>
  );
}
