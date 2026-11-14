const RoomModel = require('../models/Room');
const { v4: uuidv4 } = require('uuid');

const isPlaceholderTrack = (track) =>
  track?.provider === 'demo' || /soundhelix\.com/i.test(track?.audioUrl || '');

const isPlayableTrack = (track) =>
  Boolean(
    track?.title &&
    (track.audioUrl || (track.provider === 'itunes' && /^itunes-\d+$/.test(String(track.id || track._id)))) &&
    !isPlaceholderTrack(track)
  );

const removePlaceholderTracks = async (room) => {
  const currentTrack = isPlayableTrack(room.currentTrack) ? room.currentTrack : null;
  const queue = (room.queue || []).filter(isPlayableTrack);
  const currentWasRemoved = currentTrack !== room.currentTrack;
  const queueWasCleaned = queue.length !== (room.queue || []).length;

  if (!currentWasRemoved && !queueWasCleaned) return room;

  return RoomModel.findByIdAndUpdate(room._id || room.id, {
    currentTrack,
    queue,
    ...(currentWasRemoved && {
      playbackState: {
        ...room.playbackState,
        isPlaying: false,
        currentTime: 0
      }
    })
  }, { new: true });
};

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DJ-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

exports.createRoom = async (req, res) => {
  try {
    const { name, description, personality, djSettings } = req.body;
    const mode = req.body.mode === 'solo' ? 'solo' : 'group';
    const user = req.user;

    const roomId = generateRoomCode();
    const newRoom = await RoomModel.create({
      roomId,
      name: name || `${user.displayName}'s Sonic Lounge`,
      mode,
      description: description || 'High-energy AI-curated group listening session',
      host: {
        id: user._id || user.id,
        username: user.username,
        displayName: user.displayName
      },
      participants: [{
        id: user._id || user.id,
        username: user.username,
        displayName: user.displayName,
        profilePic: user.profilePic,
        preferredGenres: user.preferredGenres || ['EDM', 'Pop']
      }],
      currentTrack: null,
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        updatedAt: new Date(),
        deckA: null,
        deckB: null,
        crossfadePosition: 0
      },
      queue: [],
      chatMessages: [{
        id: uuidv4(),
        sender: {
          id: 'ai-dj-bot',
          username: 'AI DJ',
          displayName: 'AI Resident DJ',
          profilePic: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80'
        },
        text: `Welcome to ${name || 'the room'}! I am your AI DJ. Drop your favorite tracks, react to the beat, or challenge the room in Soundclash! 🎧🔥`,
        sentiment: 'positive',
        dominantEmotion: 'excited',
        timestamp: new Date()
      }],
      djSettings: {
        enabled: true,
        personality: personality || 'party',
        autoTransition: true,
        transitionDuration: 6,
        energyPreference: 0.8,
        autoQueueFromMood: true,
        allowGuestAdd: true,
        ...(djSettings || {})
      }
    });

    res.status(201).json({ success: true, room: newRoom });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listRooms = async (req, res) => {
  try {
    const rooms = await RoomModel.find();
    const formatted = rooms.filter(r => r.mode !== 'solo').map(r => ({
      roomId: r.roomId,
      name: r.name,
      mode: r.mode || 'group',
      description: r.description,
      host: r.host,
      participantCount: (r.participants || []).length,
      currentTrack: r.currentTrack ? {
        title: r.currentTrack.title,
        artist: r.currentTrack.artist,
        artwork: r.currentTrack.artwork,
        genre: r.currentTrack.genre
      } : null,
      dominantEmotion: r.groupMood?.dominantEmotion || 'happy',
      djPersonality: r.djSettings?.personality || 'party',
      isPlaying: r.playbackState?.isPlaying || false
    }));

    res.json({ success: true, rooms: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const roomId = String(req.params.id || '').trim().toUpperCase();
    if (!roomId) {
      return res.status(400).json({ success: false, message: 'A room code is required.' });
    }

    const room = await RoomModel.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const result = await RoomModel.deleteOne({ roomId });
    if (!result.deletedCount) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    res.json({ success: true, roomId, message: 'Room deleted successfully.' });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ success: false, message: 'Could not delete the room. Please try again.' });
  }
};

exports.getRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    let room = await RoomModel.findOne({ roomId: id.toUpperCase() });
    if (!room) {
      room = await RoomModel.findById(id);
    }
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    if (room.mode === 'solo' && String(room.host?.id) !== String(user._id || user.id)) {
      return res.status(403).json({ success: false, message: 'This personal listening room is private.' });
    }

    room = await removePlaceholderTracks(room);
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    let room = await RoomModel.findOne({ roomId: id.toUpperCase() });
    if (!room) {
      room = await RoomModel.findById(id);
    }
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    if (room.mode === 'solo' && String(room.host?.id) !== String(req.user?._id || req.user?.id)) {
      return res.status(403).json({ success: false, message: 'This personal listening room is private.' });
    }

    room = await removePlaceholderTracks(room);
    const participants = room.participants || [];
    const userId = String(user._id || user.id);
    const existingIndex = participants.findIndex(p => String(p.id) === userId);

    if (existingIndex === -1) {
      participants.push({
        id: userId,
        username: user.username,
        displayName: user.displayName,
        profilePic: user.profilePic,
        preferredGenres: user.preferredGenres || ['EDM', 'Pop'],
        joinedAt: new Date()
      });
      await RoomModel.findByIdAndUpdate(room._id || room.id, { participants });
    }

    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.leaveRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = String(user._id || user.id);

    let room = await RoomModel.findOne({ roomId: id.toUpperCase() });
    if (room) {
      const participants = (room.participants || []).filter(p => String(p.id) !== userId);
      await RoomModel.findByIdAndUpdate(room._id || room.id, { participants });
    }
    res.json({ success: true, message: 'Left room successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateDJSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { personality, autoTransition, transitionDuration, energyPreference, autoQueueFromMood, enabled } = req.body;

    let room = await RoomModel.findOne({ roomId: id.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const djSettings = {
      ...room.djSettings,
      ...(personality !== undefined && { personality }),
      ...(autoTransition !== undefined && { autoTransition }),
      ...(transitionDuration !== undefined && { transitionDuration: Number(transitionDuration) }),
      ...(energyPreference !== undefined && { energyPreference: Number(energyPreference) }),
      ...(autoQueueFromMood !== undefined && { autoQueueFromMood }),
      ...(enabled !== undefined && { enabled })
    };

    const updated = await RoomModel.findByIdAndUpdate(room._id || room.id, { djSettings }, { new: true });
    res.json({ success: true, djSettings: updated.djSettings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
