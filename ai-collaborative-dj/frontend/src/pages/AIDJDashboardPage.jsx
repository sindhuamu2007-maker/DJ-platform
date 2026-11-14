import React, { useState, useEffect } from 'react';
import {
  Sparkles, Disc3, Sliders, Zap, Scale, Heart, RefreshCw, CheckCircle2,
  Volume2, FastForward, Activity, Music2, Plus, Loader2
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { api } from '../services/api';

const PERSONALITY_SONG_CATEGORIES = {
  party: { query: 'party dance hits EDM pop', genre: 'EDM' },
  chill: { query: 'chill lo-fi acoustic relaxing songs', genre: 'Lo-fi' },
  retro: { query: 'retro disco 80s 90s classic hits', genre: 'Pop' },
  romantic: { query: 'romantic love songs acoustic ballads', genre: 'Acoustic' },
  workout: { query: 'workout music high energy EDM rock', genre: 'EDM' },
  explorer: { query: 'world music global regional fusion songs', genre: 'World Music' }
};

export const AIDJDashboardPage = () => {
  const { currentRoom, djSettings, updateDJSettings, triggerConflictResolution, addToQueue } = useRoom();

  const [personalities, setPersonalities] = useState([]);
  const [selectedPersonality, setSelectedPersonality] = useState(djSettings?.personality || 'party');
  const [autoTransition, setAutoTransition] = useState(djSettings?.autoTransition ?? true);
  const [transitionDuration, setTransitionDuration] = useState(djSettings?.transitionDuration || 6);
  const [energyPreference, setEnergyPreference] = useState(djSettings?.energyPreference || 0.8);
  const [autoQueueFromMood, setAutoQueueFromMood] = useState(djSettings?.autoQueueFromMood ?? true);
  const [nextDecision, setNextDecision] = useState(null);
  const [loadingDecision, setLoadingDecision] = useState(false);
  const [personalitySongs, setPersonalitySongs] = useState([]);
  const [songsPageToken, setSongsPageToken] = useState(null);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingMoreSongs, setLoadingMoreSongs] = useState(false);
  const [songsError, setSongsError] = useState('');
  const [queueingVideoId, setQueueingVideoId] = useState('');
  const [queueError, setQueueError] = useState('');
  const [queuedVideoIds, setQueuedVideoIds] = useState(() => new Set());
  const [decisionError, setDecisionError] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);
  const selectedProfile = personalities.find(personality => personality.id === selectedPersonality);

  useEffect(() => {
    api.getPersonalities().then(res => {
      if (res.success) setPersonalities(res.personalities);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const category = PERSONALITY_SONG_CATEGORIES[selectedPersonality] || PERSONALITY_SONG_CATEGORIES.party;
    setPersonalitySongs([]);
    setSongsPageToken(null);
    setSongsError('');
    setLoadingSongs(true);

    api.searchYouTube(category.query, { limit: 25 }).then(res => {
      if (cancelled) return;
      if (!res.success) {
        setSongsError(res.message || 'Could not load songs for this DJ style.');
        return;
      }
      setPersonalitySongs(res.videos || []);
      setSongsPageToken(res.nextPageToken || null);
    }).catch(err => {
      if (!cancelled) setSongsError(err.message || 'Could not load songs for this DJ style.');
    }).finally(() => {
      if (!cancelled) setLoadingSongs(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedPersonality]);

  useEffect(() => {
    let cancelled = false;
    if (!currentRoom) {
      setNextDecision(null);
      setDecisionError('');
      setLoadingDecision(false);
      return undefined;
    }

    setLoadingDecision(true);
    setDecisionError('');
    api.getNextTrack(currentRoom.roomId, selectedPersonality).then(res => {
      if (cancelled) return;
      const decisionSucceeded = res.success && res.decision?.success !== false;
      setNextDecision(decisionSucceeded ? res.decision : null);
      if (!decisionSucceeded) {
        setDecisionError(res.message || res.decision?.error || 'Could not calculate the next track.');
      }
    }).catch(err => {
      if (cancelled) return;
      setNextDecision(null);
      setDecisionError(err.message || 'Could not calculate the next track.');
    }).finally(() => {
      if (!cancelled) setLoadingDecision(false);
    });

    return () => {
      cancelled = true;
    };
  }, [currentRoom, selectedPersonality]);

  const handleLoadMoreSongs = async () => {
    if (!songsPageToken || loadingMoreSongs) return;
    const category = PERSONALITY_SONG_CATEGORIES[selectedPersonality] || PERSONALITY_SONG_CATEGORIES.party;
    setLoadingMoreSongs(true);
    setSongsError('');
    try {
      const res = await api.searchYouTube(category.query, { limit: 25, pageToken: songsPageToken });
      if (!res.success) {
        setSongsError(res.message || 'Could not load more songs.');
        return;
      }
      setPersonalitySongs(previous => {
        const existingIds = new Set(previous.map(video => video.videoId));
        return [...previous, ...(res.videos || []).filter(video => !existingIds.has(video.videoId))];
      });
      setSongsPageToken(res.nextPageToken || null);
    } catch (err) {
      setSongsError(err.message || 'Could not load more songs.');
    } finally {
      setLoadingMoreSongs(false);
    }
  };

  const handleQueueSong = async (video) => {
    const category = PERSONALITY_SONG_CATEGORIES[selectedPersonality] || PERSONALITY_SONG_CATEGORIES.party;
    setQueueingVideoId(video.videoId);
    setQueueError('');
    const queued = await addToQueue({
      id: `youtube-${video.videoId}`,
      youtubeVideoId: video.videoId,
      title: video.title,
      artist: video.channelTitle,
      album: 'YouTube',
      duration: 180,
      artwork: video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
      genre: category.genre,
      energy: selectedProfile?.target_energy ?? 0.7
    });
    if (queued) {
      setQueuedVideoIds(previous => new Set([...previous, video.videoId]));
    } else {
      setQueueError('Could not add this song. Check that you are in an active room and try again.');
    }
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

      <section className="glass-panel p-5 sm:p-6 rounded-2xl border border-pink-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Music2 size={17} className="text-neon-pink" />
              Songs for {selectedProfile?.name || 'Party DJ'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a DJ style to load matching full-track YouTube results.
            </p>
          </div>
          <span className="text-[11px] text-slate-400">
            {personalitySongs.length} songs loaded
          </span>
        </div>

        {songsError && (
          <p role="alert" className="mb-3 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-200">
            {songsError}
          </p>
        )}
        {queueError && (
          <p role="alert" className="mb-3 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-200">
            {queueError}
          </p>
        )}
        {!currentRoom && (
          <p className="mb-3 text-xs text-amber-200">
            Join or create a room to add these songs to the shared queue.
          </p>
        )}

        {loadingSongs ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
            <Loader2 size={15} className="animate-spin" />
            Finding songs for this DJ style...
          </div>
        ) : personalitySongs.length ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {personalitySongs.map(video => (
                <div key={video.videoId} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-dark-950/60 p-2.5">
                  <img
                    src={video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                    alt=""
                    className="h-12 w-20 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{video.title}</p>
                    <p className="truncate text-[11px] text-slate-400">{video.channelTitle}</p>
                  </div>
                  <button
                    onClick={() => handleQueueSong(video)}
                    disabled={!currentRoom || queueingVideoId === video.videoId || queuedVideoIds.has(video.videoId)}
                    className="flex-shrink-0 rounded-lg border border-pink-500/30 bg-pink-950/40 p-2 text-pink-200 hover:bg-pink-900/60 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Add ${video.title} to queue`}
                    title={queuedVideoIds.has(video.videoId) ? 'Added to queue' : 'Add to queue'}
                  >
                    {queueingVideoId === video.videoId
                      ? <Loader2 size={15} className="animate-spin" />
                      : queuedVideoIds.has(video.videoId)
                        ? <CheckCircle2 size={15} />
                        : <Plus size={15} />}
                  </button>
                </div>
              ))}
            </div>
            {songsPageToken && (
              <button
                onClick={handleLoadMoreSongs}
                disabled={loadingMoreSongs}
                className="mt-4 flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                {loadingMoreSongs && <Loader2 size={14} className="animate-spin" />}
                {loadingMoreSongs ? 'Loading more songs...' : 'Load more songs'}
              </button>
            )}
          </>
        ) : !songsError ? (
          <p className="py-8 text-center text-xs text-slate-400">No matching songs were found for this DJ style.</p>
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
                {decisionError || 'No active room connected. Join or create a room to see live decisions.'}
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
