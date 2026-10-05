-- OPTIONAL. Saavn's CDN serves the same files over https. Links saved as http://
-- are blocked as "mixed content" when the app runs on an https origin.
-- The app already upgrades them on the fly; this just cleans up the stored data.
UPDATE songs   SET stream_url    = 'https://' || substr(stream_url, 8)    WHERE stream_url    ~* '^http://[^/]*saavncdn\.com/';
UPDATE songs   SET thumbnail_url = 'https://' || substr(thumbnail_url, 8) WHERE thumbnail_url ~* '^http://[^/]*saavncdn\.com/';
UPDATE albums  SET cover_url     = 'https://' || substr(cover_url, 8)     WHERE cover_url     ~* '^http://[^/]*saavncdn\.com/';
UPDATE artists SET avatar_url    = 'https://' || substr(avatar_url, 8)    WHERE avatar_url    ~* '^http://[^/]*saavncdn\.com/';
