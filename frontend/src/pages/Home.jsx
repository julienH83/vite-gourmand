import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Seo from '../components/Seo';
import { resolveMenuImage, FALLBACK_IMG } from '../utils/menuImage';

// Hook pour animer les éléments au scroll
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          observer.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    // Fallback : si la section est déjà visible au chargement
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add('revealed');
    }
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function Home() {
  const [menus, setMenus] = useState([]);
  const whyUsRef = useScrollReveal();
  const processRef = useScrollReveal();
  const menusRef = useScrollReveal();
  const reviewsRef = useScrollReveal();

  useEffect(() => {
    api.get('/menus').then(r => r.json()).then(data => setMenus(data.slice(0, 3))).catch(() => {});
  }, []);

  const reviews = [
    { id: 1, first_name: 'Sophie',   last_name: 'M', rating: 5, comment: 'Un service irréprochable pour notre mariage. Les plats étaient raffinés et nos 120 invités ont été enchantés. Merci à toute l\'équipe !', menu_title: 'Menu Prestige' },
    { id: 2, first_name: 'Laurent',  last_name: 'D', rating: 5, comment: 'Nous avons fait appel à Vite & Gourmand pour un séminaire de 60 personnes. Ponctualité, qualité et présentation soignée. Je recommande vivement.', menu_title: 'Menu Classique' },
    { id: 3, first_name: 'Camille',  last_name: 'R', rating: 4, comment: 'Très belle prestation pour l\'anniversaire de ma mère. Le menu végétarien était délicieux et le service de livraison parfait.', menu_title: 'Menu Végétarien' },
    { id: 4, first_name: 'Thomas',   last_name: 'B', rating: 5, comment: 'Deuxième fois que nous commandons pour nos événements d\'entreprise. Toujours aussi qualitatif, avec des produits frais et locaux.', menu_title: 'Menu Terroir' },
    { id: 5, first_name: 'Isabelle', last_name: 'P', rating: 4, comment: 'Le menu de Noël était magnifique, tant visuellement qu\'au niveau des saveurs. Nos convives en parlent encore !', menu_title: 'Menu de Noël' },
    { id: 6, first_name: 'Marc',     last_name: 'L', rating: 5, comment: 'Rapport qualité-prix excellent. L\'équipe s\'est adaptée à nos contraintes de dernière minute avec beaucoup de professionnalisme.', menu_title: 'Menu Pâques' },
  ];

  return (
    <>
      <Seo
        title="Accueil"
        description="Vite & Gourmand, traiteur événementiel à Bordeaux. Menus raffinés pour mariages, séminaires, anniversaires. Livraison gratuite à Bordeaux."
        canonical="/"
      />

      {/* ── HERO ── */}
      <section className="hero hero--fullscreen" aria-label="Présentation">
        <div className="hero__particles" aria-hidden="true">
          {[...Array(20)].map((_, i) => <span key={i} className="hero__particle" />)}
        </div>
        <div className="container">
          <span className="hero__kicker">Traiteur événementiel · Bordeaux</span>
          <h1 className="hero__title-shimmer">Vite <span>&</span> Gourmand</h1>
          <p>
            Des menus raffinés, livrés chez vous pour tous vos événements :
            mariages, séminaires, anniversaires. De 6 à 500 convives.
          </p>
          <div className="hero__cta-group">
            <Link to="/menus" className="btn btn-primary">Découvrir nos menus</Link>
            <Link to="/request-quote" className="btn btn-ghost">Demander un devis</Link>
          </div>
        </div>
        <div className="hero__scroll" aria-hidden="true">
          <span className="hero__scroll-arrow">↓</span>
          <span>Découvrir</span>
        </div>
      </section>

      {/* ── ENGAGEMENTS ── */}
      <section className="whyUs scroll-reveal" ref={whyUsRef} aria-label="Nos engagements">
        <div className="whyUs__inner">
          <header className="whyUs__head">
            <span className="whyUs__kicker">Pourquoi nous choisir</span>
            <h2 className="whyUs__title">Notre savoir-faire</h2>
            <div className="whyUs__rule" aria-hidden="true" />
          </header>
          <div className="whyUs__sep" aria-hidden="true" />
          <div className="whyUs__grid">
            {[
              { title: 'Qualité premium',   desc: 'Produits frais et locaux, sélectionnés avec soin auprès de nos producteurs bordelais partenaires.' },
              { title: 'Livraison soignée', desc: 'Livraison gratuite à Bordeaux. Service complet avec matériel de réception inclus à chaque commande.' },
              { title: 'Sur-mesure',        desc: 'Menus adaptés à vos besoins : standard, végétarien, vegan. De 6 à 500 convives, nous nous adaptons.' },
            ].map((item, i) => (
              <div className="whyUs__item" key={item.title}>
                <span className="whyUs__num" aria-hidden="true">{'0' + (i + 1)}</span>
                <h3 className="whyUs__itemTitle">{item.title}</h3>
                <div className="whyUs__itemRule" aria-hidden="true" />
                <p className="whyUs__itemDesc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section className="home-process scroll-reveal" ref={processRef} aria-label="Comment ça marche">
        <div className="container">
          <p className="section-label">Simple &amp; rapide</p>
          <h2 className="section-title">Comment ça marche ?</h2>
          <div className="process-grid">
            <div className="process-step">
              <div className="process-step__number">1</div>
              <h3 className="process-step__title">Choisissez votre menu</h3>
              <p className="process-step__text">Parcourez notre catalogue de menus et sélectionnez celui qui correspond à votre événement.</p>
            </div>
            <div className="process-step">
              <div className="process-step__number">2</div>
              <h3 className="process-step__title">Demandez un devis</h3>
              <p className="process-step__text">Renseignez les détails de votre événement : date, lieu, nombre de convives et options souhaitées.</p>
            </div>
            <div className="process-step">
              <div className="process-step__number">3</div>
              <h3 className="process-step__title">Confirmez &amp; réglez</h3>
              <p className="process-step__text">Notre équipe vous transmet un devis personnalisé. Un acompte confirme votre réservation.</p>
            </div>
            <div className="process-step">
              <div className="process-step__number">4</div>
              <h3 className="process-step__title">Profitez de l'événement</h3>
              <p className="process-step__text">Nous prenons en charge la livraison, la mise en place et la logistique. Vous profitez.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MENUS POPULAIRES ── */}
      {menus.length > 0 && (
        <section className="home-menus scroll-reveal" ref={menusRef} aria-label="Menus populaires">
          <div className="container">
            <p className="section-label">Notre sélection</p>
            <h2 className="section-title">Nos menus populaires</h2>
            <div className="grid grid-3">
              {menus.map(menu => (
                <article className="card" key={menu.id}>
                  <div className="card-image">
                    <img
                      src={resolveMenuImage(menu)}
                      alt={menu.title}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                    />
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">{menu.title}</h3>
                    <p className="card-text">{String(menu.description ?? '').slice(0, 100)}...</p>
                    <div className="menu-price-row">
                      <span className="menu-price">
                        À partir de {Number(menu.min_price).toFixed(2)} €/pers.
                      </span>
                      <Link to={`/menus/${menu.id}`} className="btn btn-outline btn-small">Détail</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="text-center mt-7">
              <Link to="/menus" className="btn btn-primary">Voir tous nos menus</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── AVIS CLIENTS ── */}
      {reviews.length > 0 && (
        <section className="home-reviews scroll-reveal" ref={reviewsRef} aria-label="Avis clients">
          <div className="container">
            <p className="section-label">Ils nous font confiance</p>
            <h2 className="section-title">Ce que disent nos clients</h2>
            <div className="grid grid-3">
              {reviews.slice(0, 6).map(review => (
                <div className="review-card--luxe" key={review.id}>
                  <div className="review-header">
                    <span className="review-author">{review.first_name} {review.last_name[0]}.</span>
                    <span className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  <p className="review-text">{review.comment}</p>
                  <small className="review-menu">Menu : {review.menu_title}</small>
                  <span className="review-verified">✓ Avis vérifié</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
