const RoomModel = require('../models/Room');
const SoundclashModel = require('../models/Soundclash');
const musicService = require('../services/musicProviderService');
const AIBridge = require('../services/aiBridge');
const { VIDEO_ID_PATTERN } = require('../services/youtubeService');
const { v4: uuidv4 } = require('uuid');

const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    let currentRoomId = null;
    let currentUser = null;

    // 1. Join Room
    socket.on('room:join', async ({ roomId, user }) => {
      try {
        currentRoomId = roomId.toUpperCase();
        currentUser = user;
        socket.join(`room_${currentRoomId}`);

        const room = await RoomModel.findOne({ roomId: currentRoomId });
        if (room) {
          const participants = room.participants || [];
          const uid = String(user?.id || user?._id || 'anon');
          const exists = participants.some(p => String(p.id) === uid);

          if (!exists && user) {
            participants.push({
              id: uid,
              username: user.username,
              displayName: user.displayName || user.username,
              profilePic: user.profilePic,
              preferredGenres: user.preferredGenres || ['EDM', 'Pop'],
              joinedAt: new Date()
            });
            await RoomModel.findByIdAndUpdate(room._id || room.id, { participants });
          }

          // Broadcast updated room state
          io.to(`room_${currentRoomId}`).emit('room:user-joined', {
            user,
            participants: room.participants,
            participantCount: room.participants.length
          });

          // Send current playback & mood to joining user
          socket.emit('room:initial-state', {
            currentTrack: room.currentTrack,
            playbackState: room.playbackState,
            queue: room.queue,
            groupMood: room.groupMood,
            djSettings: room.djSettings,
            soundclash: room.soundclash,
            conflictResolution: room.conflictResolution
          });
        }
      } catch (err) {
        console.error('Socket room:join error:', err);
      }
    });

    // 2. Playback Synchronization
    socket.on('playback:play', async ({ currentTime }) => {
      if (!currentRoomId) return;
      const room = await RoomModel.findOne({ roomId: currentRoomId });
      if (room) {
        const playbackState = {
          ...room.playbackState,
          isPlaying: true,
          currentTime: currentTime || 0,
          updatedAt: new Date()
        };
        await RoomModel.findByIdAndUpdate(room._id || room.id, { playbackState });
        io.to(`room_${currentRoomId}`).emit('playback:state-sync', playbackState);
      }
    });

    socket.on('playback:pause', async ({ currentTime }) => {
      if (!currentRoomId) return;
      const room = await RoomModel.findOne({ roomId: currentRoomId });
      if (room) {
        const playbackState = {
          ...room.playbackState,
          isPlaying: false,
          currentTime: currentTime || 0,
          updatedAt: new Date()
        };
        await RoomModel.findByIdAndUpdate(room._id || room.id, { playbackState });
        io.to(`room_${currentRoomId}`).emit('playback:state-sync', playbackState);
      }
    });

    socket.on('playback:seek', async ({ currentTime }) => {
      if (!currentRoomId) return;
      io.to(`room_${currentRoomId}`).emit('playback:seeked', { currentTime });
    });

    socket.on('playback:source-updated', async ({ trackId, youtubeVideoId }) => {
      if (!currentRoomId || !trackId || !VIDEO_ID_PATTERN.test(youtubeVideoId || '')) return;
      try {
        const room = await RoomModel.findOne({ roomId: currentRoomId });
        if (!room) return;

        const matchesTrack = track => String(track?.id || track?._id) === String(trackId);
        let currentTrack = room.currentTrack;
        const queue = room.queue || [];
        let updated = false;

        if (matchesTrack(currentTrack)) {
          currentTrack = { ...currentTrack, youtubeVideoId };
          updated = true;
        } else {
          const queuedTrack = queue.find(matchesTrack);
          if (queuedTrack) {
            queuedTrack.youtubeVideoId = youtubeVideoId;
            updated = true;
          }
        }

        if (!updated) return;
        await RoomModel.findByIdAndUpdate(room._id || room.id, { currentTrack, queue });
        io.to(`room_${currentRoomId}`).emit('playback:source-updated', { trackId, youtubeVideoId });
      } catch (err) {
        console.error('Socket playback:source-updated error:', err);
      }
    });

    socket.on('playback:next', async () => {
      if (!currentRoomId) return;
      try {
        const room = await RoomModel.findOne({ roomId: currentRoomId });
        if (!room) return;

        const previousTrack = room.currentTrack;
        const queue = room.queue || [];
        let nextTrack = null;
        let transitionInfo = null;

        // Save previous track to history
        if (previousTrack) {
          const history = room.history || [];
          history.push({
            trackId: previousTrack.id,
            title: previousTrack.title,
            artist: previousTrack.artist,
            genre: previousTrack.genre,
            playedAt: new Date()
          });
          await RoomModel.findByIdAndUpdate(room._id || room.id, { history });
        }

        if (queue.length > 0) {
          nextTrack = queue.shift();
          // Calculate transition from previous to next
          if (previousTrack && nextTrack) {
            transitionInfo = await AIBridge.calculateTransition(previousTrack, nextTrack, room.djSettings);
          }
        } else {
          // If queue is empty, AI DJ dynamically selects next track using Conflict Resolution + Personality
          const catalog = await musicService.getAllCatalog();
          const decision = await AIBridge.selectNextTrack({
            currentTrack: previousTrack || {},
            queue: [],
            catalog,
            participants: room.participants || [],
            recentGenres: (room.history || []).slice(-5).map(h => h.genre),
            roomMood: room.groupMood || {},
            personalityId: room.djSettings?.personality || 'party'
          });

          if (decision && decision.selected_track) {
            nextTrack = decision.selected_track;
            transitionInfo = decision.transition;
          }
        }

        const playbackState = {
          ...room.playbackState,
          isPlaying: true,
          currentTime: 0,
          updatedAt: new Date()
        };

        await RoomModel.findByIdAndUpdate(room._id || room.id, {
          currentTrack: nextTrack,
          queue,
          playbackState
        });

        io.to(`room_${currentRoomId}`).emit('playback:track-changed', {
          currentTrack: nextTrack,
          queue,
          playbackState,
          transition: transitionInfo
        });
      } catch (err) {
        console.error('Socket playback:next error:', err);
      }
    });

    // 3. Collaborative Queue Events
    socket.on('queue:add', async ({ track }) => {
      if (!currentRoomId || !track) return;
      try {
        const room = await RoomModel.findOne({ roomId: currentRoomId });
        if (!room) return;

        const queue = room.queue || [];
        const trackId = String(track.id || track._id);
        const existingTrack = [room.currentTrack, ...queue].find(
          item => String(item?.id || item?._id) === trackId
        );

        if (existingTrack) {
          if (track.youtubeVideoId && VIDEO_ID_PATTERN.test(track.youtubeVideoId)) {
            existingTrack.youtubeVideoId = track.youtubeVideoId;
            await RoomModel.findByIdAndUpdate(room._id || room.id, {
              currentTrack: room.currentTrack,
              queue
            });
          }
          io.to(`room_${currentRoomId}`).emit('queue:updated', {
            queue,
            currentTrack: room.currentTrack
          });
          return;
        }

        const queueItem = {
          ...track,
          addedBy: currentUser ? {
            id: currentUser.id || currentUser._id,
            username: currentUser.username,
            displayName: currentUser.displayName || currentUser.username
          } : { username: 'Guest' },
          addedAt: new Date()
        };

        queue.push(queueItem);
        let currentTrack = room.currentTrack;
        if (!currentTrack) {
          currentTrack = queue.shift();
        }

        await RoomModel.findByIdAndUpdate(room._id || room.id, { queue, currentTrack });

        io.to(`room_${currentRoomId}`).emit('queue:updated', {
          queue,
          currentTrack
        });
      } catch (err) {
        console.error('Socket queue:add error:', err);
      }
    });

    socket.on('queue:remove', async ({ queueItemId }) => {
      if (!currentRoomId) return;
      try {
        const room = await RoomModel.findOne({ roomId: currentRoomId });
        if (!room) return;

        const queue = (room.queue || []).filter(t => String(t.id || t._id) !== String(queueItemId));
        await RoomModel.findByIdAndUpdate(room._id || room.id, { queue });

        io.to(`room_${currentRoomId}`).emit('queue:updated', { queue });
      } catch (err) {
        console.error('Socket queue:remove error:', err);
      }
    });

    // 4. Real-time Chat with Automatic NLP Sentiment & Emotion Detection
    socket.on('chat:message', async ({ text }) => {
      if (!currentRoomId || !text) return;
      try {
        const room = await RoomModel.findOne({ roomId: currentRoomId });
        if (!room) return;

        // Perform NLP Sentiment & Emotion Analysis
        const sentimentAnalysis = await AIBridge.analyzeSentiment(text);

        const chatMessage = {
          id: uuidv4(),
          sender: currentUser ? {
            id: currentUser.id || currentUser._id,
            username: currentUser.username,
            displayName: currentUser.displayName || currentUser.username,
            profilePic: currentUser.profilePic
          } : {
            id: 'guest',
            username: 'Guest Listener',
            displayName: 'Guest',
            profilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
          },
          text,
          sentiment: sentimentAnalysis.sentiment,
          dominantEmotion: sentimentAnalysis.dominant_emotion,
          polarity: sentimentAnalysis.polarity,
          timestamp: new Date()
        };

        const chatMessages = room.chatMessages || [];
        chatMessages.push(chatMessage);
        if (chatMessages.length > 100) chatMessages.shift();

        // Recalculate room mood dynamically
        const recentEvents = chatMessages.slice(-20).map(m => ({
          event_type: 'chat',
          dominant_emotion: m.dominantEmotion,
          polarity: m.polarity,
          timestamp: new Date(m.timestamp).getTime()
        }));

        (room.reactions || []).slice(-20).forEach(r => {
          recentEvents.push({
            event_type: 'reaction',
            reaction_type: r.reactionType,
            timestamp: new Date(r.timestamp).getTime()
          });
        });

        const newMood = await AIBridge.calculateRoomMood(recentEvents);

        await RoomModel.findByIdAndUpdate(room._id || room.id, {
          chatMessages,
          groupMood: {
            emotions: newMood.emotions,
            dominantEmotion: newMood.dominant_emotion,
            collectiveEnergy: newMood.collective_energy,
            collectiveValence: newMood.collective_valence,
            trajectory: newMood.trajectory,
            lastCalculated: new Date()
          }
        });

        // Broadcast message and updated room mood
        io.to(`room_${currentRoomId}`).emit('chat:new-message', chatMessage);
        io.to(`room_${currentRoomId}`).emit('mood:updated', newMood);
      } catch (err) {
        console.error('Socket chat:message error:', err);
      }
    });

    // 5. Song Reactions (❤️, 🔥, ⚡, 😴, 💃, 💔)
    socket.on('reaction:add', async ({ emoji, reactionType, trackId }) => {
      if (!currentRoomId) return;
      try {
        const room = await RoomModel.findOne({ roomId: currentRoomId });
        if (!room) return;

        const reaction = {
          id: uuidv4(),
          emoji,
          reactionType: reactionType || emoji,
          sender: currentUser ? {
            id: currentUser.id || currentUser._id,
            username: currentUser.username
          } : { username: 'Guest' },
          trackId,
          timestamp: new Date()
        };

        const reactions = room.reactions || [];
        reactions.push(reaction);
        if (reactions.length > 50) reactions.shift();

        // Calculate emotion impact
        const sentimentResult = await AIBridge.analyzeSentiment(emoji, reactionType);
        
        // Recalculate mood
        const recentEvents = (room.chatMessages || []).slice(-15).map(m => ({
          event_type: 'chat',
          dominant_emotion: m.dominantEmotion,
          polarity: m.sentiment === 'positive' ? 0.8 : -0.8,
          timestamp: new Date(m.timestamp).getTime()
        }));

        reactions.slice(-15).forEach(r => {
          recentEvents.push({
            event_type: 'reaction',
            reaction_type: r.reactionType,
            energy_score: sentimentResult.energy_score,
            timestamp: new Date(r.timestamp).getTime()
          });
        });

        const newMood = await AIBridge.calculateRoomMood(recentEvents);

        await RoomModel.findByIdAndUpdate(room._id || room.id, {
          reactions,
          groupMood: {
            emotions: newMood.emotions,
            dominantEmotion: newMood.dominant_emotion,
            collectiveEnergy: newMood.collective_energy,
            collectiveValence: newMood.collective_valence,
            trajectory: newMood.trajectory,
            lastCalculated: new Date()
          }
        });

        io.to(`room_${currentRoomId}`).emit('reaction:added', reaction);
        io.to(`room_${currentRoomId}`).emit('mood:updated', newMood);
      } catch (err) {
        console.error('Socket reaction:add error:', err);
      }
    });

    // 6. Soundclash Live Battle & Voting Events
    socket.on('soundclash:vote', async ({ clashId, choice }) => {
      if (!currentRoomId || !currentUser) return;
      try {
        const clash = await SoundclashModel.findById(clashId);
        if (!clash || clash.status !== 'active') return;

        const userId = String(currentUser.id || currentUser._id);
        const votes = clash.votes || [];
        if (votes.some(v => String(v.userId) === userId)) {
          socket.emit('soundclash:error', { message: 'You have already voted in this round.' });
          return;
        }

        votes.push({
          userId,
          username: currentUser.username,
          songChoice: choice,
          timestamp: new Date()
        });

        const votesACount = votes.filter(v => v.songChoice === 'A').length;
        const votesBCount = votes.filter(v => v.songChoice === 'B').length;

        await SoundclashModel.findByIdAndUpdate(clash._id || clash.id, {
          votes,
          votesACount,
          votesBCount
        });

        io.to(`room_${currentRoomId}`).emit('soundclash:vote-updated', {
          clashId,
          votesACount,
          votesBCount,
          totalVotes: votes.length
        });
      } catch (err) {
        console.error('Socket soundclash:vote error:', err);
      }
    });

    // 7. Voice Command Handler
    socket.on('voice:command', async ({ command }) => {
      if (!currentRoomId || !command) return;
      try {
        const room = await RoomModel.findOne({ roomId: currentRoomId });
        if (!room) return;

        const cmd = command.toLowerCase().trim();
        let actionResponse = { command, status: 'processed', action: 'unknown', message: '' };

        if (cmd.includes('skip') || cmd.includes('next song')) {
          actionResponse = { command, status: 'processed', action: 'skip', message: 'AI DJ skipping to next track...' };
          io.to(`room_${currentRoomId}`).emit('playback:skip-requested', actionResponse);
        } else if (cmd.includes('energetic') || cmd.includes('party')) {
          const catalog = await musicService.getAllCatalog();
          const energeticTracks = catalog.filter(t => t.energy > 0.8 && t.genre !== room.currentTrack?.genre);
          if (energeticTracks.length > 0) {
            const pick = energeticTracks[Math.floor(Math.random() * energeticTracks.length)];
            const queue = room.queue || [];
            queue.unshift({ ...pick, addedBy: { username: 'Voice AI DJ' }, addedAt: new Date() });
            await RoomModel.findByIdAndUpdate(room._id || room.id, { queue });
            actionResponse = { command, status: 'processed', action: 'queue_add', message: `Queued high-energy track: ${pick.title}` };
            io.to(`room_${currentRoomId}`).emit('queue:updated', { queue });
          }
        } else if (cmd.includes('relax') || cmd.includes('chill') || cmd.includes('lofi') || cmd.includes('lo-fi')) {
          const catalog = await musicService.getAllCatalog();
          const chillTracks = catalog.filter(t => t.genre === 'Lo-fi' || t.energy < 0.45);
          if (chillTracks.length > 0) {
            const pick = chillTracks[0];
            const queue = room.queue || [];
            queue.unshift({ ...pick, addedBy: { username: 'Voice AI DJ' }, addedAt: new Date() });
            await RoomModel.findByIdAndUpdate(room._id || room.id, { queue });
            actionResponse = { command, status: 'processed', action: 'queue_add', message: `Queued relaxing track: ${pick.title}` };
            io.to(`room_${currentRoomId}`).emit('queue:updated', { queue });
          }
        } else if (cmd.includes('kannada')) {
          const catalog = await musicService.getAllCatalog();
          const kannadaTracks = catalog.filter(t => t.genre.toLowerCase() === 'kannada');
          if (kannadaTracks.length > 0) {
            const pick = kannadaTracks[0];
            const queue = room.queue || [];
            queue.push({ ...pick, addedBy: { username: 'Voice AI DJ' }, addedAt: new Date() });
            await RoomModel.findByIdAndUpdate(room._id || room.id, { queue });
            actionResponse = { command, status: 'processed', action: 'queue_add', message: `Added Kannada hit: ${pick.title}` };
            io.to(`room_${currentRoomId}`).emit('queue:updated', { queue });
          }
        } else if (cmd.includes('soundclash') || cmd.includes('battle')) {
          actionResponse = { command, status: 'processed', action: 'open_soundclash', message: 'Opening Soundclash Battle arena!' };
          io.to(`room_${currentRoomId}`).emit('soundclash:open-modal', actionResponse);
        } else {
          actionResponse = { command, status: 'acknowledged', action: 'text_echo', message: `AI DJ heard: "${command}"` };
        }

        io.to(`room_${currentRoomId}`).emit('voice:feedback', actionResponse);
      } catch (err) {
        console.error('Socket voice:command error:', err);
      }
    });

    // 8. Disconnect
    socket.on('disconnect', async () => {
      if (currentRoomId && currentUser) {
        try {
          const room = await RoomModel.findOne({ roomId: currentRoomId });
          if (room) {
            const uid = String(currentUser.id || currentUser._id);
            const participants = (room.participants || []).filter(p => String(p.id) !== uid);
            await RoomModel.findByIdAndUpdate(room._id || room.id, { participants });
            io.to(`room_${currentRoomId}`).emit('room:user-left', {
              user: currentUser,
              participants,
              participantCount: participants.length
            });
          }
        } catch (err) {
          console.error('Socket disconnect cleanup error:', err);
        }
      }
    });
  });
};

module.exports = { registerSocketHandlers };
