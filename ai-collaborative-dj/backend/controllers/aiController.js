const AIBridge = require('../services/aiBridge');
const RoomModel = require('../models/Room');
const musicService = require('../services/musicProviderService');

exports.analyzeSentiment = async (req, res) => {
  try {
    const { text, reactionType } = req.body;
    const result = await AIBridge.analyzeSentiment(text, reactionType);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRoomMood = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // Aggregate recent events: chat messages + reactions
    const events = [];
    (room.chatMessages || []).slice(-20).forEach(m => {
      events.push({
        event_type: 'chat',
        dominant_emotion: m.dominantEmotion,
        polarity: m.sentiment === 'positive' ? 0.8 : m.sentiment === 'negative' ? -0.8 : 0.0,
        timestamp: new Date(m.timestamp).getTime()
      });
    });

    (room.reactions || []).slice(-30).forEach(r => {
      events.push({
        event_type: 'reaction',
        reaction_type: r.reactionType || r.emoji,
        timestamp: new Date(r.timestamp).getTime()
      });
    });

    const mood = await AIBridge.calculateRoomMood(events);

    // Save back to room
    await RoomModel.findByIdAndUpdate(room._id || room.id, {
      groupMood: {
        emotions: mood.emotions,
        dominantEmotion: mood.dominant_emotion,
        collectiveEnergy: mood.collective_energy,
        collectiveValence: mood.collective_valence,
        trajectory: mood.trajectory,
        lastCalculated: new Date()
      }
    });

    res.json({ success: true, mood });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resolveConflict = async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const catalog = await musicService.getAllCatalog();
    const participants = room.participants || [];
    const recentGenres = (room.history || []).slice(-5).map(h => h.genre);

    const result = await AIBridge.resolveConflicts({
      participants,
      candidateTracks: catalog,
      recentGenres,
      currentMood: room.groupMood || {},
      djSettings: room.djSettings || {}
    });

    // Update room conflict state
    await RoomModel.findByIdAndUpdate(room._id || room.id, {
      conflictResolution: {
        explanation: result.explanation,
        topRecommendation: result.top_recommendation,
        groupGenreDistribution: result.group_genre_distribution || {},
        active: true
      }
    });

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTransition = async (req, res) => {
  try {
    const { currentTrack, nextTrack, djSettings } = req.body;
    const result = await AIBridge.calculateTransition(currentTrack, nextTrack, djSettings);
    res.json({ success: true, transition: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getNextTrack = async (req, res) => {
  try {
    const { roomId, personalityId } = req.body;
    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const catalog = await musicService.getAllCatalog();
    const result = await AIBridge.selectNextTrack({
      currentTrack: room.currentTrack || {},
      queue: room.queue || [],
      catalog,
      participants: room.participants || [],
      recentGenres: (room.history || []).slice(-5).map(h => h.genre),
      roomMood: room.groupMood || {},
      personalityId: typeof personalityId === 'string' && personalityId.trim()
        ? personalityId.trim().toLowerCase()
        : room.djSettings?.personality || 'party'
    });

    res.json({ success: true, decision: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPersonalities = async (req, res) => {
  try {
    const list = [
      {
        id: 'party',
        name: 'Party DJ',
        tagline: 'High-octane club energy & dancefloor anthems',
        avatar: '🎉',
        color: '#EC4899',
        preferred_genres: ['EDM', 'Pop', 'Dance', 'Kannada', 'Hindi'],
        target_energy: 0.85
      },
      {
        id: 'chill',
        name: 'Chill DJ',
        tagline: 'Lo-fi beats, warm acoustic melodies & study waves',
        avatar: '☕',
        color: '#06B6D4',
        preferred_genres: ['Lo-fi', 'Acoustic', 'Jazz', 'Classical'],
        target_energy: 0.35
      },
      {
        id: 'retro',
        name: 'Retro DJ',
        tagline: 'Vintage classics, golden disco & nostalgic anthems',
        avatar: '📻',
        color: '#F59E0B',
        preferred_genres: ['Rock', 'Classical', 'Pop', 'Kannada'],
        target_energy: 0.65
      },
      {
        id: 'romantic',
        name: 'Romantic DJ',
        tagline: 'Heartfelt acoustic ballads, R&B & intimate rhythms',
        avatar: '🌹',
        color: '#E11D48',
        preferred_genres: ['Pop', 'Kannada', 'Hindi', 'Classical'],
        target_energy: 0.45
      },
      {
        id: 'workout',
        name: 'Workout DJ',
        tagline: 'Hard-hitting basslines, heavy drops & peak stamina',
        avatar: '⚡',
        color: '#10B981',
        preferred_genres: ['EDM', 'Rock', 'Hip-Hop'],
        target_energy: 0.95
      },
      {
        id: 'explorer',
        name: 'Explorer DJ',
        tagline: 'Global sounds, regional fusion & hidden underground gems',
        avatar: '🧭',
        color: '#8B5CF6',
        preferred_genres: ['Kannada', 'Hindi', 'Telugu', 'Tamil', 'Jazz', 'EDM'],
        target_energy: 0.60
      }
    ];
    res.json({ success: true, personalities: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
