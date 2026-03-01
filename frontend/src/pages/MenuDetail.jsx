import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Seo from '../components/Seo';
import { resolveMenuImage, FALLBACK_IMG } from '../utils/menuImage';
import '../styles/menudetail-premium.css';

export default function MenuDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openCourses, setOpenCourses] = useState({});

  useEffect(() => {
    api
      .get(`/menus/${id}`)
      .then((r) => r.json())
      .then(setMenu)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const toggleCourse = (type) => {
    setOpenCourses((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  if (loading) return <div className="mx-loading" role="status">Chargement...</div>;
  if (!menu)
    return (
      <div className="mx mx-error">
        <div className="mx-error__title">Menu non trouve.</div>
        <p>Ce menu n'existe pas ou a ete retire.</p>
        <Link to="/menus" className="mx-error__link">Retour aux menus</Link>
      </div>
    );

  const heroImage = resolveMenuImage(menu);

  const dishTypes = { entree: 'Entrees', plat: 'Plats', dessert: 'Desserts' };
  const groupedDishes = {};
  (menu.dishes || []).forEach((d) => {
    if (!groupedDishes[d.type]) groupedDishes[d.type] = [];
    groupedDishes[d.type].push(d);
  });

  const handleOrder = () => {
    if (!user) navigate(`/login?redirect=/order/${menu.id}`);
    else navigate(`/order/${menu.id}`);
  };

  const hasRating = Number(menu.avg_rating) > 0;
  const ratingRounded = Math.round(Number(menu.avg_rating || 0));
  const isOut = Number(menu.stock) <= 0;
  const stockLow = Number(menu.stock) > 0 && Number(menu.stock) <= 5;

  return (
    <div className="mx">
      <Seo
        title={menu?.title || 'Menu'}
        description={menu ? `${menu.title} — ${String(menu.description || '').slice(0, 130)}` : undefined}
        canonical={`/menus/${menu?.id}`}
      />

      {/* ── HERO ─────────────────────────────────────────── */}
      <header className="mx-hero" aria-label="Detail du menu">
        <img
          className="mx-hero__bg"
          src={heroImage}
          alt={menu?.title || 'Menu'}
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
        />
        <div className="mx-hero__scrim" />

        <div className="mx-hero__inner">
          <Link to="/menus" className="mx-hero__back">
            &larr; Retour aux menus
          </Link>

          <div className="mx-hero__meta">
            <span>{String(menu.theme || '').toUpperCase()}</span>
            <span className="mx-hero__metaDot">&middot;</span>
            <span>{String(menu.diet || '').toUpperCase()}</span>
            <span className="mx-hero__metaDot">&middot;</span>
            <span>MIN {menu.min_persons} PERS</span>
          </div>

          <h1 className="mx-hero__title">{menu.title}</h1>

          {menu.description && (
            <p className="mx-hero__desc">{menu.description}</p>
          )}

          {hasRating && (
            <div className="mx-hero__rating" aria-label="Note du menu">
              <span className="mx-hero__stars" aria-hidden="true">
                {'★'.repeat(ratingRounded)}
                {'☆'.repeat(5 - ratingRounded)}
              </span>
              <span className="mx-hero__ratingText">
                {Number(menu.avg_rating).toFixed(1)} — {menu.review_count} avis
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── BODY: 2 colonnes ─────────────────────────────── */}
      <div className="mx-body">
        {/* ── Main (left) ──────────────────────────────── */}
        <div className="mx-main">
          {/* Composition */}
          <section className="mx-section" aria-label="Composition du menu">
            <div className="mx-section__header">
              <h2 className="mx-section__title">Composition du menu</h2>
              <div className="mx-section__divider" />
            </div>

            {Object.entries(dishTypes).map(([type, label]) =>
              groupedDishes[type]?.length ? (
                <div key={type} className="mx-course">
                  <div
                    className="mx-course__header"
                    onClick={() => toggleCourse(type)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleCourse(type)}
                    aria-expanded={openCourses[type] !== false}
                  >
                    <h3 className="mx-course__label">
                      {label.toUpperCase()}
                      {groupedDishes[type].length > 1 && (
                        <span className="mx-course__choiceTag"> (au choix)</span>
                      )}
                    </h3>
                    <div className="mx-course__line" />
                    <button
                      type="button"
                      className={`mx-course__toggle${openCourses[type] === false ? '' : ' mx-course__toggle--open'}`}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      &#9662;
                    </button>
                  </div>

                  <ul className={`mx-dishes${openCourses[type] === false ? ' mx-dishes--collapsed' : ''}`}>
                    {groupedDishes[type].map((dish) => (
                      <li key={dish.id} className="mx-dish">
                        <div className="mx-dish__name">{dish.name}</div>
                        {dish.description && (
                          <div className="mx-dish__desc">{dish.description}</div>
                        )}
                        {dish.allergens && dish.allergens.length > 0 && (
                          <div className="mx-dish__allergens">
                            {dish.allergens.map((a) => (
                              <span key={a} className="mx-allergen">{a}</span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}

            <p className="mx-reassurance">
              Les choix precis sont finalises lors du devis ou de l'echange avec notre equipe.
            </p>
          </section>

          {/* Avis clients */}
          <section className="mx-section" aria-label="Avis clients">
            <div className="mx-section__header">
              <h2 className="mx-section__title">Avis clients</h2>
              <div className="mx-section__divider" />
            </div>

            {menu.reviews && menu.reviews.length > 0 ? (
              <div className="mx-reviews">
                {menu.reviews.map((review) => (
                  <article className="mx-review" key={review.id}>
                    <div className="mx-review__top">
                      <div className="mx-review__author">
                        {review.first_name} {review.last_name?.[0] ? `${review.last_name[0]}.` : ''}
                      </div>
                      <div className="mx-review__stars" aria-hidden="true">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mx-review__text">{review.comment}</p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="mx-reviews-empty">
                <span className="mx-reviews-empty__icon" aria-hidden="true">&#9734;</span>
                Aucun avis pour le moment. Soyez le premier a partager votre experience !
              </div>
            )}
          </section>
        </div>

        {/* ── Sidebar (right) ──────────────────────────── */}
        <aside className="mx-sidebar">
          <div className="mx-sidebar__card">
            {/* Prix */}
            <div className="mx-sidebar__priceBlock" aria-label="Prix">
              <div className="mx-sidebar__price">
                {Number(menu.min_price).toFixed(2)} &euro;
              </div>
              <div className="mx-sidebar__per">par personne</div>
            </div>

            {/* Meta infos */}
            <ul className="mx-sidebar__infos">
              <li className="mx-sidebar__info">
                <span className="mx-sidebar__infoIcon" aria-hidden="true">&#9834;</span>
                Theme : {menu.theme || '—'}
              </li>
              <li className="mx-sidebar__info">
                <span className="mx-sidebar__infoIcon" aria-hidden="true">&#9826;</span>
                Regime : {menu.diet || '—'}
              </li>
              <li className="mx-sidebar__info">
                <span className="mx-sidebar__infoIcon" aria-hidden="true">&#9823;</span>
                Minimum {menu.min_persons} personnes
              </li>
            </ul>

            {/* CTA */}
            <button
              onClick={handleOrder}
              className="mx-sidebar__cta"
              disabled={isOut}
            >
              {isOut ? 'Indisponible' : 'RESERVER CE MENU'}
            </button>

            <Link to="/request-quote" className="mx-sidebar__quote">
              Demander un devis
            </Link>

            {/* Conditions */}
            {menu.conditions && (
              <div className="mx-sidebar__conditions" role="region" aria-label="Conditions">
                <div className="mx-sidebar__condTitle">
                  <span aria-hidden="true">&#9888;</span> Conditions
                </div>
                <p className="mx-sidebar__condText">{menu.conditions}</p>
              </div>
            )}

            {/* Stock */}
            {!isOut && (
              <div className={`mx-sidebar__stock${stockLow ? ' mx-sidebar__stock--low' : ''}`}>
                {stockLow
                  ? `Plus que ${menu.stock} disponible${Number(menu.stock) > 1 ? 's' : ''}`
                  : `${menu.stock} disponible${Number(menu.stock) > 1 ? 's' : ''}`}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
