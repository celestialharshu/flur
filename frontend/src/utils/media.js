// Saavn's CDN serves the same files over https, so http links can safely be upgraded.
// Any http link is blocked as "mixed content" when the app runs on an https origin.
const SAAVN = /(^|\.)saavncdn\.com$/i;

export function secureUrl(u) {
  if (typeof u !== 'string' || !u.startsWith('http://')) return u;
  try {
    const h = new URL(u).hostname;
    if (SAAVN.test(h) || window.location.protocol === 'https:') return `https://${u.slice(7)}`;
  } catch { /* bad url: leave it */ }
  return u;
}
