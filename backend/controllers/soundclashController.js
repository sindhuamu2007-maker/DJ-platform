const SoundclashModel = require('../models/Soundclash');
const RoomModel = require('../models/Room');
const musicService = require('../services/musicProviderService');
const AIBridge = require('../services/aiBridge');

exports.createBattle = async (req, res) => {
  try {
    const { roomId, songAId, songBId } = req.body;
    if (!roomId || !songAId || !songBId) {
      return res.status(400).json({ success: false, message: 'A room and two tracks are required.' });
    }
    if (songAId === songBId) {
      return res.status(400).json({ success: false, message: 'Choose two different tracks for the battle.' });
    }

    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    if (room.mode === 'solo' && String(room.host?.id) !== String(req.user?._id || req.user?.id)) {
      return res.status(403).json({ success: false, message: 'This personal listening room is private.' });
    }

    const songA = await musicService.getTrackById(songAId);
    const songB = await musicService.getTrackById(songBId);

    if (!songA || !songB) {
      return res.status(400).json({ success: false, message: 'Both Song A and Song B are required.' });
    }

    // Generate AI Prediction
    const pastBattles = await SoundclashModel.find({ roomId: room.roomId });
    const aiPrediction = await AIBridge.predictSoundclash({
      songA,
      songB,
      participants: room.participants || [],
      roomMood: room.groupMood || {},
      pastBattles
    });

    const clash = await SoundclashModel.create({
      roomId: room.roomId,
      round: (room.soundclash?.round || 0) + 1,
      songA,
      songB,
      votes: [],
      votesACount: 0,
      votesBCount: 0,
      aiPrediction,
      status: 'active'
    });

    // Update Room soundclash state
    const soundclashState = {
      active: true,
      round: clash.round,
      clashId: clash._id || clash.id,
      songA,
      songB,
      votesA: [],
      votesB: [],
      votesACount: 0,
      votesBCount: 0,
      aiPrediction,
      startedAt: new Date()
    };

    await RoomModel.findByIdAndUpdate(room._id || room.id, { soundclash: soundclashState });

    res.status(201).json({ success: true, clash, soundclash: soundclashState, aiPrediction });
  } catch (err) {
    console.error('Create clash error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.vote = async (req, res) => {
  try {
    const { clashId, choice } = req.body; // choice: 'A' | 'B'
    const user = req.user;
    const userId = String(user._id || user.id);

    const clash = await SoundclashModel.findById(clashId);
    if (!clash) {
      return res.status(404).json({ success: false, message: 'Soundclash round not found.' });
    }

    if (clash.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This battle has already concluded.' });
    }
    if (!['A', 'B'].includes(choice)) {
      return res.status(400).json({ success: false, message: 'Choose Song A or Song B to vote.' });
    }

    const room = await RoomModel.findOne({ roomId: clash.roomId });
    if (room?.mode === 'solo' && String(room.host?.id) !== userId) {
      return res.status(403).json({ success: false, message: 'This personal listening room is private.' });
    }

    const votes = clash.votes || [];
    const existingVote = votes.find(v => String(v.userId) === userId);
    if (existingVote) {
      return res.status(400).json({ success: false, message: 'You have already voted in this round.' });
    }

    votes.push({
      userId,
      username: user.username,
      songChoice: choice,
      timestamp: new Date()
    });

    const votesACount = votes.filter(v => v.songChoice === 'A').length;
    const votesBCount = votes.filter(v => v.songChoice === 'B').length;

    const updated = await SoundclashModel.findByIdAndUpdate(
      clash._id || clash.id,
      { votes, votesACount, votesBCount },
      { new: true }
    );

    // Sync room state
    if (room && room.soundclash) {
      const roomClash = {
        ...room.soundclash,
        votesA: votes.filter(v => v.songChoice === 'A').map(v => v.userId),
        votesB: votes.filter(v => v.songChoice === 'B').map(v => v.userId),
        votesACount,
        votesBCount
      };
      await RoomModel.findByIdAndUpdate(room._id || room.id, { soundclash: roomClash });

      const io = req.app.get('io');
      if (io) {
        io.to(`room_${room.roomId}`).emit('soundclash:vote-updated', {
          clashId: clash._id || clash.id,
          votesACount,
          votesBCount,
          totalVotes: votes.length
        });
      }
    }

    res.json({
      success: true,
      votesACount: updated.votesACount,
      votesBCount: updated.votesBCount,
      totalVotes: votes.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.endBattle = async (req, res) => {
  try {
    const { clashId } = req.body;
    const clash = await SoundclashModel.findById(clashId);
    if (!clash) {
      return res.status(404).json({ success: false, message: 'Soundclash battle not found.' });
    }
    if (clash.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This battle has already concluded.' });
    }

    const room = await RoomModel.findOne({ roomId: clash.roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'The battle room no longer exists.' });
    }
    const userId = String(req.user?._id || req.user?.id);
    if (String(room.host?.id) !== userId) {
      return res.status(403).json({ success: false, message: 'Only the room host can finish this battle.' });
    }

    const winnerChoice = clash.votesACount >= clash.votesBCount ? 'A' : 'B';
    const winnerTrack = winnerChoice === 'A' ? clash.songA : clash.songB;

    const completed = await SoundclashModel.findByIdAndUpdate(
      clash._id || clash.id,
      {
        status: 'completed',
        winner: winnerTrack,
        winnerChoice
      },
      { new: true }
    );

    // Automatically inject winner track into room queue
    let updatedSoundclash = null;
    let updatedQueue = null;
    if (room) {
      const queue = room.queue || [];
      queue.unshift({
        ...winnerTrack,
        addedBy: {
          id: 'soundclash-system',
          username: 'Soundclash Winner',
          displayName: `🏆 Soundclash Round ${clash.round} Winner`
        },
        addedAt: new Date()
      });
      updatedQueue = queue;

      updatedSoundclash = {
        ...room.soundclash,
        active: false,
        lastWinner: winnerTrack
      };

      await RoomModel.findByIdAndUpdate(room._id || room.id, { queue, soundclash: updatedSoundclash });
      const io = req.app.get('io');
      if (io) {
        io.to(`room_${room.roomId}`).emit('soundclash:ended', {
          queue,
          soundclash: updatedSoundclash
        });
      }
    }

    res.json({
      success: true,
      winner: winnerTrack,
      winnerChoice,
      votesA: completed.votesACount,
      votesB: completed.votesBCount,
      queue: updatedQueue,
      soundclash: updatedSoundclash
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBattleHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const history = await SoundclashModel.find({ roomId: roomId.toUpperCase(), status: 'completed' });
    res.json({ success: true, count: history.length, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const allBattles = await SoundclashModel.find({ status: 'completed' });
    const trackWins = {};
    const genreWins = {};

    for (const b of allBattles) {
      if (b.winner) {
        const title = b.winner.title;
        trackWins[title] = (trackWins[title] || 0) + 1;
        const genre = b.winner.genre || 'Other';
        genreWins[genre] = (genreWins[genre] || 0) + 1;
      }
    }

    const topTracks = Object.entries(trackWins)
      .map(([title, wins]) => ({ title, wins }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 5);

    const topGenres = Object.entries(genreWins)
      .map(([genre, wins]) => ({ genre, wins }))
      .sort((a, b) => b.wins - a.wins);

    res.json({
      success: true,
      totalBattles: allBattles.length,
      topTracks,
      topGenres
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
