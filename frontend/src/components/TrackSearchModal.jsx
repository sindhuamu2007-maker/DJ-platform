import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Check, Play, Pause, Music, X, Filter } from 'lucide-react';
import { api } from '../services/api';
import { useRoom } from '../context/RoomContext';

const GENRES = ['All', 'Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Pop', 'Rock', 'EDM', 'Lo-fi', 'Classical', 'Jazz', 'Hip-Hop'];

export const TrackSearchModal = ({ isOpen, onClose }) => {
  const { addToQueue, queue, currentTrack } = useRoom();
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedMap, setAddedMap] = useState({});
  const [previewingId, setPreviewingId] = useState('');
  const [actionError, setActionError] = useState('');
  const [searchError, setSearchError] = useState('');
  const previewRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const fetchTracks = async () => {
      setLoading(true);
      setSearchError('');
      try {
        const res = await api.searchTracks({
          query,
          genre: selectedGenre !== 'All' ? selectedGenre : '',
          limit: 50
        });
        if (!active) return;
        if (res.success) {
          setTracks(res.tracks);
        } else {
          setTracks([]);
          setSearchError(res.message || 'Music search is temporarily unavailable.');
        }
      } catch (err) {
        console.error('Track search failed:', err);
        if (!active) return;
        setTracks([]);
        setSearchError('Music search is temporarily unavailable. Check your connection and try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    const delay = setTimeout(fetchTracks, 400);
    return () => {
      active = false;
      clearTimeout(delay);
    };
  }, [isOpen, query, selectedGenre]);

  useEffect(() => {
    if (isOpen || !previewRef.current) return;
    previewRef.current.pause();
    previewRef.current.currentTime = 0;
    setPreviewingId('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = async (track) => {
    setActionError('');
    const result = await addToQueue(track);
    if (!result?.success) {
      setActionError(result?.message || 'Could not add this song to the queue.');
      return;
    }

    const trackId = track.id || track._id;
    setAddedMap(prev => ({ ...prev, [trackId]: true }));
    setTimeout(() => setAddedMap(prev => ({ ...prev, [trackId]: false })), 2000);
  };

  const togglePreview = async (track) => {
    const trackId = track.id || track._id;
    setActionError('');
    if (previewingId === trackId && previewRef.current) {
      previewRef.current.pause();
      setPreviewingId('');
      return;
    }
    if (!track.audioUrl) {
      setActionError(`"${track.title}" does not have a playable audio source.`);
      return;
    }

    if (!previewRef.current) previewRef.current = new Audio();
    const audio = previewRef.current;
    audio.pause();
    audio.src = track.audioUrl;
    audio.currentTime = 0;
    audio.onended = () => setPreviewingId('');
    audio.onerror = () => {
      setPreviewingId('');
      setActionError(`Could not play "${track.title}". Try another song.`);
    };
    try {
      await audio.play();
      setPreviewingId(trackId);
    } catch (error) {
      console.error('Song preview failed:', error);
      setActionError('Could not play this preview. Check your connection and try again.');
    }
  };

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
              <h3 className="text-base font-bold text-white">Search Music Catalog</h3>
              <p className="text-xs text-slate-400">Apple previews are 30 seconds; full songs require server MusicKit credentials and an eligible subscriber account</p>
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
          {(searchError || actionError) && (
            <p role="alert" className="rounded-lg bg-red-500/10 p-2 text-xs text-red-400">
              {searchError || actionError}
            </p>
          )}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
              Searching Apple Music...
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {searchError ? 'Search could not be completed.' : 'No songs found. Try another song or artist.'}
            </div>
          ) : (
            tracks.map(track => {
              const trackId = track.id || track._id;
              const alreadyQueued = isInQueue(trackId);
              const justAdded = addedMap[trackId];

              return (
                <div
                  key={trackId}
                  className="p-2.5 bg-dark-900/60 hover:bg-dark-900 rounded-xl border border-slate-800 hover:border-purple-500/30 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <img
                      src={track.artwork}
                      alt={track.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="truncate">
                      <h4 className="font-semibold text-xs text-white truncate">{track.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                      {track.trackViewUrl && (
                        <a
                          href={track.trackViewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-neon-cyan hover:underline"
                        >
                          Open full song in Apple Music
                        </a>
                      )}
                      {!track.audioUrl && (
                        <p className="text-[10px] text-amber-300">
                          No preview; full playback requires Apple Music connection
                        </p>
                      )}
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

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => togglePreview(track)}
                      disabled={!track.audioUrl}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-40"
                      aria-label={`${previewingId === trackId ? 'Pause' : 'Preview'} ${track.title}`}
                    >
                      {previewingId === trackId ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      onClick={() => handleAdd(track)}
                      disabled={alreadyQueued && !justAdded}
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
                          <span>Queue</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
