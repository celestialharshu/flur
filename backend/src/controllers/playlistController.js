import {
  getUserPlaylists, createPlaylist, deletePlaylist,
  addSongToPlaylist, removeSongFromPlaylist, getPlaylistOwner,
} from '../models/playlistModel.js';

import { getPlaylistById } from '../models/playlistModel.js';

export async function listPlaylists(req, res) {
  try {
    const playlists = await getUserPlaylists(req.user.userId);
    res.json({ playlists });
  } catch (error) {
    console.error('List playlists error:', error);
    res.status(500).json({ error: 'Failed to load playlists.' });
  }
}

export async function createUserPlaylist(req, res) {
  try {
    const { title, songId } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Playlist title is required.' });
    }

    const playlist = await createPlaylist(req.user.userId, title.trim());

    if (songId) {
      await addSongToPlaylist(playlist.id, songId);
    }

    res.status(201).json({ playlist });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Failed to create playlist.' });
  }
}

async function assertOwnership(req, res, playlistId) {
  const ownerId = await getPlaylistOwner(playlistId);
  if (ownerId === null) {
    res.status(404).json({ error: 'Playlist not found.' });
    return false;
  }
  if (ownerId !== req.user.userId) {
    res.status(403).json({ error: 'You do not own this playlist.' });
    return false;
  }
  return true;
}

export async function removeUserPlaylist(req, res) {
  try {
    const playlistId = parseInt(req.params.playlistId, 10);
    if (!(await assertOwnership(req, res, playlistId))) return;

    await deletePlaylist(req.user.userId, playlistId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Failed to delete playlist.' });
  }
}

export async function addSong(req, res) {
  try {
    const playlistId = parseInt(req.params.playlistId, 10);
    const { songId } = req.body;
    if (!(await assertOwnership(req, res, playlistId))) return;

    await addSongToPlaylist(playlistId, songId);
    res.json({ success: true });
  } catch (error) {
    console.error('Add song to playlist error:', error);
    res.status(500).json({ error: 'Failed to add song.' });
  }
}

export async function removeSong(req, res) {
  try {
    const playlistId = parseInt(req.params.playlistId, 10);
    const songId = parseInt(req.params.songId, 10);
    if (!(await assertOwnership(req, res, playlistId))) return;

    await removeSongFromPlaylist(playlistId, songId);
    res.json({ success: true });
  } catch (error) {
    console.error('Remove song from playlist error:', error);
    res.status(500).json({ error: 'Failed to remove song.' });
  }
}
export async function getPlaylistDetail(req, res) {
  try {
    const playlistId = parseInt(req.params.playlistId, 10);
    const playlist = await getPlaylistById(playlistId, req.user.userId);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found.' });
    }
    res.json({ playlist });
  } catch (error) {
    console.error('Get playlist detail error:', error);
    res.status(500).json({ error: 'Failed to load playlist.' });
  }
}