import { Router } from 'express';
import {
  listPlaylists, createUserPlaylist, removeUserPlaylist, addSong, removeSong, getPlaylistDetail,
} from '../controllers/playlistController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, listPlaylists);
router.post('/', requireAuth, createUserPlaylist);
router.delete('/:playlistId', requireAuth, removeUserPlaylist);
router.post('/:playlistId/songs', requireAuth, addSong);
router.delete('/:playlistId/songs/:songId', requireAuth, removeSong);
router.get('/:playlistId', requireAuth, getPlaylistDetail);

export default router;