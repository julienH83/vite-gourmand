import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Seo from '../components/Seo';
import { SkeletonCard } from '../components/Skeleton';
import '../styles/menus-premium.css';

export default function Menus() {
  const [menus, setMenus] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({
    themes: [],
    diets: [],
    priceRange: {},
  });
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recommended');

  // Image principale : galerie API > image_url > fallback
  const getMenuImage = (menu) => {
    if (menu?.images?.length) return menu.images[0];
    if (menu?.image_url) return menu.image_url;
    return '/images/menu-buffet-froid.png';
  };

  // Helpers
  const setParamIfFilled = (params, key, value) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  };

  const handleFilter = (key, value) => {
    const v = value === '' ? undefined : value;
    setFilters((prev) => {
      const next = { ...prev, [key]: v };
      if (v === undefined) delete next[key];
      return next;
    });
  };

  const clearFilters = () => setFilters({});

  useEffect(() => {
    let ignore = false;

    api.get('/menus/filters')
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) setFilterOptions(data);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    setLoading(true);

    const params = new URLSearchParams();
    setParamIfFilled(params, 'theme', filters.theme);
    setParamIfFilled(params, 'diet', filters.diet);
    setParamIfFilled(params, 'price_min', filters.price_min);
    setParamIfFilled(params, 'price_max', filters.price_max);
    setParamIfFilled(params, 'min_persons', filters.min_persons);

    const qs = params.toString();
    const url = qs ? `/menus?${qs}` : '/menus';

    api.get(url)
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) setMenus(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!ignore) setMenus([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [filters]);

  const sortedMenus = useMemo(() => {
    const arr = Array.isArray(menus) ? [...menus] : [];

    arr.sort((a, b) => {
      const ap = Number(a?.min_price ?? 0);
      const bp = Number(b?.min_price ?? 0);
      const ar = Number(a?.avg_rating ?? 0);
      const br = Number(b?.avg_rating ?? 0);

      switch (sort) {
        case 'price_asc':
          return ap - bp;
        case 'price_desc':
          return bp - ap;
        case 'rating_desc':
          return br - ar;
        default:
          return 0;
      }
    });

    return arr;
  }, [menus, sort]);

  /* ── Pagination ───────────────────────────────────── */
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sortedMenus.length / ITEMS_PER_PAGE));
  const paginatedMenus = sortedMenus.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when filters or sort change
  useEffect(() => { setCurrentPage(1); }, [filters, sort]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeCount = Object.keys(filters).length;

  return (
    <div className="mn">
      <Seo
        title="Nos Menus"
        description="Découvrez tous nos menus traiteur à Bordeaux : buffets, cocktails, mariages, événements végétaliens. Filtrez par thème, régime ou prix."
        canonical="/menus"
      />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="mn-hero" aria-labelledby="mn-h1">
        <div className="mn-hero__inner">
          <span className="mn-hero__kicker">Vite &amp; Gourmand</span>
          <h1 id="mn-h1" className="mn-hero__title">Nos Menus</h1>
          <p className="mn-hero__sub">
            Découvrez nos formules traiteur et composez votre événement.
          </p>
          <div className="mn-hero__rule" aria-hidden="true" />
          <p className="mn-hero__note">
            Devis sous 48h · Options sur mesure · Allergènes maîtrisés
          </p>
        </div>
      </section>

      {/* ── FILTER BAR ───────────────────────────────────────────── */}
      <div className="mn-filterbar" role="search" aria-label="Filtrer les menus">
        <div className="mn-filterbar__inner">
          {/* Mobile toggle */}
          <button
            className="mn-filterbar__toggle"
            type="button"
            onClick={() => setFiltersOpen(o => !o)}
            aria-expanded={filtersOpen}
          >
            Filtres{activeCount > 0 && ` (${activeCount})`}
            <span className={`mn-filterbar__chevron${filtersOpen ? ' mn-filterbar__chevron--open' : ''}`} aria-hidden="true" />
          </button>

          <div className={`mn-filterbar__fields${filtersOpen ? ' mn-filterbar__fields--open' : ''}`}>
            <div className="mn-field">
              <label htmlFor="filter-theme">Thème</label>
              <select
                id="filter-theme"
                value={filters.theme ?? ''}
                onChange={(e) => handleFilter('theme', e.target.value)}
              >
                <option value="">Tous les thèmes</option>
                {filterOptions.themes.map((t) => (
                  <option key={t} value={t}>
                    {t ? t.charAt(0).toUpperCase() + t.slice(1) : t}
                  </option>
                ))}
              </select>
            </div>

            <div className="mn-field">
              <label htmlFor="filter-diet">Régime</label>
              <select
                id="filter-diet"
                value={filters.diet ?? ''}
                onChange={(e) => handleFilter('diet', e.target.value)}
              >
                <option value="">Tous les régimes</option>
                {filterOptions.diets.map((d) => (
                  <option key={d} value={d}>
                    {d ? d.charAt(0).toUpperCase() + d.slice(1) : d}
                  </option>
                ))}
              </select>
            </div>

            <div className="mn-field">
              <label htmlFor="filter-persons">Nb personnes</label>
              <input
                id="filter-persons"
                type="number"
                min="1"
                placeholder="Min pers."
                value={filters.min_persons ?? ''}
                onChange={(e) => handleFilter('min_persons', e.target.value)}
              />
            </div>

            <div className="mn-field">
              <label htmlFor="filter-price-min">Prix min (€/pers.)</label>
              <input
                id="filter-price-min"
                type="number"
                min="0"
                step="5"
                placeholder="Min"
                value={filters.price_min ?? ''}
                onChange={(e) => handleFilter('price_min', e.target.value)}
              />
            </div>

            <div className="mn-field">
              <label htmlFor="filter-price-max">Prix max (€/pers.)</label>
              <input
                id="filter-price-max"
                type="number"
                min="0"
                step="5"
                placeholder="Max"
                value={filters.price_max ?? ''}
                onChange={(e) => handleFilter('price_max', e.target.value)}
              />
            </div>

            <div className="mn-field mn-field--actions">
              <button className="mn-reset" onClick={clearFilters} type="button">
                Effacer filtres
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── RESULTS ──────────────────────────────────────────────── */}
      <section className="mn-results" aria-label="Résultats">
        <div className="mn-results__inner">
          <div className="mn-toolbar">
            <div>
              <div className="mn-toolbar__count">
                {loading ? 'Chargement…' : (
                  <><strong>{sortedMenus.length}</strong> menu{sortedMenus.length > 1 ? 's' : ''} disponible{sortedMenus.length > 1 ? 's' : ''}</>
                )}
              </div>
              <div className="mn-toolbar__hint">
                Prix affichés par personne · minimum indiqué sur la fiche
              </div>
            </div>
            <div className="mn-toolbar__sort">
              <label className="mn-toolbar__label" htmlFor="sort-menus">Trier</label>
              <select id="sort-menus" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recommended">Recommandé</option>
                <option value="rating_desc">Meilleure note</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>
          </div>

          {loading ? (
            <SkeletonCard count={6} />
          ) : sortedMenus.length === 0 ? (
            <div className="mn-empty" role="status">
              Aucun menu ne correspond à vos critères.
            </div>
          ) : (
            <div className="mn-grid" role="list" aria-label="Liste des menus">
              {paginatedMenus.map((menu) => {
                const title = menu?.title ?? 'Menu';
                const desc = menu?.description ?? '';
                const rating = Number(menu?.avg_rating ?? 0);
                const reviews = Number(menu?.review_count ?? 0);
                const minPrice = Number(menu?.min_price ?? 0);
                const minPersons = Number(menu?.min_persons ?? 0);
                const diet = String(menu?.diet ?? '').toLowerCase();

                return (
                  <article className="mn-card" key={menu.id ?? `${title}-${minPrice}`} role="listitem">
                    {/* Image + badge thème */}
                    <div className="mn-card__img">
                      <img
                        src={getMenuImage(menu)}
                        alt={title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/images/menu-buffet-froid.png';
                        }}
                      />
                      {menu?.theme && (
                        <span className="mn-card__badge">{menu.theme}</span>
                      )}
                    </div>

                    {/* Corps */}
                    <div className="mn-card__body">
                      <h2 className="mn-card__title">{title}</h2>

                      <p className="mn-card__desc">{desc}</p>

                      {/* Infos : prix + personnes + régime */}
                      <div className="mn-card__info">
                        <span className="mn-card__price">
                          {minPrice.toFixed(2)} €<small> / pers.</small>
                        </span>
                        <span className="mn-card__meta">
                          Min. {minPersons} pers.
                        </span>
                        {diet !== 'standard' && (
                          <span className="mn-tag">{menu.diet}</span>
                        )}
                      </div>

                      <div className="mn-card__rating">
                        <span className="stars" aria-label={`Note ${rating.toFixed(1)} sur 5`}>
                          {'★'.repeat(Math.round(rating))}
                          {'☆'.repeat(5 - Math.round(rating))}
                        </span>
                        <small className="mn-card__reviews">{rating.toFixed(1)} ({reviews} avis)</small>
                      </div>

                      {/* CTA */}
                      <div className="mn-card__footer">
                        <Link to={`/menus/${menu.id}`} className="mn-card__cta">
                          Voir le menu
                        </Link>
                        <Link to="/request-quote" className="mn-card__cta mn-card__cta--secondary">
                          Devis
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ── PAGINATION ──────────────────────────────────────── */}
          {!loading && totalPages > 1 && (
            <nav className="mn-pagination" aria-label="Pagination des menus">
              <button
                className="mn-pagination__btn"
                disabled={currentPage === 1}
                onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                aria-label="Page précédente"
              >
                &laquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`mn-pagination__btn${page === currentPage ? ' mn-pagination__btn--active' : ''}`}
                  onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  aria-current={page === currentPage ? 'page' : undefined}
                  aria-label={`Page ${page}`}
                >
                  {page}
                </button>
              ))}
              <button
                className="mn-pagination__btn"
                disabled={currentPage === totalPages}
                onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                aria-label="Page suivante"
              >
                &raquo;
              </button>
            </nav>
          )}
        </div>
      </section>
    </div>
  );
}
