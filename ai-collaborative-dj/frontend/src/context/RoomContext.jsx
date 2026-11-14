import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = getSocket();

  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [seekVersion, setSeekVersion] = useState(0);
  const [playbackError, setPlaybackError] = useState('');
  const [groupMood, setGroupMood] = useState({
    emotions: { happy: 35, excited: 25, energetic: 20, relaxed: 15, sad: 5, frustrated: 0 },
    dominantEmotion: 'happy',
    collectiveEnergy: 0.70,
    collectiveValence: 0.60,
    trajectory: 'Groovy & Upbeat'
  });
  const [soundclash, setSoundclash] = useState(null);
  const [conflictResolution, setConflictResolution] = useState(null);
  const [djSettings, setDjSettings] = useState({
    enabled: true,
    personality: 'party',
    autoTransition: true,
    transitionDuration: 6,
    energyPreference: 0.8
  });
  const [lastTransition, setLastTransition] = useState(null);

  const youtubePlayerRef = useRef(null);

  // Full-track playback is delegated to the official YouTube embedded player.
  useEffect(() => {
    if (!currentTrack) return;
    setDuration(currentTrack.duration || 180);
    if (currentTrack.youtubeVideoId) setPlaybackError('');
  }, [currentTrack]);

  useEffect(() => {
    if (!socket || !currentTrack || currentTrack.youtubeVideoId) return;

    let cancelled = false;
    const trackId = currentTrack.id || currentTrack._id;
    const searchQuery = `${currentTrack.title || ''} ${currentTrack.artist || ''}`.trim();
    if (!searchQuery) {
      setPlaybackError('This track is missing a title or artist for YouTube search.');
      return undefined;
    }

    setPlaybackError('Finding a full-length YouTube version…');
    api.searchYouTube(searchQuery).then(result => {
      if (!result.success) throw new Error(result.message || 'YouTube full-track search failed.');
      const video = result.videos?.[0];
      if (!video) throw new Error('No embeddable full-track video was found for this song.');
      if (cancelled) return;

      setCurrentTrack(track => track && String(track.id || track._id) === String(trackId)
        ? { ...track, youtubeVideoId: video.videoId }
        : track);
      setPlaybackError('');
      socket.emit('playback:source-updated', { trackId, youtubeVideoId: video.videoId });
    }).catch(error => {
      if (!cancelled) setPlaybackError(error.message);
    });

    return () => {
      cancelled = true;
    };
  }, [
    currentTrack?.id,
    currentTrack?._id,
    currentTrack?.title,
    currentTrack?.artist,
    currentTrack?.youtubeVideoId,
    socket
  ]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('room:initial-state', (data) => {
      if (data.currentTrack) setCurrentTrack(data.currentTrack);
      if (data.queue) setQueue(data.queue);
      if (data.groupMood) setGroupMood(data.groupMood);
      if (data.djSettings) setDjSettings(data.djSettings);
      if (data.soundclash) setSoundclash(data.soundclash);
      if (data.conflictResolution) setConflictResolution(data.conflictResolution);
      if (data.playbackState) {
        setIsPlaying(data.playbackState.isPlaying);
        setCurrentTime(data.playbackState.currentTime);
        setSeekVersion(version => version + 1);
      }
    });

    socket.on('room:user-joined', ({ participants: newParticipants }) => {
      if (newParticipants) setParticipants(newParticipants);
    });

    socket.on('room:user-left', ({ participants: newParticipants }) => {
      if (newParticipants) setParticipants(newParticipants);
    });

    socket.on('playback:state-sync', (state) => {
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime || 0);
      setSeekVersion(version => version + 1);
    });

    socket.on('playback:seeked', ({ currentTime: newTime }) => {
      setCurrentTime(newTime);
      setSeekVersion(version => version + 1);
    });

    socket.on('playback:track-changed', ({ currentTrack: nextTrack, queue: nextQueue, playbackState, transition }) => {
      setCurrentTrack(nextTrack);
      setQueue(nextQueue);
      setCurrentTime(playbackState?.currentTime || 0);
      setIsPlaying(playbackState?.isPlaying ?? Boolean(nextTrack));
      setSeekVersion(version => version + 1);
      if (transition) setLastTransition(transition);
    });

    socket.on('playback:source-updated', ({ trackId, youtubeVideoId }) => {
      const matchesTrack = track => String(track?.id || track?._id) === String(trackId);
      setCurrentTrack(track => matchesTrack(track) ? { ...track, youtubeVideoId } : track);
      setQueue(items => items.map(track => matchesTrack(track) ? { ...track, youtubeVideoId } : track));
      setPlaybackError('');
    });

    socket.on('queue:updated', ({ queue: newQueue, currentTrack: newTrack }) => {
      if (newQueue) setQueue(newQueue);
      if (newTrack && !currentTrack) setCurrentTrack(newTrack);
    });

    socket.on('chat:new-message', (msg) => {
      setMessages(prev => [...prev.slice(-99), msg]);
    });

    socket.on('reaction:added', (rxn) => {
      setReactions(prev => [...prev.slice(-30), rxn]);
    });

    socket.on('mood:updated', (mood) => {
      setGroupMood(mood);
    });

    socket.on('soundclash:vote-updated', ({ votesACount, votesBCount, totalVotes }) => {
      setSoundclash(prev => prev ? {
        ...prev,
        votesACount,
        votesBCount,
        totalVotes
      } : null);
    });

    socket.on('soundclash:open-modal', () => {
      // modal trigger
    });

    return () => {
      socket.off('room:initial-state');
      socket.off('room:user-joined');
      socket.off('room:user-left');
      socket.off('playback:state-sync');
      socket.off('playback:seeked');
      socket.off('playback:track-changed');
      socket.off('playback:source-updated');
      socket.off('queue:updated');
      socket.off('chat:new-message');
      socket.off('reaction:added');
      socket.off('mood:updated');
      socket.off('soundclash:vote-updated');
    };
  }, [socket, currentTrack, isPlaying, djSettings]);

  // Actions
  const joinRoom = async (roomId) => {
    try {
      const res = await api.getRoom(roomId);
      if (res.success && res.room) {
        setCurrentRoom(res.room);
        setCurrentTrack(res.room.currentTrack);
        setQueue(res.room.queue || []);
        setParticipants(res.room.participants || []);
        setMessages(res.room.chatMessages || []);
        setReactions(res.room.reactions || []);
        if (res.room.groupMood) setGroupMood(res.room.groupMood);
        if (res.room.djSettings) setDjSettings(res.room.djSettings);
        if (res.room.soundclash) setSoundclash(res.room.soundclash);
        if (res.room.conflictResolution) setConflictResolution(res.room.conflictResolution);

        socket.emit('room:join', { roomId, user });
      }
    } catch (err) {
      console.error('Join room failed:', err);
    }
  };

  const play = () => {
    youtubePlayerRef.current?.playVideo();
    setIsPlaying(true);
    socket.emit('playback:play', { currentTime });
  };

  const pause = () => {
    youtubePlayerRef.current?.pauseVideo();
    setIsPlaying(false);
    socket.emit('playback:pause', { currentTime });
  };

  const seek = (time) => {
    setCurrentTime(time);
    setSeekVersion(version => version + 1);
    youtubePlayerRef.current?.seekTo(time, true);
    socket.emit('playback:seek', { currentTime: time });
  };

  const skipNext = () => {
    socket.emit('playback:next');
  };

  const addToQueue = async (track) => {
    if (!currentRoom) return;
    try {
      let fullTrack = track;
      if (!fullTrack.youtubeVideoId) {
        const searchQuery = `${fullTrack.title || ''} ${fullTrack.artist || ''}`.trim();
        const result = await api.searchYouTube(searchQuery);
        if (!result.success) throw new Error(result.message || 'YouTube full-track search failed.');
        const video = result.videos?.[0];
        if (!video) throw new Error('No embeddable full-track video was found for this song.');
        fullTrack = { ...fullTrack, youtubeVideoId: video.videoId };
      }

      const result = await api.addToQueue(currentRoom.roomId, fullTrack);
      if (!result.success) throw new Error(result.message || 'Could not add the track to the queue.');
      socket.emit('queue:add', { track: fullTrack });
      setPlaybackError('');
      return true;
    } catch (err) {
      console.error('Add to queue error:', err);
      setPlaybackError(err.message);
      return false;
    }
  };

  const removeFromQueue = async (queueItemId) => {
    if (!currentRoom) return;
    try {
      await api.removeFromQueue(currentRoom.roomId, queueItemId);
      socket.emit('queue:remove', { queueItemId });
    } catch (err) {
      console.error('Remove from queue error:', err);
    }
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;
    socket.emit('chat:message', { text });
  };

  const sendReaction = (emoji, reactionType) => {
    socket.emit('reaction:add', {
      emoji,
      reactionType: reactionType || emoji,
      trackId: currentTrack?.id
    });
  };

  const voteSoundclash = async (choice) => {
    if (!soundclash) return;
    const clashId = soundclash.clashId || soundclash._id || soundclash.id;
    try {
      await api.voteSoundclash(clashId, choice);
      socket.emit('soundclash:vote', { clashId, choice });
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const triggerConflictResolution = async () => {
    if (!currentRoom) return;
    try {
      const res = await api.resolveConflict(currentRoom.roomId);
      if (res.success) {
        setConflictResolution({
          explanation: res.result.explanation,
          topRecommendation: res.result.top_recommendation,
          groupGenreDistribution: res.result.group_genre_distribution
        });
      }
    } catch (err) {
      console.error('Conflict resolution trigger error:', err);
    }
  };

  const updateDJSettings = async (newSettings) => {
    if (!currentRoom) return;
    try {
      const res = await api.updateDJSettings(currentRoom.roomId, newSettings);
      if (res.success) {
        setDjSettings(res.djSettings);
      }
    } catch (err) {
      console.error('Update DJ settings error:', err);
    }
  };

  const sendVoiceCommand = (command) => {
    socket.emit('voice:command', { command });
  };

  const registerYouTubePlayer = (player) => {
    youtubePlayerRef.current = player;
  };

  const updatePlaybackProgress = (time) => {
    setCurrentTime(time);
  };

  const updatePlaybackDuration = (time) => {
    if (Number.isFinite(time) && time > 0) setDuration(time);
  };

  return (
    <RoomContext.Provider value={{
      currentRoom,
      currentTrack,
      queue,
      participants,
      messages,
      reactions,
      isPlaying,
      currentTime,
      duration,
      seekVersion,
      playbackError,
      groupMood,
      soundclash,
      conflictResolution,
      djSettings,
      lastTransition,
      joinRoom,
      play,
      pause,
      seek,
      skipNext,
      addToQueue,
      removeFromQueue,
      sendMessage,
      sendReaction,
      voteSoundclash,
      triggerConflictResolution,
      updateDJSettings,
      sendVoiceCommand,
      registerYouTubePlayer,
      updatePlaybackProgress,
      updatePlaybackDuration,
      setPlaybackError
    }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => useContext(RoomContext);
