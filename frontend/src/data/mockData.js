// Centralized mock data — single source of truth for Songs, Albums, Artists,
// Playlists, and Queue across all pages (Explorer, Songs, Favorites, SearchResults, App).
//
// Field names are chosen to match what our components already expect,
// but shaped so a future swap to a real API (e.g. JioSaavn-style) is a
// straightforward mapping rather than a rewrite:
//   JioSaavn "singers"    -> our "artist"
//   JioSaavn "image_url"  -> our "thumbnail"
//   JioSaavn "url"        -> our "streamUrl" (mp3 stream link)
//   JioSaavn "duration"   -> our "duration" (we store pre-formatted "m:ss" for display)

export const MOCK_SONGS = [
  { id: 1, title: 'Pinky.Intro (prod. by knuck!es)', artist: 'Lunar.spot', album: 'Reptile (EP)', duration: '2:55', durationSeconds: 175, thumbnail: 'https://placehold.co/300x300/8a3a3a/fff?text=Pinky', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Sorry Safari', artist: 'Slow Magic', album: 'DOP3TAPE', duration: '3:03', durationSeconds: 183, thumbnail: 'https://placehold.co/300x300/2a4a6a/fff?text=Sorry+Safari', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 3, title: 'Champagne Walk', artist: 'Bumble Beezy', album: 'Прилунение', duration: '3:56', durationSeconds: 236, thumbnail: 'https://placehold.co/300x300/6a5a2a/fff?text=Champagne', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 4, title: 'Mask Off', artist: 'Future', album: 'Capital', duration: '3:24', durationSeconds: 204, thumbnail: 'https://placehold.co/300x300/3a3a3a/fff?text=Mask+Off', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 5, title: 'Molly', artist: 'Nastra x Needow', album: 'Earth/Water', duration: '3:01', durationSeconds: 181, thumbnail: 'https://placehold.co/300x300/4a2a4a/fff?text=Molly', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 6, title: "SKY 'N' SKY", artist: 'i61', album: 'AT.LONG.LAST.A$AP', duration: '4:04', durationSeconds: 244, thumbnail: 'https://placehold.co/300x300/2a2a2a/fff?text=Sky', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 7, title: 'Escape (feat. Emilie Adams)', artist: 'Zeemos', album: 'Reptile (EP)', duration: '4:15', durationSeconds: 255, thumbnail: 'https://placehold.co/300x300/6a4a2a/fff?text=Escape', streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
];

export const MOCK_ALBUMS = [
  { id: 1, title: 'Reptile (EP)', artist: 'SIDxRAM', coverUrl: 'https://placehold.co/300x300/2a1a3a/fff?text=Reptile' },
  { id: 2, title: 'DOP3TAPE', artist: 'DOPECLVB', coverUrl: 'https://placehold.co/300x300/111/fff?text=DOP3TAPE' },
  { id: 3, title: 'Прилунение', artist: 'GONE.Fludd', coverUrl: 'https://placehold.co/300x300/c9c34a/000?text=Album' },
  { id: 4, title: 'Capital', artist: 'Tveth', coverUrl: 'https://placehold.co/300x300/888/000?text=Capital' },
  { id: 5, title: 'Earth/Water', artist: 'Noa', coverUrl: 'https://placehold.co/300x300/222/fff?text=Earth' },
  { id: 6, title: 'AT.LONG.LAST.A$AP', artist: 'A$AP Rocky', coverUrl: 'https://placehold.co/300x300/444/fff?text=ASAP' },
  { id: 7, title: 'Blonde', artist: 'Frank Ocean', coverUrl: 'https://placehold.co/300x300/e8d5b5/000?text=Blonde' },
  { id: 8, title: 'Currents', artist: 'Tame Impala', coverUrl: 'https://placehold.co/300x300/5a3a8a/fff?text=Currents' },
  { id: 9, title: 'IGOR', artist: 'Tyler, The Creator', coverUrl: 'https://placehold.co/300x300/6a9ac9/000?text=IGOR' },
  { id: 10, title: 'Flower Boy', artist: 'Tyler, The Creator', coverUrl: 'https://placehold.co/300x300/e89a3a/000?text=Flower' },
];

export const MOCK_ARTISTS = [
  { id: 1, name: 'Thomas Mraz', avatarUrl: 'https://placehold.co/300x300/6a3a7a/fff?text=TM' },
  { id: 2, name: 'DOPECLVB', avatarUrl: 'https://placehold.co/300x300/111/fff?text=DC' },
  { id: 3, name: 'I61', avatarUrl: 'https://placehold.co/300x300/333/fff?text=I61' },
  { id: 4, name: 'Bumble Beezy', avatarUrl: 'https://placehold.co/300x300/2a2a5a/fff?text=BB' },
  { id: 5, name: 'Sabbat Cult', avatarUrl: 'https://placehold.co/300x300/000/fff?text=SC' },
  { id: 6, name: 'Frank Ocean', avatarUrl: 'https://placehold.co/300x300/e8d5b5/000?text=FO' },
  { id: 7, name: 'Tame Impala', avatarUrl: 'https://placehold.co/300x300/5a3a8a/fff?text=TI' },
  { id: 8, name: 'Tyler, The Creator', avatarUrl: 'https://placehold.co/300x300/6a9ac9/000?text=TC' },
  { id: 9, name: 'A$AP Rocky', avatarUrl: 'https://placehold.co/300x300/444/fff?text=AR' },
  { id: 10, name: 'Slow Magic', avatarUrl: 'https://placehold.co/300x300/2a4a6a/fff?text=SM' },
];

export const MOCK_PLAYLISTS = [
  { id: 1, title: 'List main', songIds: [1, 2, 3, 4], thumbnails: ['https://placehold.co/150x150/3a2a4a/fff', 'https://placehold.co/150x150/4a3a2a/fff', 'https://placehold.co/150x150/2a4a3a/fff', 'https://placehold.co/150x150/4a2a3a/fff'] },
  { id: 2, title: 'Fav. 2', songIds: [], thumbnails: ['https://placehold.co/150x150/111/fff', 'https://placehold.co/150x150/222/fff', 'https://placehold.co/150x150/333/fff', 'https://placehold.co/150x150/444/fff'] },
  { id: 3, title: 'Summer v', songIds: [], thumbnails: ['https://placehold.co/150x150/5a8a9a/fff', 'https://placehold.co/150x150/9a5a5a/fff', 'https://placehold.co/150x150/5a9a6a/fff', 'https://placehold.co/150x150/9a9a5a/fff'] },
  { id: 4, title: 'Electronic w', songIds: [], thumbnails: ['https://placehold.co/150x150/1a1a2a/fff', 'https://placehold.co/150x150/2a1a2a/fff', 'https://placehold.co/150x150/1a2a2a/fff', 'https://placehold.co/150x150/2a2a1a/fff'] },
  { id: 5, title: 'Nightly rt', songIds: [], thumbnails: ['https://placehold.co/150x150/3a1a1a/fff', 'https://placehold.co/150x150/1a1a3a/fff', 'https://placehold.co/150x150/3a3a1a/fff', 'https://placehold.co/150x150/1a3a3a/fff'] },
];


// Queue is just a subset/ordering of MOCK_SONGS — derived, not duplicated.
export const MOCK_QUEUE = MOCK_SONGS;

export const MOCK_USER = {
  name: 'Remakerr',
  avatarUrl: 'https://placehold.co/40x40/2a5a4a/fff?text=R',
};