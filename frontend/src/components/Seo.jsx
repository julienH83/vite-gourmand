import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Vite & Gourmand';
const DEFAULT_DESC =
  'Traiteur événementiel à Bordeaux — Menus raffinés pour mariages, séminaires et anniversaires. Livraison incluse.';
const OG_IMAGE = '/images/og-image.jpg';
const SITE_URL = 'https://www.vitegourmand.fr';

/**
 * Composant SEO — injecte <title>, <meta description> et OG tags via react-helmet-async.
 * @param {string} title       Titre de la page (sans le nom du site)
 * @param {string} description Meta description spécifique (optionnelle)
 * @param {string} canonical   URL canonique (optionnelle, chemin relatif ou absolu)
 */
export default function Seo({ title, description, canonical }) {
  const fullTitle = title
    ? `${title} — ${SITE_NAME}`
    : `${SITE_NAME} — Traiteur Événementiel Bordeaux`;
  const desc = description || DEFAULT_DESC;
  const canonicalUrl = canonical
    ? canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`
    : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={`${SITE_URL}${OG_IMAGE}`} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={`${SITE_URL}${OG_IMAGE}`} />

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
}
