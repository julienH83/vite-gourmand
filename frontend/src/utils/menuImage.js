export const FALLBACK_IMG = '/images/menu-buffet-froid.png';

export function resolveMenuImage(menu) {
  const raw = (menu?.images?.[0] || menu?.image_url || '').trim();
  if (!raw) return FALLBACK_IMG;

  let url = raw.replaceAll('\\', '/');
  if (url.startsWith('http')) return url;
  if (url.startsWith('/images/')) return encodeURI(url);
  if (url.startsWith('images/')) return encodeURI('/' + url);
  if (url.startsWith('/')) return encodeURI(url);

  return encodeURI('/images/' + url);
}
