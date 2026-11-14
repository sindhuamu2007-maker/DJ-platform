import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Play, Pause, SkipForward, Volume2, Disc3, Plus, Trash2, Send,
  Users, Share2, Swords, Mic, MessageSquare, BarChart2,
  Heart, Flame, Zap, Coffee, Moon, ThumbsDown, Copy, Check, ExternalLink
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { MoodIndicator } from '../components/MoodIndicator';
import { SoundclashArena } from '../components/SoundclashArena';
import { ConflictResolutionBanner } from '../components/ConflictResolutionBanner';
import { TrackSearchModal } from '../components/TrackSearchModal';
import { VoiceControlModal } from '../components/VoiceControlModal';
import { YouTubeTrackPlayer } from '../components/YouTubeTrackPlayer';
import { getFullSongSearchUrl } from '../utils/musicLinks';
import { api } from '../services/api';

export const MusicRoomPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const {
    currentRoom, currentTrack, queue, participants, messages,
    isPlaying, currentTime, duration, seekVersion, playbackError, groupMood, djSettings,
    joinRoom, play, pause, seek, skipNext, removeFromQueue,
    sendMessage, sendReaction, registerYouTubePlayer, updatePlaybackProgress,
    updatePlaybackDuration, setPlaybackError
  } = useRoom();

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'chat' | 'mood' | 'clash'
  const [chatInput, setChatInput] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showClashModal, setShowClashModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [volume, setVolume] = useState(0.85);

  // New Soundclash Modal state
  const [clashCatalog, setClashCatalog] = useState([]);
  const [clashSongA, setClashSongA] = useState('');
  const [clashSongB, setClashSongB] = useState('');

  useEffect(() => {
    if (id) {
      joinRoom(id);
    }
  }, [id]);

  useEffect(() => {
    // Fetch catalog for clash battle creator
    api.getCatalog().then(res => {
      if (res.success) {
        setClashCatalog(res.tracks);
        if (res.tracks.length >= 2) {
          setClashSongA(res.tracks[0].id);
          setClashSongB(res.tracks[1].id);
        }
      }
    });
  }, []);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  const handleStartSoundclash = async (e) => {
    e.preventDefault();
    if (clashSongA && clashSongB && clashSongA !== clashSongB && currentRoom) {
      try {
        await api.createBattle(currentRoom.roomId, clashSongA, clashSongB);
        setShowClashModal(false);
        setActiveTab('clash');
      } catch (err) {
        console.error('Failed to create clash:', err);
      }
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const REACTIONS = [
    { emoji: '❤️', type: 'love', label: 'Love' },
    { emoji: '🔥', type: 'fire', label: 'Fire' },
    { emoji: '⚡', type: 'energy', label: 'Hype' },
    { emoji: '💃', type: 'dance', label: 'Dance' },
    { emoji: '☕', type: 'chill', label: 'Chill' },
    { emoji: '😴', type: 'sleep', label: 'Sleepy' },
    { emoji: '💔', type: 'sad', label: 'Sad' },
    { emoji: '👎', type: 'skip', label: 'Skip' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Room Top Header Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-purple-500/25 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-xl text-white shadow-md shadow-purple-500/25">
            <Disc3 size={24} className={isPlaying ? 'animate-spin-slow' : ''} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white">{currentRoom?.name || 'Collaborative DJ Room'}</h1>
              <button
                onClick={handleCopyInvite}
                className="px-2 py-0.5 rounded-md bg-dark-950 text-neon-cyan border border-cyan-500/30 text-xs font-mono font-bold flex items-center space-x-1 hover:bg-cyan-950/40 transition-all"
                title="Click to copy invite code"
              >
                <span>{currentRoom?.roomId || id}</span>
                {copiedLink ? <Check size={12} className="text-neon-green" /> : <Copy size={12} />}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Host: <span className="text-purple-300 font-semibold">{currentRoom?.host?.displayName || currentRoom?.host?.username || 'Host'}</span>
              <span className="mx-2">•</span>
              DJ Personality: <span className="text-neon-pink font-semibold capitalize">{djSettings.personality}</span>
            </p>
          </div>
        </div>

        {/* Room Participants & Mood Header Pills */}
        <div className="flex items-center space-x-3">
          <MoodIndicator mood={groupMood} compact={true} />

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-dark-900 border border-slate-700 text-xs text-slate-300">
            <Users size={13} className="text-neon-pink" />
            <span className="font-semibold">{participants.length}</span>
            <span className="text-slate-400">active</span>
          </div>

          <button
            onClick={() => setShowVoiceModal(true)}
            className="p-2 bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 text-white rounded-xl shadow-md shadow-purple-500/25 transition-all"
            title="Voice-Controlled AI DJ"
          >
            <Mic size={17} />
          </button>
        </div>
      </div>

      {/* AI Conflict Resolution Notification Banner */}
      <ConflictResolutionBanner />

      {/* Flagship DJ Deck Player Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dual Deck Visualizer & Player (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 relative overflow-hidden">
            {/* Spinning Vinyl / Artwork */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
              <div className="relative group flex-shrink-0">
                <div className={`w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-purple-500/40 relative ${isPlaying ? 'ring-4 ring-purple-500/20' : ''}`}>
                  <img
                    src={currentTrack?.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
                    alt={currentTrack?.title}
                    className="w-full h-full object-cover"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                      <div className="w-2 h-2 rounded-full bg-neon-green animate-ping mr-2" />
                      <span className="text-[10px] font-mono text-neon-green font-bold">ON AIR</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Track Metadata & Badges */}
              <div className="flex-1 text-center sm:text-left truncate w-full">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 font-mono font-bold uppercase">
                    {currentTrack?.genre || 'Pop'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 font-mono">
                    {currentTrack?.bpm || 120} BPM
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-pink-900/40 text-pink-300 font-mono">
                    Key: {currentTrack?.key || '8B'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                  {currentTrack?.title || 'Select a Song'}
                </h2>
                <p className="text-sm text-slate-300 font-medium truncate">
                  {currentTrack?.artist || 'No track currently active'}
                </p>

                {currentTrack && (
                  <a
                    href={getFullSongSearchUrl(currentTrack)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 mt-2 text-xs font-semibold text-neon-cyan hover:text-white transition-colors"
                  >
                    <ExternalLink size={14} />
                    <span>Find full song on YouTube Music</span>
                  </a>
                )}

                {currentTrack?.addedBy && (
                  <p className="text-[11px] text-slate-400 mt-2">
                    Queued by: <span className="text-neon-cyan font-semibold">{currentTrack.addedBy.displayName || currentTrack.addedBy.username}</span>
                  </p>
                )}

              </div>
            </div>

            {currentTrack && (
              <div className="mb-4 overflow-hidden rounded-xl border border-slate-800 bg-black aspect-video min-h-[200px]">
                {currentTrack.youtubeVideoId ? (
                  <YouTubeTrackPlayer
                    videoId={currentTrack.youtubeVideoId}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    seekVersion={seekVersion}
                    volume={volume}
                    onProgress={updatePlaybackProgress}
                    onDuration={updatePlaybackDuration}
                    onEnded={skipNext}
                    onError={setPlaybackError}
                    onReady={registerYouTubePlayer}
                  />
                ) : (
                  <div className="h-full min-h-[200px] flex items-center justify-center p-4 text-center text-xs text-slate-300">
                    {playbackError || 'Finding a full-length version on YouTube…'}
                  </div>
                )}
              </div>
            )}

            {playbackError && currentTrack?.youtubeVideoId && (
              <p className="mb-3 text-xs text-amber-300">{playbackError}</p>
            )}

            <div className="mb-4 rounded-xl border border-slate-800 bg-dark-950/60 p-3 text-center text-[11px] text-slate-500">
              Spectrum analysis and crossfades are unavailable for embedded YouTube playback.
            </div>

            {/* Progress Bar & Timers */}
            <div className="space-y-1 mb-4">
              <input
                type="range"
                min="0"
                max={duration || 180}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full accent-neon-purple cursor-pointer h-1.5 bg-dark-950 rounded-lg"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Player Controls Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {/* Play / Pause / Skip */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={isPlaying ? pause : play}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>

                <button
                  onClick={skipNext}
                  className="p-2.5 rounded-full bg-dark-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all"
                  title="Skip to next track (Triggers AI DJ transition)"
                >
                  <SkipForward size={18} />
                </button>
              </div>

              <div className="hidden sm:block text-[10px] text-slate-500">
                YouTube · full track
              </div>

              {/* Master Volume */}
              <div className="flex items-center space-x-2">
                <Volume2 size={16} className="text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-neon-cyan cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Quick Reaction Pills */}
          <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline ml-1">React to Beat:</span>
            <div className="flex items-center space-x-1.5 flex-1 justify-around">
              {REACTIONS.map(r => (
                <button
                  key={r.type}
                  onClick={() => sendReaction(r.emoji, r.type)}
                  className="p-2 rounded-xl bg-dark-900 hover:bg-purple-600/30 border border-slate-800 hover:border-purple-500/50 text-lg transition-all hover:scale-125"
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Dynamic Tabs Section (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Tabs Navigation Header */}
          <div className="flex rounded-xl bg-dark-900 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
                activeTab === 'queue' ? 'bg-neon-purple text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Disc3 size={14} />
              <span>Queue ({queue.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
                activeTab === 'chat' ? 'bg-neon-purple text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              <span>Chat ({messages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('mood')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
                activeTab === 'mood' ? 'bg-neon-purple text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 size={14} />
              <span>Mood</span>
            </button>

            <button
              onClick={() => setActiveTab('clash')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
                activeTab === 'clash' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords size={14} />
              <span>Clash</span>
            </button>
          </div>

          {/* TAB 1: Collaborative Music Queue */}
          {activeTab === 'queue' && (
            <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 flex-1 flex flex-col min-h-[420px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Upcoming Queue</span>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="px-3 py-1 bg-neon-purple hover:bg-purple-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 shadow-md shadow-purple-500/20 transition-all"
                >
                  <Plus size={14} />
                  <span>Add Song</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {queue.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs">
                    <Disc3 size={32} className="mx-auto mb-2 opacity-40 text-purple-400" />
                    <p className="font-semibold text-white">Queue is empty</p>
                    <p className="text-[11px] mt-0.5">AI DJ will automatically curate next song based on room mood!</p>
                  </div>
                ) : (
                  queue.map((track, idx) => (
                    <div
                      key={track.id || idx}
                      className="p-2.5 bg-dark-900/70 hover:bg-dark-900 rounded-xl border border-slate-800 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <span className="text-xs font-mono font-bold text-slate-500 w-4">{idx + 1}</span>
                        <img src={track.artwork} alt={track.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="truncate text-xs">
                          <h4 className="font-semibold text-white truncate">{track.title}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                          <span className="text-[10px] text-purple-300 font-mono">{track.genre} • {track.bpm || 120} BPM</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          {formatTime(track.duration || 180)}
                        </span>
                        <button
                          onClick={() => removeFromQueue(track.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Remove from queue"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Real-time Live Chat with NLP Sentiment & Emotion */}
          {activeTab === 'chat' && (
            <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 flex-1 flex flex-col min-h-[420px]">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Room Chat & Sentiment</span>
                <span className="text-[10px] text-neon-cyan">Real-time NLP Active</span>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    Drop a message to influence the AI DJ's vibe!
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className="p-2.5 rounded-xl bg-dark-900/80 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5">
                          <img
                            src={msg.sender?.profilePic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={msg.sender?.username}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="font-semibold text-purple-300">{msg.sender?.displayName || msg.sender?.username}</span>
                        </div>
                        {msg.dominantEmotion && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/40 text-purple-300 capitalize font-medium">
                            {msg.dominantEmotion}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 mt-1 leading-relaxed">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Send Message Form */}
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Drop a chat... (e.g. 'This drop is fire! 🔥')"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-dark-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple"
                />
                <button
                  type="submit"
                  className="p-2 bg-neon-purple hover:bg-purple-600 text-white rounded-xl shadow-md transition-all"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Collective Group Mood Dashboard */}
          {activeTab === 'mood' && (
            <div className="flex-1 flex flex-col space-y-4">
              <MoodIndicator mood={groupMood} compact={false} />
            </div>
          )}

          {/* TAB 4: Soundclash Battle Arena */}
          {activeTab === 'clash' && (
            <div className="flex-1 flex flex-col space-y-4">
              <SoundclashArena onOpenCreateModal={() => setShowClashModal(true)} />
            </div>
          )}
        </div>
      </div>

      {/* Track Search Modal */}
      <TrackSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      {/* Voice Control Modal */}
      <VoiceControlModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />

      {/* Soundclash Create Battle Modal */}
      {showClashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-pink-500/30">
            <h3 className="text-lg font-bold text-white mb-1">Create Soundclash Battle</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select two competing tracks for real-time room voting and AI victory prediction
            </p>

            <form onSubmit={handleStartSoundclash} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-pink-400 mb-1">Song A (Contender 1)</label>
                <select
                  value={clashSongA}
                  onChange={(e) => setClashSongA(e.target.value)}
                  className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  {clashCatalog.map(t => (
                    <option key={t.id} value={t.id}>{t.title} - {t.artist} ({t.genre})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-400 mb-1">Song B (Contender 2)</label>
                <select
                  value={clashSongB}
                  onChange={(e) => setClashSongB(e.target.value)}
                  className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {clashCatalog.map(t => (
                    <option key={t.id} value={t.id}>{t.title} - {t.artist} ({t.genre})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowClashModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25"
                >
                  Ignite Battle!
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
