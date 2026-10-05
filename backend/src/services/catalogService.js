import { upsertArtists } from '../models/artistModel.js';
import { upsertAlbums, albumKey } from '../models/albumModel.js';
import { upsertSongs } from '../models/songModel.js';
import { getPrimaryArtistName } from './jiosaavnService.js';

const cut = (text, n) => String(text ?? '').slice(0, n); // column sizes in schema.sql

// Saves songs coming from JioSaavn (with their artists and albums) using a handful of
// queries for the whole list, and returns [{ song, songId, albumId }] in the same order.
// candidates: [{ externalId, title, artistName, albumTitle, durationSeconds, thumbnailUrl, streamUrl, playCount }]
export async function persistCandidates(candidates, genreId = null) {
  if (candidates.length === 0) return [];

  const rows = candidates.map((song) => ({
    song,
    artistName: cut(getPrimaryArtistName(song.artistName), 255),
    albumTitle: cut(song.albumTitle, 255),
  }));

  const artistIds = await upsertArtists(rows.map((r) => r.artistName));

  const albumIds = await upsertAlbums(
    rows
      .filter((r) => r.albumTitle)
      .map((r) => ({
        title: r.albumTitle,
        artistId: artistIds.get(r.artistName),
        coverUrl: r.song.thumbnailUrl,
      }))
  );

  const withAlbum = rows.map((r) => ({
    ...r,
    artistId: artistIds.get(r.artistName),
    albumId: r.albumTitle ? albumIds.get(albumKey(r.albumTitle, artistIds.get(r.artistName))) ?? null : null,
  }));

  const songIds = await upsertSongs(
    withAlbum.map((r) => ({
      externalId: cut(r.song.externalId, 100),
      title: cut(r.song.title, 255),
      artistId: r.artistId,
      albumId: r.albumId,
      genreId,
      durationSeconds: r.song.durationSeconds,
      thumbnailUrl: r.song.thumbnailUrl,
      streamUrl: r.song.streamUrl,
      playCount: r.song.playCount,
    }))
  );

  return withAlbum.map((r) => ({
    song: r.song,
    songId: songIds.get(cut(r.song.externalId, 100)) ?? null,
    albumId: r.albumId,
  }));
}
