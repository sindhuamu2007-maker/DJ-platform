import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Check, Music, X, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { useRoom } from '../context/RoomContext';
import { getFullSongSearchUrl } from '../utils/musicLinks';

const GENRES = ['All', 'Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Pop', 'Rock', 'EDM', 'Lo-fi', 'Classical', 'Jazz', 'Hip-Hop'];

export const TrackSearchModal = ({ isOpen, onClose }) => {
  const { addToQueue, queue, currentTrack, playbackError, setPlaybackError } = useRoom();
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedMap, setAddedMap] = useState({});
  const [youtubeTracks, setYoutubeTracks] = useState([]);
  const [youtubeNextPageToken, setYoutubeNextPageToken] = useState(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [loadingMoreYouTube, setLoadingMoreYouTube] = useState(false);
  const [youtubeResults, setYoutubeResults] = useState({});
  const [youtubeSearchingId, setYoutubeSearchingId] = useState(null);
  const [youtubeError, setYoutubeError] = useState('');
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    if (!isOpen) return;

    const fetchTracks = async () => {
      setLoading(true);
      try {
        const res = await api.searchTracks({
          query,
          genre: selectedGenre !== 'All' ? selectedGenre : '',
          limit: 25
        });
        if (res.success) {
          setTracks(res.tracks);
        }
      } catch (err) {
        console.error('Track search failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchTracks, 250);
    return () => clearTimeout(delay);
  }, [isOpen, query, selectedGenre]);

  useEffect(() => {
    if (!isOpen) return;
    const searchQuery = query.trim();
    if (searchQuery.length < 2) {
      setYoutubeTracks([]);
      setYoutubeNextPageToken(null);
      setYoutubeError('');
      setYoutubeLoading(false);
      return;
    }

    let cancelled = false;
    setYoutubeTracks([]);
    setYoutubeNextPageToken(null);
    setYoutubeError('');
    setYoutubeLoading(true);

    const delay = setTimeout(async () => {
      try {
        const res = await api.searchYouTube(searchQuery, { limit: 25 });
        if (!res.success) throw new Error(res.message || 'YouTube search failed.');
        if (cancelled) return;
        setYoutubeTracks(res.videos || []);
        setYoutubeNextPageToken(res.nextPageToken || null);
      } catch (err) {
        if (!cancelled) setYoutubeError(err.message);
      } finally {
        if (!cancelled) setYoutubeLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(delay);
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  const handleAdd = async (track) => {
    const added = await addToQueue(track);
    if (!added) return;
    setAddedMap(prev => ({ ...prev, [track.id]: true }));
    setTimeout(() => {
      setAddedMap(prev => ({ ...prev, [track.id]: false }));
    }, 2000);
  };

  const findFullVersions = async (track) => {
    setYoutubeSearchingId(track.id);
    setYoutubeError('');
    try {
      const res = await api.searchYouTube(`${track.title} ${track.artist}`);
      if (!res.success) throw new Error(res.message || 'YouTube search failed.');
      setYoutubeResults(prev => ({ ...prev, [track.id]: res.videos || [] }));
      setPlaybackError('');
    } catch (err) {
      setYoutubeError(err.message);
    } finally {
      setYoutubeSearchingId(null);
    }
  };

  const loadMoreYouTube = async () => {
    if (!youtubeNextPageToken || loadingMoreYouTube) return;
    const requestedQuery = query.trim();
    setLoadingMoreYouTube(true);
    setYoutubeError('');
    try {
      const res = await api.searchYouTube(requestedQuery, {
        limit: 25,
        pageToken: youtubeNextPageToken
      });
      if (!res.success) throw new Error(res.message || 'Could not load more YouTube results.');
      if (queryRef.current.trim() !== requestedQuery) return;
      setYoutubeTracks(prev => {
        const existingIds = new Set(prev.map(video => video.videoId));
        return [...prev, ...(res.videos || []).filter(video => !existingIds.has(video.videoId))];
      });
      setYoutubeNextPageToken(res.nextPageToken || null);
    } catch (err) {
      setYoutubeError(err.message);
    } finally {
      setLoadingMoreYouTube(false);
    }
  };

  const makeYouTubeTrack = (video) => ({
    id: `youtube-${video.videoId}`,
    youtubeVideoId: video.videoId,
    title: video.title,
    artist: video.channelTitle,
    album: 'YouTube',
    duration: 180,
    artwork: video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
    genre: 'Music',
    bpm: 120,
    key: '8B',
    energy: 0.7,
    danceability: 0.7,
    valence: 0.6,
    popularity: 70
  });

  const isInQueue = (id) => {
    return (queue || []).some(t => t.id === id) || currentTrack?.id === id;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-purple-500/30 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <Music size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Search Music</h3>
              <p className="text-xs text-slate-400">YouTube tracks plus the curated catalog</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar & Filters */}
        <div className="p-4 border-b border-slate-800 bg-dark-900/40">
          <div className="relative mb-3">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by song title, artist, or genre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-dark-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Genre Scroll Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {GENRES.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                  selectedGenre === g
                    ? 'bg-neon-purple text-white font-semibold'
                    : 'bg-dark-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(youtubeError || playbackError) && (
            <p className="rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
              {youtubeError || playbackError}
            </p>
          )}
          {query.trim().length >= 2 && (
            <section className="space-y-2 pb-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wide text-cyan-300">
                  Full-track YouTube results
                </h4>
                <span className="text-[10px] text-slate-500">Page size: 25</span>
              </div>
              {youtubeLoading && (
                <p className="py-4 text-center text-xs text-slate-400 animate-pulse">
                  Searching YouTube…
                </p>
              )}
              {youtubeTracks.map(video => {
                const track = makeYouTubeTrack(video);
                const alreadyQueued = isInQueue(track.id);
                const justAdded = addedMap[track.id];
                return (
                  <div
                    key={video.videoId}
                    className="flex items-center gap-3 rounded-xl border border-cyan-900/50 bg-dark-900/70 p-2.5"
                  >
                    <img src={track.artwork} alt="" className="h-12 w-20 flex-shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">{video.title}</p>
                      <p className="truncate text-[11px] text-slate-400">{video.channelTitle}</p>
                    </div>
                    <button
                      onClick={() => handleAdd(track)}
                      disabled={alreadyQueued || justAdded}
                      className="flex flex-shrink-0 items-center space-x-1 rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-600 disabled:opacity-50"
                    >
                      {justAdded ? <Check size={14} /> : <Plus size={14} />}
                      <span>{justAdded ? 'Added' : alreadyQueued ? 'In Queue' : 'Queue full song'}</span>
                    </button>
                  </div>
                );
              })}
              {!youtubeLoading && youtubeTracks.length === 0 && !youtubeError && (
                <p className="py-3 text-center text-xs text-slate-400">No embeddable YouTube results found.</p>
              )}
              {youtubeNextPageToken && (
                <button
                  onClick={loadMoreYouTube}
                  disabled={loadingMoreYouTube}
                  className="w-full rounded-lg border border-cyan-800/60 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-950/30 disabled:opacity-50"
                >
                  {loadingMoreYouTube ? 'Loading…' : 'Load 25 more songs'}
                </button>
              )}
            </section>
          )}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
              Searching multi-genre catalog...
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No matching tracks in the curated catalog.
            </div>
          ) : (
            tracks.map(track => {
              const alreadyQueued = isInQueue(track.id);
              const justAdded = addedMap[track.id];

              return (
                <div
                  key={track.id}
                  className="p-2.5 bg-dark-900/60 hover:bg-dark-900 rounded-xl border border-slate-800 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={track.artwork}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="truncate">
                        <h4 className="font-semibold text-xs text-white truncate">{track.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/40 text-purple-300 font-mono">
                            {track.genre}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {track.bpm} BPM
                          </span>
                          <span className="text-[10px] text-neon-cyan font-mono">
                            Key: {track.key}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <a
                        href={getFullSongSearchUrl(track)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 text-slate-300 hover:text-white border border-slate-700 transition-all"
                        title="Open this song on YouTube Music"
                      >
                        <ExternalLink size={14} />
                        <span>YouTube Music</span>
                      </a>
                      <button
                        onClick={() => findFullVersions(track)}
                        disabled={youtubeSearchingId === track.id}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold text-cyan-200 hover:text-white border border-cyan-700/60 disabled:opacity-50"
                      >
                        {youtubeSearchingId === track.id ? 'Searching…' : 'Find version'}
                      </button>
                      <button
                        onClick={() => handleAdd(track)}
                        disabled={alreadyQueued || justAdded}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                          justAdded
                            ? 'bg-neon-green text-dark-950 font-bold'
                            : alreadyQueued
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-neon-purple hover:bg-purple-600 text-white'
                        }`}
                      >
                        {justAdded ? (
                          <>
                            <Check size={14} />
                            <span>Added!</span>
                          </>
                        ) : alreadyQueued ? (
                          <span>In Queue</span>
                        ) : (
                          <>
                            <Plus size={14} />
                            <span>Queue full song</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {(youtubeResults[track.id] || []).map(video => (
                    <div
                      key={video.videoId}
                      className="mt-2 flex items-center gap-3 rounded-lg bg-dark-950/70 p-2"
                    >
                      {video.thumbnail && (
                        <img src={video.thumbnail} alt="" className="h-10 w-16 rounded object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-white">{video.title}</p>
                        <p className="truncate text-[11px] text-slate-400">{video.channelTitle}</p>
                      </div>
                      <button
                        onClick={() => handleAdd({ ...track, youtubeVideoId: video.videoId })}
                        disabled={alreadyQueued || justAdded}
                        className="rounded-lg bg-cyan-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-cyan-600 disabled:opacity-50"
                      >
                        Queue version
                      </button>
                    </div>
                  ))}
                  {youtubeResults[track.id]?.length === 0 && (
                    <p className="mt-2 text-xs text-slate-400">No embeddable YouTube versions found.</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
