import pool from '../config/db.js';
import { ARTIST_SELECT } from './artistModel.js';

const escapeLike = (t) => t.replace(/[\\%_]/g, '\\$&');

// Builds "(col1 ILIKE $n OR col2 ILIKE $n) AND (...)" — every token must
// appear in at least one of the columns.
function tokenClauses(tokens, columns, startIndex = 1) {
  const params = [];
  const clauses = tokens.map((t, i) => {
    params.push(`%${escapeLike(t)}%`);
    const idx = startIndex + i;
    return `(${columns.map((c) => `${c} ILIKE $${idx}`).join(' OR ')})`;
  });
  return { where: clauses.join(' AND '), params };
}

export async function searchSongsDb(tokens, limit = 60) {
  const { where, params } = tokenClauses(tokens, ['s.title', 'a.name', 'al.title']);
  const result = await pool.query(
    `SELECT s.*, a.name AS artist_name, al.title AS album_title
     FROM songs s
     LEFT JOIN artists a ON a.id = s.artist_id
     LEFT JOIN albums al ON al.id = s.album_id
     WHERE s.stream_url IS NOT NULL AND ${where}
     ORDER BY s.play_count DESC
     LIMIT ${limit}`,
    params
  );
  return result.rows;
}

export async function searchAlbumsDb(tokens, limit = 30) {
  const { where, params } = tokenClauses(tokens, ['al.title', 'a.name']);
  const result = await pool.query(
    `SELECT al.*, a.name AS artist_name
     FROM albums al
     LEFT JOIN artists a ON a.id = al.artist_id
     WHERE ${where}
     LIMIT ${limit}`,
    params
  );
  return result.rows;
}

export async function searchArtistsDb(tokens, limit = 20) {
  const { where, params } = tokenClauses(tokens, ['a.name']);
  const result = await pool.query(
    `SELECT ${ARTIST_SELECT} FROM artists a WHERE ${where} LIMIT ${limit}`,
    params
  );
  return result.rows;
}

export async function getAlbumsByIds(ids) {
  if (ids.length === 0) return [];
  const result = await pool.query(
    `SELECT al.*, a.name AS artist_name
     FROM albums al LEFT JOIN artists a ON a.id = al.artist_id
     WHERE al.id = ANY($1)`,
    [ids]
  );
  return result.rows;
}

export async function getArtistsByIds(ids) {
  if (ids.length === 0) return [];
  const result = await pool.query(
    `SELECT ${ARTIST_SELECT} FROM artists a WHERE a.id = ANY($1)`,
    [ids]
  );
  return result.rows;
}
