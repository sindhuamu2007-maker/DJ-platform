import React, { useState, useEffect } from 'react';
import {
  Sparkles, Disc3, Sliders, Zap, Scale, Heart, RefreshCw, CheckCircle2,
  Volume2, FastForward, Activity, Music2, ExternalLink, Loader2
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { api } from '../services/api';
import {
  getPersonalityYouTubeSearchUrl,
  getPersonalityYouTubeSearchQuery,
  YOUTUBE_SEARCH_LANGUAGES,
  PERSONALITY_YOUTUBE_SEARCHES
} from '../utils/djPersonalitySearch';

export const AIDJDashboardPage = () => {
  const { currentRoom, currentTrack, queue, addToQueue, djSettings, updateDJSettings, groupMood, lastTransition, conflictResolution, triggerConflictResolution } = useRoom();

  const [personalities, setPersonalities] = useState([]);
  const [selectedPersonality, setSelectedPersonality] = useState(djSettings?.personality || 'party');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [autoTransition, setAutoTransition] = useState(djSettings?.autoTransition ?? true);
  const [transitionDuration, setTransitionDuration] = useState(djSettings?.transitionDuration || 6);
  const [energyPreference, setEnergyPreference] = useState(djSettings?.energyPreference || 0.8);
  const [autoQueueFromMood, setAutoQueueFromMood] = useState(djSettings?.autoQueueFromMood ?? true);
  const [nextDecision, setNextDecision] = useState(null);
  const [loadingDecision, setLoadingDecision] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubePageToken, setYoutubePageToken] = useState(null);
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  const [loadingMoreYoutube, setLoadingMoreYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');
  const [youtubeQueueError, setYoutubeQueueError] = useState('');
  const [queueingVideoId, setQueueingVideoId] = useState('');
  const [queuedVideoId, setQueuedVideoId] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);
  const selectedSearch = PERSONALITY_YOUTUBE_SEARCHES[selectedPersonality] || PERSONALITY_YOUTUBE_SEARCHES.party;
  const selectedSearchQuery = getPersonalityYouTubeSearchQuery(selectedPersonality, selectedLanguage);
  const selectedProfile = personalities.find(personality => personality.id === selectedPersonality);

  useEffect(() => {
    api.getPersonalities().then(res => {
      if (res.success) setPersonalities(res.personalities);
    });
  }, []);

  useEffect(() => {
    let active = true;
    setYoutubeVideos([]);
    setYoutubePageToken(null);
    setYoutubeError('');
    setLoadingYoutube(true);

    api.searchYouTube(selectedSearchQuery, {
      limit: 25,
      ...(selectedLanguage ? { relevanceLanguage: selectedLanguage } : {})
    }).then(res => {
      if (!active) return;
      if (!res.success) {
        setYoutubeError(res.message || 'YouTube search is unavailable.');
        return;
      }
      setYoutubeVideos(res.videos || []);
      setYoutubePageToken(res.nextPageToken || null);
    }).catch(err => {
      if (active) setYoutubeError(err.message || 'YouTube search is unavailable.');
    }).finally(() => {
      if (active) setLoadingYoutube(false);
    });

    return () => {
      active = false;
    };
  }, [selectedPersonality, selectedLanguage, selectedSearchQuery]);

  useEffect(() => {
    if (currentRoom) {
      setLoadingDecision(true);
      api.getNextTrack(currentRoom.roomId).then(res => {
        if (res.success) setNextDecision(res.decision);
      }).finally(() => setLoadingDecision(false));
    }
  }, [currentRoom, selectedPersonality]);

  const handleLoadMoreYouTube = async () => {
    if (!youtubePageToken || loadingMoreYoutube) return;
    setLoadingMoreYoutube(true);
    setYoutubeError('');
    try {
      const res = await api.searchYouTube(selectedSearchQuery, {
        limit: 25,
        pageToken: youtubePageToken,
        ...(selectedLanguage ? { relevanceLanguage: selectedLanguage } : {})
      });
      if (!res.success) {
        setYoutubeError(res.message || 'Could not load more YouTube results.');
        return;
      }
      setYoutubeVideos(previous => {
        const existingIds = new Set(previous.map(video => video.videoId));
        return [...previous, ...(res.videos || []).filter(video => !existingIds.has(video.videoId))];
      });
      setYoutubePageToken(res.nextPageToken || null);
    } catch (err) {
      setYoutubeError(err.message || 'Could not load more YouTube results.');
    } finally {
      setLoadingMoreYoutube(false);
    }
  };

  const handleQueueYouTubeVideo = async (video) => {
    if (!currentRoom || queueingVideoId) return;
    setYoutubeQueueError('');
    setQueuedVideoId('');
    setQueueingVideoId(video.videoId);

    const result = await addToQueue({
      id: `youtube-${video.videoId}`,
      youtubeVideoId: video.videoId,
      provider: 'youtube',
      title: video.title,
      artist: video.channelTitle,
      album: 'YouTube',
      artwork: video.thumbnail,
      genre: selectedSearch.label,
      trackViewUrl: `https://www.youtube.com/watch?v=${video.videoId}`
    });

    if (result.success) setQueuedVideoId(video.videoId);
    else setYoutubeQueueError(result.message || 'Could not add this video to the queue.');
    setQueueingVideoId('');
  };

  const handleSaveSettings = async () => {
    await updateDJSettings({
      personality: selectedPersonality,
      autoTransition,
      transitionDuration: Number(transitionDuration),
      energyPreference: Number(energyPreference),
      autoQueueFromMood
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-neon-cyan/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-neon-cyan text-xs font-semibold mb-2">
            <Sparkles size={14} />
            <span>Autonomous Intelligence & Transition Controller</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI DJ Control Console</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Configure DJ personalities, harmonic crossfading parameters, and taste conflict resolution
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all flex items-center space-x-1.5"
        >
          {savedFeedback ? <CheckCircle2 size={16} /> : <Sliders size={16} />}
          <span>{savedFeedback ? 'Settings Synced!' : 'Sync AI DJ Settings'}</span>
        </button>
      </div>

      {/* Grid: 6 Personalities Selector */}
      <div>
        <h2 className="text-base font-bold text-white mb-3 flex items-center space-x-2">
          <span>AI DJ Personality Archetype</span>
          <span className="text-xs text-slate-400 font-normal">(Determines pacing & mood target)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {personalities.map(p => {
            const isSelected = selectedPersonality === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersonality(p.id)}
                className={`glass-card p-4 rounded-2xl text-left border transition-all ${
                  isSelected
                    ? 'border-neon-purple ring-2 ring-purple-500/50 bg-purple-950/40 shadow-lg shadow-purple-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-3xl mb-2">{p.avatar}</div>
                <h4 className="font-bold text-xs text-white">{p.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-2">{p.tagline}</p>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-purple-300 font-mono">⚡ {Math.round(p.target_energy * 100)}%</span>
                  {isSelected && <span className="text-neon-cyan font-bold">Active</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <section className="glass-panel p-5 sm:p-6 rounded-2xl border border-red-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Music2 size={17} className="text-red-400" />
              {selectedProfile?.name || selectedSearch.label} songs on YouTube
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Choose a DJ style, add a video to the room queue, and play it with YouTube’s official player.
            </p>
          </div>
          <a
            href={getPersonalityYouTubeSearchUrl(selectedPersonality, selectedLanguage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-900/50"
          >
            Search on YouTube
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="youtube-song-language" className="text-xs font-semibold text-slate-300">
            Song language
          </label>
          <select
            id="youtube-song-language"
            value={selectedLanguage}
            onChange={(event) => setSelectedLanguage(event.target.value)}
            className="w-full sm:w-56 rounded-lg border border-slate-700 bg-dark-950 px-3 py-2 text-xs text-white focus:border-neon-cyan focus:outline-none"
          >
            {YOUTUBE_SEARCH_LANGUAGES.map(language => (
              <option key={language.code || 'any'} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400">
            Results combine the selected language with the {selectedSearch.label} mood.
          </span>
        </div>

        {youtubeError && (
          <p role="alert" className="mb-3 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-200">
            {youtubeError}
          </p>
        )}
        {youtubeQueueError && (
          <p role="alert" className="mb-3 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-200">
            {youtubeQueueError}
          </p>
        )}

        {loadingYoutube ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
            <Loader2 size={15} className="animate-spin" />
            Finding videos for this DJ style...
          </div>
        ) : youtubeVideos.length ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {youtubeVideos.map(video => {
                const isQueued = queuedVideoId === video.videoId ||
                  currentTrack?.youtubeVideoId === video.videoId ||
                  (queue || []).some(track => track.youtubeVideoId === video.videoId);
                const isQueueing = queueingVideoId === video.videoId;
                return (
                  <div
                    key={video.videoId}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-dark-950/60 p-2.5 hover:border-red-500/40"
                  >
                    <a
                      href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <img
                        src={video.thumbnail}
                        alt=""
                        className="h-12 w-20 flex-shrink-0 rounded-lg object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-white">{video.title}</span>
                        <span className="block truncate text-[11px] text-slate-400">{video.channelTitle}</span>
                      </span>
                      <ExternalLink size={14} className="flex-shrink-0 text-red-300" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleQueueYouTubeVideo(video)}
                      disabled={!currentRoom || isQueued || Boolean(queueingVideoId)}
                      title={!currentRoom ? 'Join a room to add videos to its queue' : undefined}
                      className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-red-600/90 px-2.5 py-2 text-[11px] font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isQueueing ? <Loader2 size={13} className="animate-spin" /> : isQueued ? <CheckCircle2 size={13} /> : <Plus size={13} />}
                      <span>{isQueueing ? 'Adding' : isQueued ? 'Queued' : 'Queue'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
            {youtubePageToken && (
              <button
                onClick={handleLoadMoreYouTube}
                disabled={loadingMoreYoutube}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                {loadingMoreYoutube && <Loader2 size={14} className="animate-spin" />}
                {loadingMoreYoutube ? 'Loading...' : 'Load more videos'}
              </button>
            )}
          </>
        ) : !youtubeError ? (
          <p className="py-6 text-center text-xs text-slate-400">No matching YouTube videos found.</p>
        ) : null}
      </section>

      {/* Transition & Energy Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls Card */}
        <div className="glass-panel p-6 rounded-2xl border border-purple-500/20 space-y-5">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Sliders size={16} className="text-neon-purple" />
            <span>Harmonic Mixing & Transition Controls</span>
          </h3>

          <div>
            <div className="flex justify-between text-xs mb-1.5 font-semibold">
              <span className="text-slate-300">Web Audio Crossfade Duration</span>
              <span className="text-neon-cyan font-mono">{transitionDuration} Seconds</span>
            </div>
            <input
              type="range"
              min="2"
              max="14"
              step="0.5"
              value={transitionDuration}
              onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
              className="w-full accent-neon-cyan cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Controls the linear ramp time between Deck A and Deck B gain nodes on track completion.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5 font-semibold">
              <span className="text-slate-300">Target Energy Level Preference</span>
              <span className="text-neon-pink font-mono">{Math.round(energyPreference * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={energyPreference}
              onChange={(e) => setEnergyPreference(parseFloat(e.target.value))}
              className="w-full accent-neon-pink cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Influences the AI recommendation algorithm's energy congruency filter.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={autoTransition}
                onChange={(e) => setAutoTransition(e.target.checked)}
                className="rounded accent-neon-purple w-4 h-4"
              />
              <span className="font-semibold">Automatic Next-Track Crossfade</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={autoQueueFromMood}
                onChange={(e) => setAutoQueueFromMood(e.target.checked)}
                className="rounded accent-neon-purple w-4 h-4"
              />
              <span className="font-semibold">Emotion-Adaptive Auto-Queueing (when queue is empty)</span>
            </label>
          </div>
        </div>

        {/* AI Next Decision Preview */}
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Activity size={16} className="text-neon-cyan" />
                <span>Next Autonomous Track Decision</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-neon-cyan font-mono">
                {nextDecision?.source === 'queue' ? 'From Live Queue' : 'AI Algorithm Pick'}
              </span>
            </div>

            {loadingDecision ? (
              <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
                Evaluating candidate tracks and harmonic distance...
              </div>
            ) : nextDecision && nextDecision.selected_track ? (
              <div className="space-y-4">
                <div className="p-3 bg-dark-950/70 rounded-xl border border-slate-800 flex items-center space-x-3">
                  <img
                    src={nextDecision.selected_track.artwork}
                    alt={nextDecision.selected_track.title}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="text-xs truncate">
                    <h4 className="font-bold text-white text-sm truncate">{nextDecision.selected_track.title}</h4>
                    <p className="text-slate-400 truncate">{nextDecision.selected_track.artist}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/50 text-purple-300 font-mono">
                        {nextDecision.selected_track.genre}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {nextDecision.selected_track.bpm} BPM
                      </span>
                      <span className="text-[10px] text-neon-cyan font-mono">
                        Key {nextDecision.selected_track.key}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Explanation Callout */}
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-500/30 text-xs text-slate-200">
                  <span className="font-bold text-neon-purple block mb-1">Algorithmic Reasoning:</span>
                  <p className="leading-relaxed text-slate-300 text-[11px]">{nextDecision.explanation}</p>
                </div>

                {/* Harmonic Transition Analysis */}
                {nextDecision.transition && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-dark-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Transition Technique</span>
                      <span className="font-bold text-white">{nextDecision.transition.transition_type}</span>
                    </div>
                    <div className="p-2.5 bg-dark-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Compatibility Score</span>
                      <span className="font-bold text-neon-green">{nextDecision.transition.compatibility_score}% Match</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No active room connected. Join or create a room to see live decisions.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={triggerConflictResolution}
              className="px-3 py-1.5 bg-dark-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs font-semibold flex items-center space-x-1"
            >
              <RefreshCw size={13} />
              <span>Recalculate Group Balance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
