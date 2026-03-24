import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Seo from '../components/Seo';
import { resolveMenuImage, FALLBACK_IMG } from '../utils/menuImage';

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    api.get('/reviews').then(r => r.json()).then(setReviews).catch(() => {});
    api.get('/menus').then(r => r.json()).then(data => setMenus(data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <>
      <Seo
        title="Accueil"
        description="Vite & Gourmand, traiteur événementiel à Bordeaux. Menus raffinés pour mariages, séminaires, anniversaires. Livraison gratuite à Bordeaux."
        canonical="/"
      />

      {/* ── HERO ── */}
      <section className="hero hero--fullscreen" aria-label="Présentation">
        <div className="container">
          <span className="hero__kicker">Traiteur événementiel · Bordeaux</span>
          <h1>Vite <span>&</span> Gourmand</h1>
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
      <section className="whyUs" aria-label="Nos engagements">
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
      <section className="home-process" aria-label="Comment ça marche">
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
        <section className="home-menus" aria-label="Menus populaires">
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
        <section className="home-reviews" aria-label="Avis clients">
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
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
