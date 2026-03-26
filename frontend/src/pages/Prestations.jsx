import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Seo from '../components/Seo';
import '../styles/prestations-premium.css';

/* ─── Métadonnées par prestation ───────────────────────────────────────────── */
const PRESTATION_META = {
  'mariage':        { icon: '💍', badge: 'Populaire', subtitle: 'De la cérémonie au dîner',  image: '/images/Mariage.jpg' },
  'séminaire':      { icon: '🏢', badge: null,        subtitle: 'Événements professionnels', image: '/images/Séminaire & entreprise.jpg' },
  'anniversaire':   { icon: '🎂', badge: null,        subtitle: 'Célébrations privées',       image: '/images/Anniversaire & réception.jpg' },
  'cocktail':       { icon: '🥂', badge: null,        subtitle: 'Convivialité & élégance',    image: '/images/Cocktail & apéritif dînatoire.jpg' },
  'livraison':      { icon: '🚚', badge: null,        subtitle: 'Bordeaux & périphérie',      image: '/images/Livraison & logistique.jpg' },
  'menus spéciaux': { icon: '🌿', badge: null,        subtitle: 'Pour tous les convives',     image: '/images/Menus spéciaux.jpg' },
};

const OPTION_ICONS = {
  'location de matériel': '🪑',
  'personnel de service': '🤵',
  'décoration de table':  '🌸',
  'sonorisation':         '🎵',
};

function matchMeta(map, label) {
  const lower = label.toLowerCase();
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

/* ─── Bloc prestation horizontal (vitrine éditoriale) ─────────────────────── */
function PrestationCard({ opt, meta, index }) {
  const isEven = index % 2 === 0;
  const image  = meta?.image || '/images/chef.jpg';

  return (
    <article className={`pp-prest${isEven ? '' : ' pp-prest--flip'}`}>
      {/* Zone visuelle : photo nette + overlay très léger */}
      <div
        className="pp-prest__visual"
        style={{ '--pp-img': `url('${image}')` }}
        role="presentation"
      />

      {/* Corps textuel */}
      <div className="pp-prest__body">
        {meta?.badge && <span className="pp-prest__badge">{meta.badge}</span>}
        <h3 className="pp-prest__name">
          {opt.label.replace(/^Prestation\s*/i, '')}
        </h3>
        <div className="pp-prest__rule" aria-hidden="true" />
        <p className="pp-prest__sub">{meta?.subtitle || ''}</p>
        <p className="pp-prest__desc">{opt.description || '—'}</p>
      </div>
    </article>
  );
}

/* ─── Page principale ──────────────────────────────────────────────────────── */
export default function Prestations() {
  const [prestations, setPrestations] = useState([]);
  const [optionsComp, setOptionsComp] = useState([]);
  const [loadingOpts, setLoadingOpts] = useState(true);

  const listRef = useRef(null);

  useEffect(() => {
    document.title = 'Prestations | Vite & Gourmand';
  }, []);

  useEffect(() => {
    api.get('/quote-options?limit=100')
      .then(r => r.json())
      .then(data => {
        const all = data.data || [];
        const pList = all.filter(o => o.label.toLowerCase().startsWith('prestation '));
        const compKw = ['location de matériel', 'personnel de service (serveurs', 'décoration de table &', 'sonorisation &'];
        const oList = all.filter(o => compKw.some(kw => o.label.toLowerCase().includes(kw)));
        setPrestations(pList);
        setOptionsComp(oList);
      })
      .catch(() => {})
      .finally(() => setLoadingOpts(false));
  }, []);

  return (
    <div className="pp">
      <Seo
        title="Prestations"
        description="Toutes nos prestations traiteur à Bordeaux : mariage, anniversaire, séminaire, cocktail, gala. Devis personnalisé gratuit."
        canonical="/prestations"
      />

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="pp-hero" aria-labelledby="prest-h1">
        <div className="pp-hero__inner">
          <span className="pp-hero__kicker">Traiteur événementiel · Bordeaux</span>
          <h1 id="prest-h1" className="pp-hero__title">
            Nos <em>Prestations</em>
          </h1>
          <p className="pp-hero__sub">
            Sélectionnez les prestations qui vous intéressent — nous construisons votre devis sur mesure.
          </p>
          <Link className="pp-btn" to="/request-quote">
            Demander un devis
          </Link>
          <p className="pp-hero__note">
            <Link to="/menus">Voir nos menus</Link>
            {' · '}Réponse sous 24h — devis gratuit et sans engagement
          </p>
        </div>
      </section>

      {/* ── PRESTATIONS ────────────────────────────────────────────────────── */}
      <section className="pp-section" aria-labelledby="config-h2">
        <div className="pp-container">
          <header className="pp-config__head">
            <span className="pp-config__kicker">Nos prestations</span>
            <h2 id="config-h2">Choisissez vos prestations</h2>
            <p>Sélectionnez une ou plusieurs options — votre devis sera pré-configuré automatiquement.</p>
          </header>

          {loadingOpts ? (
            <p className="pp-loading">Chargement des prestations…</p>
          ) : prestations.length === 0 ? (
            <div className="pp-error">
              Impossible de charger les prestations.{' '}
              <button onClick={() => window.location.reload()}>Réessayer</button>
            </div>
          ) : (
            <div className="pp-prest-list" ref={listRef}>
              {prestations.map((opt, i) => (
                <PrestationCard
                  key={opt.id}
                  opt={opt}
                  meta={matchMeta(PRESTATION_META, opt.label)}
                  index={i}
                />
              ))}
            </div>
          )}

          {/* Options complémentaires */}
          {optionsComp.length > 0 && (
            <div className="pp-opts">
              <h3 className="pp-opts__title">Options complémentaires</h3>
              <div className="pp-opts__grid">
                {optionsComp.map(opt => {
                  const icon = matchMeta(OPTION_ICONS, opt.label) || '➕';
                  return (
                    <div key={opt.id} className="pp-opt">
                      <span className="pp-opt__icon" aria-hidden="true">{icon}</span>
                      <div>
                        <span className="pp-opt__label">{opt.label}</span>
                        {Number(opt.unit_price) > 0 && (
                          <span className="pp-opt__price">
                            {Number(opt.unit_price).toFixed(2)} €{' '}
                            {opt.unit === 'par_personne' ? '/ pers.' : opt.unit === 'par_heure' ? '/ h' : '(forfait)'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ──────────────────────────────────────────────── */}
      <section className="pp-section pp-section--surface" aria-labelledby="process-h2">
        <div className="pp-container">
          <header className="pp-section__head">
            <h2 id="process-h2">Comment ça marche ?</h2>
            <p>Un processus simple, en 4 étapes.</p>
          </header>
          <div className="pp-steps">
            {[
              { num: '1', title: 'Configurez votre demande',     desc: "Sélectionnez vos prestations ci-dessus : type d'événement, formules boissons, options de service." },
              { num: '2', title: 'Nous préparons votre devis',    desc: 'Notre équipe analyse votre demande et vous envoie un devis personnalisé sous 48h.' },
              { num: '3', title: 'Validation & acompte',          desc: 'Vous acceptez le devis et réglez un acompte de 30 % pour confirmer la réservation.' },
              { num: '4', title: 'Livraison & prestation',        desc: 'Notre équipe assure la mise en place, le service et le repli du matériel le jour J.' },
            ].map(step => (
              <div className="pp-step" key={step.num}>
                <div className="pp-step__num" aria-hidden="true">{step.num}</div>
                <h3 className="pp-step__title">{step.title}</h3>
                <p className="pp-step__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENGAGEMENTS ────────────────────────────────────────────────────── */}
      <section className="pp-section" aria-labelledby="engagements-h2">
        <div className="pp-container">
          <header className="pp-section__head">
            <h2 id="engagements-h2">Nos engagements</h2>
            <p>Qualité, réactivité et attention portée à chaque détail.</p>
          </header>
          <div className="pp-engagements">
            {[
              { label: 'Produits frais & locaux',  desc: 'Sélectionnés auprès de producteurs girondins selon la saison.' },
              { label: 'Ponctualité garantie',      desc: 'Livraison et installation dans les délais convenus, sans mauvaise surprise.' },
              { label: 'Interlocuteur dédié',       desc: "Un contact unique du devis jusqu'au lendemain de l'événement." },
              { label: 'Menus adaptés',             desc: 'Végétarien, vegan, sans gluten, halal — tous les régimes anticipés.' },
            ].map((e, i) => (
              <div className="pp-engage" key={e.label}>
                <span className="pp-engage__num">{'0' + (i + 1)}</span>
                <h3 className="pp-engage__title">{e.label}</h3>
                <div className="pp-engage__rule" aria-hidden="true" />
                <p className="pp-engage__desc">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFICATION ───────────────────────────────────────────────────── */}
      <section className="pp-section pp-section--surface" aria-labelledby="tarif-h2">
        <div className="pp-container">
          <header className="pp-section__head">
            <h2 id="tarif-h2">Comment est établi votre devis ?</h2>
            <p>Chaque événement est différent. Nous construisons un devis sur mesure, transparent et sans surprise.</p>
          </header>
          <div className="pp-timeline">
            {[
              { label: 'Nombre de convives',    desc: 'De 10 à 500 personnes — le volume influe directement sur les quantités et la logistique.' },
              { label: 'Type & durée',          desc: "Apéritif d'1h, repas assis complet ou soirée dansante : la prestation s'adapte à votre programme." },
              { label: 'Formule choisie',       desc: 'Buffet, service à table, cocktail dînatoire — chaque format a ses propres exigences en personnel et matériel.' },
              { label: 'Personnel de service',  desc: "Selon l'événement, nous mobilisons serveurs, maître d'hôtel et/ou coordinateur de salle." },
              { label: 'Lieu & accès',          desc: 'Salle privatisée, espace extérieur, domicile ou venue professionnelle — chaque lieu est étudié.' },
              { label: 'Options alimentaires',  desc: 'Menus végétariens, vegan, sans gluten ou halal peuvent être intégrés sans surcoût sur demande.' },
            ].map((item, i) => (
              <div className="pp-tl-step" key={item.label}>
                <div className="pp-tl-step__marker" aria-hidden="true">
                  <span className="pp-tl-step__num">{'0' + (i + 1)}</span>
                </div>
                <div className="pp-tl-step__body">
                  <h3 className="pp-tl-step__title">{item.label}</h3>
                  <div className="pp-tl-step__rule" aria-hidden="true" />
                  <p className="pp-tl-step__desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pp-included">
            <h3 className="pp-included__title">
              Ce qui est toujours inclus dans votre devis
            </h3>
            <div className="pp-included__grid">
              {[
                "Devis détaillé et transparent sous 48h",
                "Un interlocuteur dédié jusqu'au jour J",
                'Livraison et installation sur site',
                "Repli et nettoyage après l'événement",
                'Adaptation aux régimes alimentaires',
                'Aucun frais caché sur votre facture finale',
              ].map(item => (
                <p className="pp-included__item" key={item}>
                  <span className="pp-included__check" aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────────── */}
      <section className="pp-cta" aria-label="Appel à l'action">
        <h2 className="pp-cta__title">Prêt à organiser votre événement ?</h2>
        <p className="pp-cta__sub">
          Contactez-nous ou démarrez votre demande de devis directement en ligne.
        </p>
        <div className="pp-cta__actions">
          <Link className="pp-btn" to="/request-quote">
            Demander un devis
          </Link>
          <Link className="pp-link" to="/contact">Nous contacter</Link>
          <Link className="pp-link" to="/boissons">Voir nos boissons</Link>
        </div>
      </section>
    </div>
  );
}
