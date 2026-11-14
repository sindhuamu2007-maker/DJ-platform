import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { audioEngine } from '../utils/audioEngine';
import {
  authorizeAppleMusic,
  isAppleMusicAuthorized,
  pauseAppleMusic,
  playAppleMusicTrack,
  readAppleMusicPlayback,
  resumeAppleMusic,
  seekAppleMusic
} from '../services/appleMusicPlayer';

const RoomContext = createContext(null);

const isPlaceholderTrack = (track) =>
  track?.provider === 'demo' || /soundhelix\.com/i.test(track?.audioUrl || '');

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
  const [playbackError, setPlaybackError] = useState('');
  const [appleMusicConfigured, setAppleMusicConfigured] = useState(false);
  const [appleMusicConnected, setAppleMusicConnected] = useState(false);
  const [appleMusicSetupError, setAppleMusicSetupError] = useState('');
  const [activeProvider, setActiveProvider] = useState('preview');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [seekVersion, setSeekVersion] = useState(0);
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

  // Hidden Dual-Deck Audio Element Refs for Web Audio API
  const audioDeckARef = useRef(null);
  const audioDeckBRef = useRef(null);
  const activeDeckRef = useRef('A');
  const activeProviderRef = useRef('preview');
  const youtubePlayerRef = useRef(null);
  const appleMusicConfigRef = useRef(null);
  const appleTrackEndedRef = useRef(false);

  // Initialize Audio Elements with Web Audio Engine
  useEffect(() => {
    if (audioDeckARef.current && audioDeckBRef.current) {
      audioEngine.init(audioDeckARef.current, audioDeckBRef.current);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.getAppleMusicConfig()
      .then(config => {
        if (!active) return;
        if (!config.success) throw new Error(config.message || 'Apple Music configuration could not be loaded.');
        appleMusicConfigRef.current = config.configured ? config : null;
        setAppleMusicConfigured(Boolean(config.configured));
        setAppleMusicSetupError('');
      })
      .catch(error => {
        console.error('Apple Music configuration failed:', error);
        if (active) {
          setAppleMusicConfigured(false);
          setAppleMusicSetupError(error.message || 'Apple Music configuration could not be loaded.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Sync Current Track to Active Deck
  useEffect(() => {
    if (!currentTrack) return;
    if (activeProviderRef.current === 'apple-music') return;

    if (currentTrack.provider === 'youtube' && /^[A-Za-z0-9_-]{11}$/.test(currentTrack.youtubeVideoId || '')) {
      activeProviderRef.current = 'youtube';
      setActiveProvider('youtube');
      setDuration(currentTrack.duration || 180);
      setPlaybackError('');
      return;
    }
    
    const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
    if (isPlaceholderTrack(currentTrack)) {
      activeEl?.pause();
      activeEl?.removeAttribute('src');
      activeEl?.load();
      setIsPlaying(false);
      setPlaybackError('This room had placeholder demo audio. Search for and select a song to play.');
      return;
    }

    if (currentTrack.provider === 'itunes' && !currentTrack.audioUrl) {
      setDuration(currentTrack.duration || 180);
      setPlaybackError(appleMusicConfigured
        ? 'Connect an eligible Apple Music subscriber account to play this full song.'
        : 'Full-track playback is not configured on the server. Add Apple Music developer credentials to backend/.env and restart the backend.');
      return;
    }

    if (activeEl && currentTrack.audioUrl) {
      if (activeEl.src !== currentTrack.audioUrl) {
        setPlaybackError('');
        activeEl.currentTime = 0;
        activeEl.src = currentTrack.audioUrl;
        activeEl.load();
        if (isPlaying) {
          activeEl.play().catch(e => {
            console.error('Audio playback failed:', e);
            setPlaybackError('Playback was blocked. Press Play to start this track.');
            setIsPlaying(false);
          });
        }
      }
    } else {
      setPlaybackError('This track does not have a playable audio source.');
    }
    const trackDuration = currentTrack.provider === 'itunes' && currentTrack.audioUrl
      ? currentTrack.previewDuration || 30
      : currentTrack.duration || 180;
    setDuration(trackDuration);
  }, [currentTrack, appleMusicConfigured]);

  // Audio Playback progress tracking
  useEffect(() => {
    const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
    if (!activeEl) return;

    const onTimeUpdate = () => {
      setCurrentTime(activeEl.currentTime);
      // Auto-transition when 6s remain in track
      const remaining = activeEl.duration - activeEl.currentTime;
      if (remaining > 0 && remaining <= (djSettings.transitionDuration || 6) && isPlaying && queue.length > 0) {
        // Trigger auto transition if not already transitioning
      }
    };

    const onEnded = () => {
      skipNext();
    };
    const onError = () => {
      setIsPlaying(false);
      setPlaybackError(`Could not load "${currentTrack?.title || 'this track'}". Try another song.`);
    };

    activeEl.addEventListener('timeupdate', onTimeUpdate);
    activeEl.addEventListener('ended', onEnded);
    activeEl.addEventListener('error', onError);

    return () => {
      activeEl.removeEventListener('timeupdate', onTimeUpdate);
      activeEl.removeEventListener('ended', onEnded);
      activeEl.removeEventListener('error', onError);
    };
  }, [isPlaying, queue, djSettings, currentTrack]);

  const startTrackPlayback = async (track) => {
    if (track?.provider === 'youtube' && /^[A-Za-z0-9_-]{11}$/.test(track.youtubeVideoId || '')) {
      const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
      activeEl?.pause();
      if (activeProviderRef.current === 'apple-music') pauseAppleMusic();
      if (activeProviderRef.current === 'youtube') youtubePlayerRef.current?.pauseVideo();
      activeProviderRef.current = 'youtube';
      setActiveProvider('youtube');
      setCurrentTime(0);
      setDuration(track.duration || 180);
      setPlaybackError('');
      setIsPlaying(true);
      appleTrackEndedRef.current = false;
      return;
    }

    if (track?.provider === 'itunes' && isAppleMusicAuthorized() && appleMusicConfigRef.current) {
      const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
      activeEl?.pause();
      if (activeProviderRef.current === 'youtube') youtubePlayerRef.current?.pauseVideo();
      await playAppleMusicTrack(track, appleMusicConfigRef.current);
      activeProviderRef.current = 'apple-music';
      setActiveProvider('apple-music');
      setDuration(track.duration || 180);
      setPlaybackError('');
      setIsPlaying(true);
      appleTrackEndedRef.current = false;
      return;
    }

    if (!track?.audioUrl) {
      throw new Error(appleMusicConfigured
        ? 'Connect an eligible Apple Music subscriber account to play this full song.'
        : 'Full-track playback is not configured on the server. Add Apple Music developer credentials to backend/.env and restart the backend.');
    }

    if (activeProviderRef.current === 'apple-music') pauseAppleMusic();
    if (activeProviderRef.current === 'youtube') youtubePlayerRef.current?.pauseVideo();
    const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
    if (!activeEl) throw new Error('The music player is not ready yet.');
    activeProviderRef.current = 'preview';
    setActiveProvider('preview');
    audioEngine.setCrossfade(activeDeckRef.current === 'A' ? -1 : 1);
    activeEl.pause();
    activeEl.src = track.audioUrl;
    activeEl.currentTime = 0;
    activeEl.load();
    await activeEl.play();
    setDuration(track.previewDuration || 30);
    setPlaybackError(track.provider === 'itunes'
      ? appleMusicConfigured
        ? 'Playing the 30-second preview. Connect your Apple Music subscriber account to hear the full song.'
        : 'Playing the 30-second preview. Full songs require Apple Music developer credentials in backend/.env and a subscriber account.'
      : '');
    setIsPlaying(true);
    appleTrackEndedRef.current = false;
  };

  const connectAppleMusic = async () => {
    const config = appleMusicConfigRef.current;
    if (!config) {
      const message = 'Full-track playback is not configured. Set up Apple Music credentials on the server.';
      setPlaybackError(message);
      return { success: false, message };
    }

    try {
      await authorizeAppleMusic(config);
      setAppleMusicConnected(true);
      if (currentTrack?.provider === 'itunes') {
        const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
        activeEl?.pause();
        await playAppleMusicTrack(currentTrack, config);
        activeProviderRef.current = 'apple-music';
        setActiveProvider('apple-music');
        setCurrentTime(0);
        setDuration(currentTrack.duration || 180);
        setIsPlaying(true);
        appleTrackEndedRef.current = false;
        setPlaybackError('');
        socket.emit('playback:play', { currentTime: 0 });
      } else {
        setPlaybackError('');
      }
      return { success: true };
    } catch (error) {
      console.error('Apple Music authorization failed:', error);
      const message = error.message || 'Apple Music authorization failed.';
      setPlaybackError(message);
      return { success: false, message };
    }
  };

  useEffect(() => {
    if (activeProvider !== 'apple-music' || !isPlaying) return undefined;

    const timer = setInterval(() => {
      const playback = readAppleMusicPlayback();
      setCurrentTime(playback.currentTime);
      if (playback.duration > 0) setDuration(playback.duration);
      if (playback.duration > 0 && playback.currentTime >= playback.duration - 0.5 &&
          !appleTrackEndedRef.current) {
        appleTrackEndedRef.current = true;
        skipNext();
      }
    }, 500);

    return () => clearInterval(timer);
  }, [activeProvider, isPlaying, queue.length]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('room:initial-state', (data) => {
      setCurrentTrack(data.currentTrack || null);
      setQueue(data.queue || []);
      if (data.currentTrack?.provider === 'youtube') {
        activeProviderRef.current = 'youtube';
        setActiveProvider('youtube');
      }
      if (data.groupMood) setGroupMood(data.groupMood);
      if (data.djSettings) setDjSettings(data.djSettings);
      if (data.soundclash) setSoundclash(data.soundclash);
      if (data.conflictResolution) setConflictResolution(data.conflictResolution);
      if (data.playbackState) {
        setIsPlaying(data.playbackState.isPlaying);
        setCurrentTime(data.playbackState.currentTime);
      }
    });

    socket.on('room:user-joined', ({ participants: newParticipants }) => {
      if (newParticipants) setParticipants(newParticipants);
    });

    socket.on('room:user-left', ({ participants: newParticipants }) => {
      if (newParticipants) setParticipants(newParticipants);
    });

    socket.on('playback:state-sync', async (state) => {
      setIsPlaying(state.isPlaying);
      const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
      if (state.isPlaying) {
        try {
          if (currentTrack?.provider === 'youtube') {
            activeProviderRef.current = 'youtube';
            setActiveProvider('youtube');
            if (youtubePlayerRef.current) {
              if (state.currentTime > 0) youtubePlayerRef.current.seekTo(state.currentTime, true);
              youtubePlayerRef.current.playVideo();
            }
          } else if (currentTrack?.provider === 'itunes' && appleMusicConnected) {
            if (activeProviderRef.current === 'apple-music') {
              await resumeAppleMusic();
            } else {
              await startTrackPlayback(currentTrack);
              if (state.currentTime > 0) await seekAppleMusic(state.currentTime);
            }
          } else if (activeEl?.src) {
            await activeEl.play();
          } else if (currentTrack?.provider === 'itunes') {
            throw new Error(appleMusicConfigured
              ? 'Connect an eligible Apple Music subscriber account to play this full song.'
              : 'Full-track playback is not configured on the server. Add Apple Music developer credentials to backend/.env and restart the backend.');
          } else {
            throw new Error('No playable song is loaded.');
          }
          setPlaybackError('');
        } catch (error) {
          console.error('Synchronized playback failed:', error);
          setPlaybackError(error.message || 'Press Play to start synchronized playback.');
          setIsPlaying(false);
        }
      } else if (activeProviderRef.current === 'apple-music') {
        pauseAppleMusic();
      } else if (activeProviderRef.current === 'youtube') {
        youtubePlayerRef.current?.pauseVideo();
      } else {
        activeEl?.pause();
      }
    });

    socket.on('playback:seeked', ({ currentTime: newTime }) => {
      setCurrentTime(newTime);
      setSeekVersion(version => version + 1);
      if (activeProviderRef.current === 'apple-music') {
        seekAppleMusic(newTime).catch(error => {
          console.error('Apple Music seek failed:', error);
          setPlaybackError('Could not seek in the Apple Music track.');
        });
        return;
      }
      if (activeProviderRef.current === 'youtube') return;
      const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
      if (activeEl) activeEl.currentTime = newTime;
    });

    socket.on('playback:track-changed', async ({ currentTrack: nextTrack, queue: nextQueue, transition }) => {
      if (nextTrack && String(nextTrack.id || nextTrack._id) === String(currentTrack?.id || currentTrack?._id) &&
          isPlaying && activeProviderRef.current === (nextTrack.provider === 'youtube'
            ? 'youtube'
            : appleMusicConnected ? 'apple-music' : 'preview')) {
        setCurrentTrack(nextTrack);
        setQueue(nextQueue || []);
        setPlaybackError('');
        setIsPlaying(true);
        return;
      }

      if (!nextTrack) {
        if (activeProviderRef.current === 'apple-music') pauseAppleMusic();
        if (activeProviderRef.current === 'youtube') youtubePlayerRef.current?.pauseVideo();
        const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
        activeEl?.pause();
        activeEl?.removeAttribute('src');
        activeEl?.load();
        activeProviderRef.current = 'preview';
        setActiveProvider('preview');
        setIsPlaying(false);
        setCurrentTime(0);
        setPlaybackError('');
      } else {
        try {
          await startTrackPlayback(nextTrack);
        } catch (error) {
          console.error('Next track playback failed:', error);
          setPlaybackError(error.message || `Could not play "${nextTrack.title}".`);
          setIsPlaying(false);
        }
      }

      setCurrentTrack(nextTrack);
      setQueue(nextQueue);
      if (transition) setLastTransition(transition);
    });

    socket.on('queue:updated', ({ queue: newQueue, currentTrack: newTrack, playbackState }) => {
      if (newQueue) setQueue(newQueue);
      if (newTrack && String(newTrack.id || newTrack._id) !== String(currentTrack?.id || currentTrack?._id)) {
        setCurrentTrack(newTrack);
        setCurrentTime(0);
      }
      if (playbackState && !playbackState.isPlaying) {
        if (activeProviderRef.current === 'apple-music') pauseAppleMusic();
        if (activeProviderRef.current === 'youtube') youtubePlayerRef.current?.pauseVideo();
        const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
        activeEl?.pause();
        activeProviderRef.current = 'preview';
        setActiveProvider('preview');
        setIsPlaying(false);
      }
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

    socket.on('soundclash:created', (newSoundclash) => {
      setSoundclash(newSoundclash);
    });

    socket.on('soundclash:ended', ({ queue: newQueue, soundclash: completedClash }) => {
      if (newQueue) setQueue(newQueue);
      if (completedClash) setSoundclash(completedClash);
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
      socket.off('queue:updated');
      socket.off('chat:new-message');
      socket.off('reaction:added');
      socket.off('mood:updated');
      socket.off('soundclash:vote-updated');
      socket.off('soundclash:created');
      socket.off('soundclash:ended');
    };
  }, [socket, currentTrack, isPlaying, djSettings, appleMusicConnected, appleMusicConfigured, activeProvider]);

  // Actions
  const joinRoom = async (roomId) => {
    try {
      youtubePlayerRef.current?.pauseVideo();
      if (activeProviderRef.current === 'apple-music') pauseAppleMusic();
      audioDeckARef.current?.pause();
      audioDeckARef.current?.removeAttribute('src');
      audioDeckARef.current?.load();
      audioDeckBRef.current?.pause();
      audioDeckBRef.current?.removeAttribute('src');
      audioDeckBRef.current?.load();
      activeProviderRef.current = 'preview';
      setActiveProvider('preview');
      setIsPlaying(false);
      setCurrentTime(0);
      setSeekVersion(0);

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
        return { success: true, room: res.room };
      }
      return res;
    } catch (err) {
      console.error('Join room failed:', err);
      return { success: false, message: err.message || 'Unable to join this room.' };
    }
  };

  const play = async () => {
    const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
    if (isPlaceholderTrack(currentTrack)) {
      setPlaybackError('Select a song from Music Search before pressing Play.');
      return;
    }
    if (!currentTrack) {
      setPlaybackError('Select a song and add it to the queue before pressing Play.');
      return;
    }

    try {
      if (currentTrack.provider === 'youtube') {
        if (!youtubePlayerRef.current) {
          throw new Error('The YouTube player is still loading. Press Play again in a moment.');
        }
        activeProviderRef.current = 'youtube';
        setActiveProvider('youtube');
        youtubePlayerRef.current.playVideo();
        setPlaybackError('');
      } else if (currentTrack.provider === 'itunes' && appleMusicConnected) {
        if (activeProviderRef.current === 'apple-music') await resumeAppleMusic();
        else await startTrackPlayback(currentTrack);
      } else if (activeEl?.src) {
        await activeEl.play();
        setPlaybackError(currentTrack.provider === 'itunes'
          ? appleMusicConfigured
            ? 'Playing the 30-second preview. Connect your Apple Music subscriber account to hear the full song.'
            : 'Playing the 30-second preview. Full songs require Apple Music developer credentials in backend/.env and a subscriber account.'
          : '');
      } else {
        await startTrackPlayback(currentTrack);
      }
      setIsPlaying(true);
      socket.emit('playback:play', { currentTime });
    } catch (err) {
      console.error('Audio playback failed:', err);
      setIsPlaying(false);
      setPlaybackError(err.message || 'Could not play this track. Check your connection or try another song.');
    }
  };

  const pause = () => {
    const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
    if (activeProviderRef.current === 'apple-music') pauseAppleMusic();
    else if (activeProviderRef.current === 'youtube') youtubePlayerRef.current?.pauseVideo();
    else activeEl?.pause();
    setIsPlaying(false);
    socket.emit('playback:pause', { currentTime });
  };

  const seek = (time) => {
    setCurrentTime(time);
    setSeekVersion(version => version + 1);
    if (activeProviderRef.current === 'apple-music') {
      seekAppleMusic(time).catch(error => {
        console.error('Apple Music seek failed:', error);
        setPlaybackError('Could not seek in the Apple Music track.');
      });
    } else if (activeProviderRef.current !== 'youtube') {
      const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
      if (activeEl) activeEl.currentTime = time;
    }
    socket.emit('playback:seek', { currentTime: time });
  };

  const skipNext = () => {
    socket.emit('playback:next');
  };

  const addToQueue = async (track) => {
    if (!currentRoom) return { success: false, message: 'Join a room before adding music.' };
    try {
      const isYouTubeTrack = track?.provider === 'youtube' && track.youtubeVideoId;
      const res = await api.addToQueue(
        currentRoom.roomId,
        isYouTubeTrack ? undefined : track.id || track._id,
        isYouTubeTrack ? track : undefined
      );
      if (!res.success) throw new Error(res.message || 'Unable to add this track.');
      setQueue(res.queue || []);
      if (res.currentTrack && String(res.currentTrack.id || res.currentTrack._id) !== String(currentTrack?.id || currentTrack?._id)) {
        const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
        if (activeProviderRef.current === 'apple-music') pauseAppleMusic();
        if (activeProviderRef.current === 'youtube') youtubePlayerRef.current?.pauseVideo();
        activeEl?.pause();
        activeProviderRef.current = 'preview';
        setActiveProvider('preview');
        setCurrentTrack(res.currentTrack);
        setPlaybackError('');
        setCurrentTime(0);
        try {
          await startTrackPlayback(res.currentTrack);
          socket.emit('playback:play', { currentTime: 0 });
        } catch (playError) {
          console.error('Newly selected song could not start:', playError);
          setIsPlaying(false);
          setPlaybackError(playError.message || `Could not start "${res.currentTrack.title}". Press Play to retry.`);
        }
      }
      return res;
    } catch (err) {
      console.error('Add to queue error:', err);
      return { success: false, message: err.message || 'Unable to add this track.' };
    }
  };

  const playQueueTrack = async (track) => {
    if (!currentRoom) return { success: false, message: 'Join a room before playing a song.' };
    const isYouTubeTrack = track?.provider === 'youtube' &&
      /^[A-Za-z0-9_-]{11}$/.test(track.youtubeVideoId || '');
    if ((!track?.audioUrl && !(track?.provider === 'itunes' && appleMusicConnected) && !isYouTubeTrack) || isPlaceholderTrack(track)) {
      return {
        success: false,
        message: track?.provider === 'itunes'
          ? appleMusicConfigured
            ? 'Connect an eligible Apple Music subscriber account to play this full song.'
            : 'Full-track playback is not configured on the server. Add Apple Music developer credentials to backend/.env and restart the backend.'
          : 'This queued item does not have a playable song preview.'
      };
    }

    try {
      await startTrackPlayback(track);
      setCurrentTrack(track);
      setCurrentTime(0);
      const res = await api.playQueueTrack(currentRoom.roomId, track.id || track._id);
      if (!res.success) throw new Error(res.message || 'Could not start this queued song.');
      setQueue(res.queue || []);
      setCurrentTrack(res.currentTrack);
      return res;
    } catch (err) {
      console.error('Play queued song failed:', err);
      if (activeProviderRef.current === 'apple-music') pauseAppleMusic();
      if (activeProviderRef.current === 'youtube') youtubePlayerRef.current?.pauseVideo();
      const activeEl = activeDeckRef.current === 'A' ? audioDeckARef.current : audioDeckBRef.current;
      activeEl?.pause();
      setIsPlaying(false);
      setPlaybackError(err.message || 'Could not play this song. Try again.');
      return { success: false, message: err.message || 'Could not play this song. Try again.' };
    }
  };

  const removeFromQueue = async (queueItemId) => {
    if (!currentRoom) return { success: false, message: 'Join a room before changing the queue.' };
    try {
      const res = await api.removeFromQueue(currentRoom.roomId, queueItemId);
      if (!res.success) throw new Error(res.message || 'Unable to remove this track.');
      setQueue(res.queue || []);
      return res;
    } catch (err) {
      console.error('Remove from queue error:', err);
      return { success: false, message: err.message || 'Unable to remove this track.' };
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
    if (!soundclash) return { success: false, message: 'There is no active battle.' };
    const clashId = soundclash.clashId || soundclash._id || soundclash.id;
    try {
      const res = await api.voteSoundclash(clashId, choice);
      if (!res.success) throw new Error(res.message || 'Unable to submit your vote.');
      setSoundclash(prev => prev ? {
        ...prev,
        votesACount: res.votesACount,
        votesBCount: res.votesBCount
      } : prev);
      return res;
    } catch (err) {
      console.error('Vote error:', err);
      return { success: false, message: err.message || 'Unable to submit your vote.' };
    }
  };

  const createSoundclash = async (songAId, songBId) => {
    if (!currentRoom) {
      return { success: false, message: 'Join a room before starting a battle.' };
    }

    const res = await api.createBattle(currentRoom.roomId, songAId, songBId);
    if (res.success && res.soundclash) {
      setSoundclash(res.soundclash);
      socket.emit('soundclash:created');
    }
    return res;
  };

  const endSoundclash = async () => {
    if (!soundclash) return { success: false, message: 'There is no active battle.' };
    const clashId = soundclash.clashId || soundclash._id || soundclash.id;
    const res = await api.endBattle(clashId);
    if (res.success) {
      if (res.queue) setQueue(res.queue);
      if (res.soundclash) setSoundclash(res.soundclash);
    }
    return res;
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

  const reportYouTubeProgress = (time) => {
    if (Number.isFinite(time)) setCurrentTime(time);
  };

  const reportYouTubeDuration = (time) => {
    if (Number.isFinite(time) && time > 0) setDuration(time);
  };

  const reportYouTubeError = (message) => {
    setPlaybackError(message);
    setIsPlaying(false);
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
      playbackError,
      appleMusicConfigured,
      appleMusicConnected,
      appleMusicSetupError,
      activeProvider,
      currentTime,
      duration,
      seekVersion,
      groupMood,
      soundclash,
      conflictResolution,
      djSettings,
      lastTransition,
      joinRoom,
      connectAppleMusic,
      play,
      pause,
      seek,
      skipNext,
      addToQueue,
      playQueueTrack,
      removeFromQueue,
      registerYouTubePlayer,
      reportYouTubeProgress,
      reportYouTubeDuration,
      reportYouTubeError,
      sendMessage,
      sendReaction,
      voteSoundclash,
      createSoundclash,
      endSoundclash,
      triggerConflictResolution,
      updateDJSettings,
      sendVoiceCommand
    }}>
      {/* Hidden native audio elements for the dual-deck player */}
      <audio ref={audioDeckARef} preload="auto" />
      <audio ref={audioDeckBRef} preload="auto" />
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => useContext(RoomContext);
