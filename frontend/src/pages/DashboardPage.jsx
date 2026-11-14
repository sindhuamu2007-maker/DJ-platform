import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, Plus, Users, Disc3, Sparkles, Music, Play, ArrowRight, ShieldCheck, Heart, ExternalLink, Loader2, Copy, Check, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MoodIndicator } from '../components/MoodIndicator';
import { copyToClipboard } from '../utils/copyToClipboard';
import {
  getPersonalityYouTubeSearchUrl,
  PERSONALITY_YOUTUBE_SEARCHES
} from '../utils/djPersonalitySearch';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [providerStatus, setProviderStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copiedRoomCode, setCopiedRoomCode] = useState('');
  const [copyErrorRoomCode, setCopyErrorRoomCode] = useState('');
  const [createdInvite, setCreatedInvite] = useState(null);
  const [deletingRoomId, setDeletingRoomId] = useState('');
  const [deleteRoomError, setDeleteRoomError] = useState(null);

  // Create Room Form State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomPersonality, setNewRoomPersonality] = useState('party');
  const [creating, setCreating] = useState(false);
  const [creatingInviteCode, setCreatingInviteCode] = useState(false);
  const [creatingSolo, setCreatingSolo] = useState(false);
  const [soloRoomError, setSoloRoomError] = useState('');
  const [createRoomError, setCreateRoomError] = useState('');
  const [inviteCodeError, setInviteCodeError] = useState('');
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  const [youtubeSearchError, setYoutubeSearchError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, catRes] = await Promise.all([
          api.listRooms(),
          api.getCatalog()
        ]);
        if (roomsRes.success) setRooms(roomsRes.rooms);
        if (catRes.success) {
          setCatalog(catRes.tracks.slice(0, 6));
          setProviderStatus(catRes.provider);
        }
      } catch (err) {
        console.error('Dashboard load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!showCreateModal) return undefined;

    let active = true;
    const search = PERSONALITY_YOUTUBE_SEARCHES[newRoomPersonality] || PERSONALITY_YOUTUBE_SEARCHES.party;
    setYoutubeVideos([]);
    setYoutubeSearchError('');
    setLoadingYoutube(true);

    api.searchYouTube(search.query, { limit: 5 }).then(res => {
      if (!active) return;
      if (!res.success) {
        setYoutubeSearchError(res.message || 'YouTube search is unavailable.');
        return;
      }
      setYoutubeVideos(res.videos || []);
    }).catch(err => {
      if (active) setYoutubeSearchError(err.message || 'YouTube search is unavailable.');
    }).finally(() => {
      if (active) setLoadingYoutube(false);
    });

    return () => {
      active = false;
    };
  }, [showCreateModal, newRoomPersonality]);

  const openCreateRoom = () => {
    setCreateRoomError('');
    setCreatedInvite(null);
    setShowCreateModal(true);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (creating) return;
    if (!user || !token) {
      navigate('/login', { state: { from: { pathname: '/dashboard' } }, replace: true });
      return;
    }

    const roomName = newRoomName.trim();
    if (!roomName) {
      setCreateRoomError('Please enter a room name.');
      return;
    }

    setCreateRoomError('');
    setCreating(true);
    try {
      const res = await api.createRoom({
        name: roomName,
        description: newRoomDesc.trim() || 'High-energy AI-curated group listening session',
        mode: 'group',
        personality: newRoomPersonality
      });
      if (res.success && res.room) {
        navigate(`/room/${res.room.roomId}`);
      } else {
        setCreateRoomError(res.message || 'The room could not be created. Please try again.');
      }
    } catch (err) {
      console.error('Room creation failed:', err);
      setCreateRoomError(err.message || 'Unable to connect to the server. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateInviteCode = async () => {
    if (creatingInviteCode) return;
    if (!user || !token) {
      navigate('/login', { state: { from: { pathname: '/dashboard' } }, replace: true });
      return;
    }

    setInviteCodeError('');
    setCreatedInvite(null);
    setCreatingInviteCode(true);
    const displayName = user.displayName || user.username || 'Shared';
    const roomName = `${displayName}'s Shared Room`;
    const description = 'A shared listening room created for an invite code.';

    try {
      const res = await api.createRoom({
        name: roomName,
        description,
        mode: 'group',
        personality: 'party'
      });
      if (!res.success || !res.room?.roomId) {
        setInviteCodeError(res.message || 'Could not create an invite code. Please try again.');
        return;
      }

      const room = res.room;
      setCreatedInvite({ roomId: room.roomId, name: room.name || roomName });
      setRooms(current => [{
        roomId: room.roomId,
        name: room.name || roomName,
        description: room.description || description,
        host: room.host || { id: user.id, username: user.username },
        participantCount: room.participants?.length ?? 0,
        currentTrack: room.currentTrack || null,
        dominantEmotion: room.groupMood?.dominantEmotion || 'happy',
        djPersonality: room.djSettings?.personality || 'party'
      }, ...current.filter(existingRoom => existingRoom.roomId !== room.roomId)]);
    } catch (error) {
      console.error('Invite code creation failed:', error);
      setInviteCodeError(error.message || 'Could not create an invite code. Please try again.');
    } finally {
      setCreatingInviteCode(false);
    }
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (roomCodeInput.trim()) {
      navigate(`/room/${roomCodeInput.trim().toUpperCase()}`);
    }
  };

  const handleCopyRoomCode = async (roomId) => {
    setCopyErrorRoomCode('');
    try {
      await copyToClipboard(roomId);
      setCopiedRoomCode(roomId);
      setTimeout(() => {
        setCopiedRoomCode(current => current === roomId ? '' : current);
      }, 2000);
    } catch (error) {
      console.error('Room code copy failed:', error);
      setCopyErrorRoomCode(roomId);
    }
  };

  const handleDeleteRoom = async (room) => {
    if (deletingRoomId) return;
    if (!window.confirm(`Delete "${room.name}"? This will remove the room and its queue.`)) return;

    setDeleteRoomError(null);
    setDeletingRoomId(room.roomId);
    try {
      const res = await api.deleteRoom(room.roomId);
      if (!res.success) throw new Error(res.message || 'Could not delete this room.');
      setRooms(current => current.filter(existingRoom => existingRoom.roomId !== room.roomId));
      setCreatedInvite(current => current?.roomId === room.roomId ? null : current);
    } catch (error) {
      console.error('Room deletion failed:', error);
      setDeleteRoomError({
        roomId: room.roomId,
        message: error.message || 'Could not delete this room.'
      });
    } finally {
      setDeletingRoomId('');
    }
  };

  const handleStartSolo = async () => {
    if (creatingSolo) return;
    setSoloRoomError('');
    if (!user || !token) {
      navigate('/login', { state: { from: { pathname: '/dashboard' } }, replace: true });
      return;
    }
    setCreatingSolo(true);
    try {
      const displayName = user?.displayName || user?.username || 'My';
      const res = await api.createRoom({
        name: `${displayName}'s Solo Session`,
        description: 'Private personal listening session',
        mode: 'solo',
        personality: newRoomPersonality
      });
      if (res.success && res.room) {
        navigate(`/room/${res.room.roomId}`);
      } else {
        setSoloRoomError(res.message || 'Could not start your solo session.');
      }
    } catch (err) {
      console.error('Solo session creation failed:', err);
      setSoloRoomError(err.message || 'Unable to connect to the server.');
    } finally {
      setCreatingSolo(false);
    }
  };

  const PERSONALITIES = [
    { id: 'party', name: 'Party DJ', emoji: '🎉', desc: 'High energy & dance' },
    { id: 'chill', name: 'Chill DJ', emoji: '☕', desc: 'Lo-fi & relaxation' },
    { id: 'retro', name: 'Retro DJ', emoji: '📻', desc: 'Vintage & classic rock' },
    { id: 'romantic', name: 'Romantic DJ', emoji: '🌹', desc: 'Acoustic ballads' },
    { id: 'workout', name: 'Workout DJ', emoji: '⚡', desc: 'Peak stamina & driving bass' },
    { id: 'explorer', name: 'Explorer DJ', emoji: '🧭', desc: 'Kannada, Hindi & global' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/25 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-neon-purple text-xs font-semibold mb-3">
            <Sparkles size={13} />
            <span>AI DJ Resident Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome, {user?.displayName || user?.username || 'DJ Enthusiast'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Create a collaborative room with your friends or hop into an existing lounge. Our emotion-adaptive AI balances genres and manages transitions in real-time.
          </p>

          {/* User taste badge list */}
          {user?.preferredGenres && user.preferredGenres.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-4">
              <span className="text-xs text-slate-400 font-medium">Your Taste Profile:</span>
              {user.preferredGenres.map(g => (
                <span key={g} className="text-[11px] px-2.5 py-0.5 rounded-full bg-dark-900 border border-purple-500/30 text-purple-300 font-semibold">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick Room Actions */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:flex-wrap sm:justify-end items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleStartSolo}
            disabled={creatingSolo}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <Play size={16} />
            <span>{creatingSolo ? 'Starting Solo...' : 'Listen Solo'}</span>
          </button>
          <button
            onClick={openCreateRoom}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center space-x-2 transition-all"
          >
            <Plus size={16} />
            <span>Create Music Room</span>
          </button>
          <button
            type="button"
            onClick={handleCreateInviteCode}
            disabled={creatingInviteCode}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/30 text-cyan-200 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
          >
            <Plus size={15} />
            <span>{creatingInviteCode ? 'Generating Code...' : 'Create Code'}</span>
          </button>

          <form onSubmit={handleJoinByCode} className="w-full sm:w-auto flex items-center space-x-1.5">
            <input
              type="text"
              placeholder="Code (e.g. DJ-A4B7)"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              className="w-full sm:w-36 bg-dark-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple uppercase font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700"
            >
              Join
            </button>
          </form>
          {inviteCodeError && (
            <p role="alert" className="w-full text-xs text-red-300">{inviteCodeError}</p>
          )}
        </div>
        {soloRoomError && <p role="alert" className="relative z-10 text-xs text-red-400">{soloRoomError}</p>}
      </div>

      {createdInvite && (
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">Invite code created for {createdInvite.name}</p>
            <p className="text-xs text-slate-400 mt-1">Share this code. Friends can enter it in the Join field above.</p>
            {copyErrorRoomCode === createdInvite.roomId && (
              <p role="alert" className="mt-1 text-[11px] text-amber-300">Could not copy. Select the code and copy it manually.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <code className="rounded-lg border border-cyan-500/30 bg-dark-950 px-3 py-2 font-mono text-sm font-bold text-neon-cyan">
              {createdInvite.roomId}
            </code>
            <button
              type="button"
              onClick={() => handleCopyRoomCode(createdInvite.roomId)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-dark-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              {copiedRoomCode === createdInvite.roomId ? <Check size={14} className="text-neon-green" /> : <Copy size={14} />}
              {copiedRoomCode === createdInvite.roomId ? 'Copied' : 'Copy code'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/room/${createdInvite.roomId}`)}
              className="inline-flex items-center gap-1 rounded-lg bg-neon-purple/20 px-3 py-2 text-xs font-semibold text-neon-purple border border-purple-500/30 hover:bg-neon-purple hover:text-white"
            >
              Enter room
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Active Music Rooms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Radio size={18} className="text-neon-cyan" />
            <h2 className="text-lg font-bold text-white">Live Virtual Rooms</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{rooms.length} active lounges</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs animate-pulse">
            Scanning active music lounges...
          </div>
        ) : rooms.length === 0 ? (
          <div className="glass-panel p-10 rounded-2xl text-center border border-slate-800">
            <Disc3 size={36} className="text-purple-400 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-white">No active rooms right now</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Be the first to ignite the session!</p>
            <button
              onClick={openCreateRoom}
              className="px-4 py-2 bg-neon-purple text-white text-xs font-semibold rounded-lg"
            >
              Create Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map(room => (
              <div
                key={room.roomId}
                className="glass-card p-5 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-dark-950 text-neon-cyan border border-cyan-500/30">
                      {room.roomId}
                    </span>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                      <Users size={14} className="text-neon-pink" />
                      <span>{room.participantCount} online</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-neon-purple transition-colors">
                    {room.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {room.description}
                  </p>

                  {/* Current Track Pill */}
                  {room.currentTrack && (
                    <div className="mt-4 p-2.5 bg-dark-950/70 rounded-xl border border-slate-800 flex items-center space-x-2.5">
                      <img
                        src={room.currentTrack.artwork}
                        alt={room.currentTrack.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="truncate text-xs">
                        <span className="text-[10px] text-neon-cyan font-mono block">NOW PLAYING</span>
                        <h4 className="font-semibold text-white truncate">{room.currentTrack.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{room.currentTrack.artist}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 font-semibold capitalize">
                      {room.djPersonality} DJ
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      Mood: {room.dominantEmotion}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room)}
                      disabled={Boolean(deletingRoomId)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-950/40 text-red-300 hover:bg-red-900/70 text-xs font-semibold border border-red-500/30 transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1"
                      title={`Delete ${room.name}`}
                      aria-label={`Delete room ${room.name}`}
                    >
                      {deletingRoomId === room.roomId
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />}
                      <span>{deletingRoomId === room.roomId ? 'Deleting' : 'Delete'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyRoomCode(room.roomId)}
                      className="px-2.5 py-1.5 rounded-lg bg-dark-950 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1"
                      title={`Copy room code ${room.roomId}`}
                      aria-label={`Copy invite code ${room.roomId}`}
                    >
                      {copiedRoomCode === room.roomId ? <Check size={13} className="text-neon-green" /> : <Copy size={13} />}
                      <span>{copiedRoomCode === room.roomId ? 'Copied' : 'Copy code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/room/${room.roomId}`)}
                      className="px-3.5 py-1.5 rounded-lg bg-neon-purple/20 hover:bg-neon-purple text-neon-purple hover:text-white text-xs font-semibold border border-purple-500/30 transition-all flex items-center space-x-1"
                    >
                      <span>Enter</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
                {deleteRoomError?.roomId === room.roomId && (
                  <p role="alert" className="mt-2 text-[11px] text-red-300">
                    {deleteRoomError.message}
                  </p>
                )}
                {copyErrorRoomCode === room.roomId && (
                  <p role="alert" className="mt-2 text-[11px] text-amber-300">
                    Could not copy. Share the displayed code: {room.roomId}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Tracks Shelf */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Music size={18} className="text-neon-pink" />
            <h2 className="text-lg font-bold text-white">Multi-Genre Music Catalog Spotlight</h2>
          </div>
          <Link to="/recommendations" className="text-xs font-semibold text-neon-purple hover:underline flex items-center space-x-1">
            <span>Explore All Shelves</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {catalog.map(track => (
            <div
              key={track.id}
              className="glass-card p-3 rounded-xl border border-slate-800 hover:border-purple-500/30 transition-all group"
            >
              <img
                src={track.artwork}
                alt={track.title}
                className="w-full aspect-square object-cover rounded-lg mb-2 group-hover:scale-102 transition-transform"
              />
              <h4 className="font-semibold text-xs text-white truncate">{track.title}</h4>
              <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800 text-[10px]">
                <span className="text-purple-300 font-mono">{track.genre}</span>
                <span className="text-slate-400 font-mono">{track.bpm} BPM</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-purple-500/30">
            <h3 className="text-lg font-bold text-white mb-1">Create Virtual Collaborative Room</h3>
            <p className="text-xs text-slate-400 mb-4">
              Set your room identity and select an AI DJ personality archetype
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangalore Synthwave Lounge"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Chill EDM & Kannada fusion with real-time voting"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-purple"
                />
              </div>

              {/* Personality Archetype Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select AI DJ Personality Archetype
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PERSONALITIES.map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setNewRoomPersonality(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        newRoomPersonality === p.id
                          ? 'bg-purple-900/30 border-neon-purple ring-1 ring-neon-purple'
                          : 'bg-dark-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">{p.emoji}</span>
                        <span className="text-xs font-bold text-white">{p.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-dark-950/50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-white">
                    {PERSONALITY_YOUTUBE_SEARCHES[newRoomPersonality]?.label || 'Party DJ'} songs on YouTube
                  </p>
                  <a
                    href={getPersonalityYouTubeSearchUrl(newRoomPersonality)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-shrink-0 items-center gap-1 text-[11px] font-semibold text-red-300 hover:underline"
                  >
                    Browse all
                    <ExternalLink size={12} />
                  </a>
                </div>
                {youtubeSearchError && (
                  <p role="alert" className="mb-2 text-[11px] text-amber-200">
                    {youtubeSearchError}
                  </p>
                )}
                {loadingYoutube ? (
                  <div className="flex items-center gap-2 py-3 text-[11px] text-slate-400">
                    <Loader2 size={13} className="animate-spin" />
                    Finding matching songs...
                  </div>
                ) : youtubeVideos.length ? (
                  <div className="space-y-2">
                    {youtubeVideos.map(video => (
                      <a
                        key={video.videoId}
                        href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-800/60"
                      >
                        <img
                          src={video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                          alt=""
                          className="h-9 w-16 flex-shrink-0 rounded object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-semibold text-white">{video.title}</span>
                          <span className="block truncate text-[10px] text-slate-400">{video.channelTitle}</span>
                        </span>
                        <ExternalLink size={12} className="flex-shrink-0 text-red-300" />
                      </a>
                    ))}
                  </div>
                ) : !youtubeSearchError ? (
                  <p className="py-2 text-[11px] text-slate-400">No matching videos found.</p>
                ) : null}
              </div>

              {createRoomError && (
                <p role="alert" className="text-xs text-red-400">
                  {createRoomError}
                  {createRoomError.toLowerCase().includes('auth') && (
                    <>
                      {' '}
                      <Link
                        to="/login"
                        state={{ from: { pathname: '/dashboard' } }}
                        className="font-semibold underline"
                      >
                        Sign in
                      </Link>
                    </>
                  )}
                </p>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateRoomError('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20"
                >
                  {creating ? 'Building Room...' : 'Launch Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
