-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'listener', -- 'listener' or 'song_adder'
  avatar_url TEXT,
  has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- GENRES (the fixed taxonomy for onboarding + recommendations)
-- ============================================
CREATE TABLE genres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,       -- e.g. 'Bollywood', 'Pop', 'Hip-Hop'
  search_terms TEXT[] NOT NULL             -- e.g. ARRAY['bollywood hits', 'hindi songs']
);

-- ============================================
-- USER GENRE PREFERENCES (top 5 picks from onboarding, ranked)
-- ============================================
CREATE TABLE user_genre_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,                  -- 1 = top choice, 5 = fifth choice
  UNIQUE (user_id, genre_id),
  UNIQUE (user_id, rank)
);

-- ============================================
-- ARTISTS
-- ============================================
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT
);

-- ============================================
-- ALBUMS
-- ============================================
CREATE TABLE albums (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist_id INTEGER REFERENCES artists(id) ON DELETE SET NULL,
  cover_url TEXT,
  source VARCHAR(20) NOT NULL DEFAULT 'jiosaavn', -- 'jiosaavn' or 'user_uploaded'
  external_url TEXT,                       -- original JioSaavn album URL, if applicable
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- SONGS
-- ============================================
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(100),                -- JioSaavn's own song id, if sourced externally
  title VARCHAR(255) NOT NULL,
  artist_id INTEGER REFERENCES artists(id) ON DELETE SET NULL,
  album_id INTEGER REFERENCES albums(id) ON DELETE SET NULL,
  genre_id INTEGER REFERENCES genres(id) ON DELETE SET NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  stream_url TEXT,
  play_count BIGINT NOT NULL DEFAULT 0,     -- from JioSaavn, or incremented locally for uploaded songs
  source VARCHAR(20) NOT NULL DEFAULT 'jiosaavn', -- 'jiosaavn' or 'user_uploaded'
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- set only if source = 'user_uploaded'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- PLAYLISTS
-- ============================================
CREATE TABLE playlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Junction table: which songs are in which playlist, and in what order
CREATE TABLE playlist_songs (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (playlist_id, song_id)
);

-- ============================================
-- FAVORITES
-- ============================================
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  favorited_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, song_id)
);

-- ============================================
-- LISTEN HISTORY (feeds the recommendation algorithm over time)
-- ============================================
CREATE TABLE listen_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  played_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT FALSE -- true if listened to the end, false if skipped early
);

-- ============================================
-- INDEXES (for common query patterns)
-- ============================================
CREATE INDEX idx_songs_genre ON songs(genre_id);
CREATE INDEX idx_songs_album ON songs(album_id);
CREATE INDEX idx_playlist_songs_playlist ON playlist_songs(playlist_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_listen_history_user ON listen_history(user_id);
CREATE INDEX idx_user_genre_preferences_user ON user_genre_preferences(user_id);
CREATE INDEX idx_songs_external_id ON songs(external_id);
CREATE INDEX idx_songs_artist ON songs(artist_id);
CREATE INDEX idx_albums_artist_title ON albums(artist_id, title);
CREATE INDEX idx_albums_created ON albums(created_at DESC);
CREATE INDEX idx_listen_history_user_song ON listen_history(user_id, song_id, played_at DESC);
CREATE INDEX idx_playlists_user ON playlists(user_id);

CREATE TABLE user_feed_cache (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_ids INTEGER[] NOT NULL,      -- ordered array of song ids, top 50
  album_ids INTEGER[] NOT NULL,     -- ordered array of album ids, top 20
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);