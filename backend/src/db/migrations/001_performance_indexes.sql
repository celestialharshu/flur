-- Speeds up the queries the API runs most. Safe to run more than once.
-- Run it once on your existing database:  psql "$DATABASE_URL" -f src/db/migrations/001_performance_indexes.sql

-- every saved song is looked up by JioSaavn id (was a full table scan each time)
CREATE INDEX IF NOT EXISTS idx_songs_external_id ON songs(external_id);
-- artist pages, and the artist-photo fallback inside every artist list
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist_id);
-- album lookups while saving songs, artist pages
CREATE INDEX IF NOT EXISTS idx_albums_artist_title ON albums(artist_id, title);
-- the albums list is paged newest-first
CREATE INDEX IF NOT EXISTS idx_albums_created ON albums(created_at DESC);
-- "recently played" and the 10-second duplicate check
CREATE INDEX IF NOT EXISTS idx_listen_history_user_song ON listen_history(user_id, song_id, played_at DESC);
-- the user's playlists
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
