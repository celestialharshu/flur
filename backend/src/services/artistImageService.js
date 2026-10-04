import axios from 'axios';

// Deezer's public API: free, no key. Returns real artist photos.
const DEEZER = 'https://api.deezer.com/search/artist';

function normalize(name = '') {
  return name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// Deezer returns a placeholder URL (empty hash) when it has no photo
function isRealPicture(url) {
  return Boolean(url) && !url.includes('/artist//');
}

export async function fetchArtistImage(name) {
  try {
    const { data } = await axios.get(DEEZER, {
      params: { q: name, limit: 5 },
      timeout: 5000,
    });
    const results = Array.isArray(data?.data) ? data.data : [];
    const target = normalize(name);

    const pick =
      results.find((r) => normalize(r.name) === target && isRealPicture(r.picture_xl)) ||
      // looser match, but only trust well-known artists to avoid wrong photos
      results.find((r) => {
        const n = normalize(r.name);
        return (n.includes(target) || target.includes(n)) && (r.nb_fan || 0) >= 1000 && isRealPicture(r.picture_xl);
      });

    return pick ? pick.picture_xl : null;
  } catch {
    return null;
  }
}
