const RoomModel = require('../models/Room');
const SoundclashModel = require('../models/Soundclash');
const UserModel = require('../models/User');
const musicService = require('../services/musicProviderService');

exports.getRoomAnalytics = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const battles = await SoundclashModel.find({ roomId: room.roomId });
    const participants = room.participants || [];
    const queue = room.queue || [];
    const chatMessages = room.chatMessages || [];
    const mood = room.groupMood || {};

    // Genre distribution in queue & history
    const genreCounts = {};
    (room.history || []).forEach(h => {
      const g = h.genre || 'Other';
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
    queue.forEach(q => {
      const g = q.genre || 'Other';
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });

    // Chat sentiment breakdown
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    chatMessages.forEach(m => {
      if (m.sentiment in sentimentCounts) {
        sentimentCounts[m.sentiment]++;
      }
    });

    res.json({
      success: true,
      analytics: {
        roomId: room.roomId,
        roomName: room.name,
        participantCount: participants.length,
        totalQueueLength: queue.length,
        totalChatMessages: chatMessages.length,
        sentimentBreakdown: sentimentCounts,
        moodEmotions: mood.emotions || {},
        dominantEmotion: mood.dominantEmotion || 'happy',
        collectiveEnergy: mood.collectiveEnergy || 0.65,
        genreBreakdown: genreCounts,
        soundclashCount: battles.length,
        djPersonality: room.djSettings?.personality || 'party'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getGlobalAnalytics = async (req, res) => {
  try {
    const rooms = await RoomModel.find();
    const users = await UserModel.find();
    const battles = await SoundclashModel.find();
    const catalog = await musicService.getAllCatalog();

    let totalParticipants = 0;
    let totalMessages = 0;
    const globalGenreAffinities = {};

    rooms.forEach(r => {
      totalParticipants += (r.participants || []).length;
      totalMessages += (r.chatMessages || []).length;
    });

    users.forEach(u => {
      (u.preferredGenres || []).forEach(g => {
        globalGenreAffinities[g] = (globalGenreAffinities[g] || 0) + 1;
      });
    });

    res.json({
      success: true,
      analytics: {
        totalRooms: rooms.length,
        totalUsers: users.length,
        totalSoundclashes: battles.length,
        catalogTrackCount: catalog.length,
        totalParticipantsOnline: totalParticipants,
        totalMessagesSent: totalMessages,
        topPreferredGenres: globalGenreAffinities
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
