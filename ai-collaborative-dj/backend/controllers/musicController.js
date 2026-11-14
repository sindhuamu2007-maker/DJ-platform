const musicService = require('../services/musicProviderService');
const youtubeService = require('../services/youtubeService');
const RoomModel = require('../models/Room');
const AIBridge = require('../services/aiBridge');

exports.searchYouTube = async (req, res) => {
  const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
  if (!query || query.length > 100) {
    return res.status(400).json({ success: false, message: 'Search query must be between 1 and 100 characters.' });
  }
  const maxResults = Number(req.query.limit || 25);
  const pageToken = typeof req.query.pageToken === 'string' ? req.query.pageToken : undefined;
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 50 || pageToken?.length > 500) {
    return res.status(400).json({ success: false, message: 'Invalid YouTube search pagination parameters.' });
  }

  try {
    const { videos, nextPageToken } = await youtubeService.searchVideos(query, { pageToken, maxResults });
    res.json({ success: true, videos, nextPageToken });
  } catch (err) {
    console.error('YouTube search failed:', err.response?.data?.error?.message || err.message);
    res.status(err.status || 502).json({
      success: false,
      message: err.status === 503
        ? err.message
        : 'YouTube full-track search failed. Check the API key, quota, and network connection.'
    });
  }
};

exports.search = async (req, res) => {
  try {
    const { query, genre, language, limit } = req.query;
    const tracks = await musicService.searchTracks({
      query,
      genre,
      language,
      limit: limit ? parseInt(limit) : 20
    });
    res.json({ success: true, count: tracks.length, tracks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCatalog = async (req, res) => {
  try {
    const tracks = await musicService.getAllCatalog();
    const status = musicService.getProviderStatus();
    res.json({ success: true, provider: status, tracks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const user = req.user || {};
    const { roomId } = req.query;
    const catalog = await musicService.getAllCatalog();

    let room = null;
    if (roomId) {
      room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    }

    const recommendations = await AIBridge.getHybridRecommendations({
      user,
      catalog,
      participants: room ? room.participants : [user],
      roomMood: room ? room.groupMood : null,
      listeningHistory: user.listeningHistory ? user.listeningHistory.map(h => h.trackId) : [],
      personalityId: room?.djSettings?.personality || 'party'
    });

    res.json({ success: true, recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToQueue = async (req, res) => {
  try {
    const { roomId, trackId, youtubeVideoId, track: requestedTrack } = req.body;
    const user = req.user;

    if (youtubeVideoId && !youtubeService.VIDEO_ID_PATTERN.test(youtubeVideoId)) {
      return res.status(400).json({ success: false, message: 'Invalid YouTube video ID.' });
    }

    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    let track = trackId ? await musicService.getTrackById(trackId) : null;
    if (!track && youtubeVideoId && requestedTrack) {
      const title = typeof requestedTrack.title === 'string' ? requestedTrack.title.trim().slice(0, 200) : '';
      const artist = typeof requestedTrack.artist === 'string' ? requestedTrack.artist.trim().slice(0, 200) : '';
      const genre = typeof requestedTrack.genre === 'string' ? requestedTrack.genre.trim().slice(0, 40) : 'Music';
      const requestedEnergy = Number(requestedTrack.energy);
      if (!title || !artist) {
        return res.status(400).json({ success: false, message: 'YouTube tracks must include a title and artist.' });
      }

      track = {
        id: `youtube-${youtubeVideoId}`,
        title,
        artist,
        album: 'YouTube',
        duration: 180,
        artwork: `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`,
        audioUrl: '',
        youtubeVideoId,
        genre: genre || 'Music',
        language: 'English',
        bpm: 120,
        key: '8B',
        energy: Number.isFinite(requestedEnergy) ? Math.min(1, Math.max(0, requestedEnergy)) : 0.7,
        danceability: 0.7,
        valence: 0.6,
        popularity: 70
      };
    }
    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found.' });
    }

    // Check duplicate in queue
    const queue = room.queue || [];
    const isDuplicate = queue.some(t => String(t.id || t._id) === String(track.id || track._id));
    if (isDuplicate) {
      return res.status(400).json({ success: false, message: 'This song is already in the upcoming queue.' });
    }

    const queueItem = {
      ...(typeof track.toObject === 'function' ? track.toObject() : track),
      ...(youtubeVideoId ? { youtubeVideoId } : {}),
      addedBy: {
        id: user._id || user.id,
        username: user.username,
        displayName: user.displayName
      },
      addedAt: new Date()
    };

    queue.push(queueItem);

    // If no song is currently playing, set as currentTrack immediately
    let currentTrack = room.currentTrack;
    if (!currentTrack) {
      currentTrack = queue.shift();
    }

    const updated = await RoomModel.findByIdAndUpdate(
      room._id || room.id,
      { queue, currentTrack },
      { new: true }
    );

    res.json({ success: true, queue: updated.queue, currentTrack: updated.currentTrack });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeFromQueue = async (req, res) => {
  try {
    const { roomId, queueItemId } = req.body;
    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const queue = (room.queue || []).filter(t => String(t.id || t._id) !== String(queueItemId));
    const updated = await RoomModel.findByIdAndUpdate(room._id || room.id, { queue }, { new: true });
    
    res.json({ success: true, queue: updated.queue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reorderQueue = async (req, res) => {
  try {
    const { roomId, newQueue } = req.body;
    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const updated = await RoomModel.findByIdAndUpdate(room._id || room.id, { queue: newQueue }, { new: true });
    res.json({ success: true, queue: updated.queue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
