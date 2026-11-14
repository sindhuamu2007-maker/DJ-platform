const musicService = require('../services/musicProviderService');
const youtubeService = require('../services/youtubeService');
const RoomModel = require('../models/Room');
const AIBridge = require('../services/aiBridge');

exports.searchYouTube = async (req, res) => {
  const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
  const maxResults = Number(req.query.limit || 25);
  const pageToken = typeof req.query.pageToken === 'string' ? req.query.pageToken : undefined;
  const relevanceLanguage = typeof req.query.relevanceLanguage === 'string'
    ? req.query.relevanceLanguage.trim()
    : '';

  if (!query || query.length > 100) {
    return res.status(400).json({ success: false, message: 'Search query must be between 1 and 100 characters.' });
  }
  if (
    !Number.isInteger(maxResults) ||
    maxResults < 1 ||
    maxResults > 50 ||
    pageToken?.length > 500 ||
    (relevanceLanguage && !/^[a-z]{2}$/.test(relevanceLanguage))
  ) {
    return res.status(400).json({ success: false, message: 'Invalid YouTube search pagination parameters.' });
  }

  try {
    const result = await youtubeService.searchVideos(query, {
      pageToken,
      maxResults,
      relevanceLanguage: relevanceLanguage || undefined
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('YouTube search failed:', err.response?.status || err.status || 'unknown status');
    res.status(err.status === 503 ? 503 : 502).json({
      success: false,
      message: err.status === 503
        ? err.message
        : 'YouTube search failed. Check the API key, quota, and network connection.'
    });
  }
};

const isPlaceholderTrack = (track) =>
  track?.provider === 'demo' || /soundhelix\.com/i.test(track?.audioUrl || '');

const isYouTubeTrack = (track) =>
  track?.provider === 'youtube' && youtubeService.VIDEO_ID_PATTERN.test(String(track.youtubeVideoId || ''));

const isPlayableTrack = (track) =>
  Boolean(
    track?.title &&
    (isYouTubeTrack(track) || track.audioUrl || (track.provider === 'itunes' && /^itunes-\d+$/.test(String(track.id || track._id)))) &&
    !isPlaceholderTrack(track)
  );

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
    console.error('Music search failed:', err);
    res.status(502).json({ success: false, message: 'Music search is temporarily unavailable.' });
  }
};

exports.getCatalog = async (req, res) => {
  try {
    const tracks = await musicService.getAllCatalog();
    const status = musicService.getProviderStatus();
    res.json({ success: true, provider: status, tracks });
  } catch (err) {
    console.error('Music catalog request failed:', err);
    res.status(502).json({ success: false, message: 'Music catalog is temporarily unavailable.' });
  }
};

exports.getAppleMusicConfig = async (req, res) => {
  try {
    const config = musicService.getAppleMusicConfig();
    res.json({
      success: true,
      configured: Boolean(config.developerToken),
      developerToken: config.developerToken,
      storefront: config.storefront
    });
  } catch (err) {
    console.error('Apple Music developer token generation failed:', err);
    res.status(500).json({ success: false, message: 'Apple Music playback is misconfigured on the server.' });
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
    const { roomId, trackId, youtubeVideoId, youtubeTrack } = req.body;
    const user = req.user;

    if (typeof roomId !== 'string' || !roomId.trim()) {
      return res.status(400).json({ success: false, message: 'A room ID is required.' });
    }

    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    if (room.mode === 'solo' && String(room.host?.id) !== String(user._id || user.id)) {
      return res.status(403).json({ success: false, message: 'This personal listening room is private.' });
    }

    let track;
    if (youtubeVideoId !== undefined) {
      if (!youtubeService.VIDEO_ID_PATTERN.test(String(youtubeVideoId))) {
        return res.status(400).json({ success: false, message: 'Invalid YouTube video ID.' });
      }

      const videoId = String(youtubeVideoId);
      const title = typeof youtubeTrack?.title === 'string' ? youtubeTrack.title.trim().slice(0, 200) : '';
      if (!title) {
        return res.status(400).json({ success: false, message: 'A YouTube video title is required.' });
      }

      track = {
        id: `youtube-${videoId}`,
        youtubeVideoId: videoId,
        provider: 'youtube',
        title,
        artist: typeof youtubeTrack?.artist === 'string' ? youtubeTrack.artist.trim().slice(0, 200) : 'YouTube',
        album: 'YouTube',
        duration: 0,
        artwork: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        audioUrl: '',
        genre: typeof youtubeTrack?.genre === 'string' ? youtubeTrack.genre.trim().slice(0, 80) : 'YouTube',
        trackViewUrl: `https://www.youtube.com/watch?v=${videoId}`
      };
    } else {
      track = await musicService.getTrackById(trackId);
    }
    if (!track) {
      return res.status(404).json({ success: false, message: 'Track not found.' });
    }

    // Check duplicate in queue
    const queue = (room.queue || []).filter(isPlayableTrack);
    const trackKey = String(track.id || track._id);
    const isDuplicate =
      String(room.currentTrack?.id || room.currentTrack?._id || '') === trackKey ||
      queue.some(t => String(t.id || t._id) === trackKey);
    if (isDuplicate) {
      return res.status(400).json({ success: false, message: 'This song is already in the upcoming queue.' });
    }

    const queueItem = {
      ...track,
      addedBy: {
        id: user._id || user.id,
        username: user.username,
        displayName: user.displayName
      },
      addedAt: new Date()
    };

    queue.push(queueItem);

    // If no song is currently playing, set as currentTrack immediately
    let currentTrack = isPlayableTrack(room.currentTrack) ? room.currentTrack : null;
    if (!currentTrack) {
      currentTrack = queue.shift();
    }
    const currentTrackChanged =
      String(currentTrack?.id || currentTrack?._id || '') !==
      String(room.currentTrack?.id || room.currentTrack?._id || '');
    const playbackState = currentTrackChanged
      ? {
          ...room.playbackState,
          isPlaying: false,
          currentTime: 0,
          updatedAt: new Date()
        }
      : room.playbackState;

    const updated = await RoomModel.findByIdAndUpdate(
      room._id || room.id,
      {
        queue,
        currentTrack,
        ...(currentTrackChanged && { playbackState })
      },
      { new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`room_${room.roomId}`).emit('queue:updated', {
        queue: updated.queue,
        currentTrack: updated.currentTrack,
        playbackState: updated.playbackState
      });
    }

    res.json({
      success: true,
      queue: updated.queue,
      currentTrack: updated.currentTrack,
      playbackState: updated.playbackState
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.playQueueTrack = async (req, res) => {
  try {
    const { roomId, queueItemId } = req.body;
    const user = req.user;
    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    if (room.mode === 'solo' && String(room.host?.id) !== String(user._id || user.id)) {
      return res.status(403).json({ success: false, message: 'This personal listening room is private.' });
    }

    const queue = (room.queue || []).filter(isPlayableTrack);
    const selectedIndex = queue.findIndex(track => String(track.id || track._id) === String(queueItemId));
    if (selectedIndex === -1) {
      return res.status(404).json({ success: false, message: 'That song is no longer in the queue.' });
    }

    const [selectedTrack] = queue.splice(selectedIndex, 1);
    if (!isPlayableTrack(selectedTrack)) {
      return res.status(400).json({ success: false, message: 'This song does not have a playable audio source.' });
    }

    const currentTrack = {
      ...(selectedTrack.toObject?.() || selectedTrack),
      addedBy: selectedTrack.addedBy || {
        id: user._id || user.id,
        username: user.username,
        displayName: user.displayName
      }
    };
    const playbackState = {
      ...room.playbackState,
      isPlaying: true,
      currentTime: 0,
      updatedAt: new Date()
    };
    const updated = await RoomModel.findByIdAndUpdate(room._id || room.id, {
      currentTrack,
      queue,
      playbackState
    }, { new: true });

    const io = req.app.get('io');
    if (io) {
      io.to(`room_${room.roomId}`).emit('playback:track-changed', {
        currentTrack: updated.currentTrack,
        queue: updated.queue,
        playbackState,
        transition: null
      });
    }

    res.json({
      success: true,
      currentTrack: updated.currentTrack,
      queue: updated.queue,
      playbackState
    });
  } catch (err) {
    console.error('Play queued song failed:', err);
    res.status(500).json({ success: false, message: 'Could not play the selected queued song.' });
  }
};

exports.removeFromQueue = async (req, res) => {
  try {
    const { roomId, queueItemId } = req.body;
    const user = req.user;
    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    if (room.mode === 'solo' && String(room.host?.id) !== String(user._id || user.id)) {
      return res.status(403).json({ success: false, message: 'This personal listening room is private.' });
    }

    const queue = (room.queue || []).filter(t => String(t.id || t._id) !== String(queueItemId));
    const updated = await RoomModel.findByIdAndUpdate(room._id || room.id, { queue }, { new: true });

    const io = req.app.get('io');
    if (io) {
      io.to(`room_${room.roomId}`).emit('queue:updated', {
        queue: updated.queue,
        currentTrack: updated.currentTrack
      });
    }

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
