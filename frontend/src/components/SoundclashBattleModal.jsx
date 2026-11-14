import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Search, X } from 'lucide-react';

const getTrackId = (track) => track?.id || track?._id || '';

export const SoundclashBattleModal = ({
  isOpen,
  catalog = [],
  isCreating,
  onClose,
  onCreate
}) => {
  const [songAId, setSongAId] = useState('');
  const [songBId, setSongBId] = useState('');
  const [search, setSearch] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [battleError, setBattleError] = useState('');
  const [previewingId, setPreviewingId] = useState('');
  const previewRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const ids = catalog.map(getTrackId).filter(Boolean);
    setSongAId(current => ids.includes(current) ? current : ids[0] || '');
    setSongBId(current => ids.includes(current) ? current : ids[1] || '');
    setSearch('');
    setBattleError('');
  }, [isOpen, catalog]);

  useEffect(() => {
    if (isOpen || !previewRef.current) return;
    previewRef.current.pause();
    previewRef.current.currentTime = 0;
    setPreviewingId('');
  }, [isOpen]);

  useEffect(() => () => {
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current = null;
    }
  }, []);

  if (!isOpen) return null;

  const songA = catalog.find(track => getTrackId(track) === songAId);
  const songB = catalog.find(track => getTrackId(track) === songBId);
  const filteredTracks = catalog.filter(track =>
    `${track.title} ${track.artist} ${track.genre}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const togglePreview = async (track) => {
    const trackId = getTrackId(track);
    setPreviewError('');

    if (previewingId === trackId && previewRef.current) {
      previewRef.current.pause();
      setPreviewingId('');
      return;
    }

    if (!track.audioUrl) {
      setPreviewError(`"${track.title}" has no playable audio preview.`);
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
      setPreviewError(`Could not play "${track.title}". Try another track.`);
    };

    try {
      await audio.play();
      setPreviewingId(trackId);
    } catch (error) {
      console.error('Soundclash preview failed:', error);
      setPreviewingId('');
      setPreviewError('Could not play this preview. Check your connection and try again.');
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!songAId || !songBId || songAId === songBId) {
      setBattleError('Choose two different songs before starting the battle.');
      return;
    }

    setBattleError('');
    try {
      const result = await onCreate(songAId, songBId);
      if (!result?.success) {
        setBattleError(result?.message || 'The battle could not be started.');
        return;
      }

      onClose();
    } catch (error) {
      console.error('Soundclash creation failed:', error);
      setBattleError(error.message || 'Unable to start the battle. Please try again.');
    }
  };

  const contender = (label, track, selectedId, onSelect, color) => (
    <div className={`rounded-xl border p-3 ${color}`}>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      {track ? (
        <div className="mt-1 flex items-center gap-2">
          <img src={track.artwork} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{track.title}</p>
            <p className="truncate text-[11px] text-slate-400">{track.artist}</p>
          </div>
          <button type="button" onClick={() => togglePreview(track)} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label={`${previewingId === selectedId ? 'Pause' : 'Preview'} ${track.title}`}>
            {previewingId === selectedId ? <Pause size={15} /> : <Play size={15} />}
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Choose a song below</p>
      )}
      <button type="button" onClick={() => onSelect('')} disabled={!selectedId || isCreating} className="mt-2 text-[10px] text-slate-400 underline disabled:opacity-40">
        Clear selection
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="glass-panel flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-pink-500/30">
        <div className="flex items-start justify-between border-b border-slate-800 p-5">
          <div>
            <h3 className="text-lg font-bold text-white">Create Soundclash Battle</h3>
            <p className="mt-1 text-xs text-slate-400">Choose two different songs. Preview either one before starting.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isCreating} className="rounded-lg p-1 text-slate-400 hover:text-white disabled:opacity-40" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
          <div className="grid grid-cols-2 gap-3 p-4">
            {contender('Song A', songA, songAId, setSongAId, 'border-pink-500/30 bg-pink-950/20')}
            {contender('Song B', songB, songBId, setSongBId, 'border-purple-500/30 bg-purple-950/20')}
          </div>

          <label className="relative mx-4 mb-3 block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Find a song or artist..."
              className="w-full rounded-xl border border-slate-700 bg-dark-900 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-pink-500"
            />
          </label>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
            {!catalog.length && (
              <p className="py-8 text-center text-xs text-slate-400">No playable songs are available yet. Check the music catalog and try again.</p>
            )}
            {filteredTracks.map(track => {
              const trackId = getTrackId(track);
              const selectedAsA = songAId === trackId;
              const selectedAsB = songBId === trackId;
              return (
                <div key={trackId} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-dark-900/70 p-2.5 sm:flex-nowrap sm:gap-3">
                  <img src={track.artwork} alt="" className="h-11 w-11 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{track.title}</p>
                    <p className="truncate text-[11px] text-slate-400">{track.artist} · {track.genre}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreview(track)}
                    disabled={isCreating || !track.audioUrl}
                    className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-40"
                    aria-label={`${previewingId === trackId ? 'Pause' : 'Preview'} ${track.title}`}
                  >
                    {previewingId === trackId ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSongAId(trackId)}
                    disabled={isCreating || selectedAsA}
                    className={`rounded-lg px-2.5 py-2 text-[10px] font-bold ${selectedAsA ? 'bg-pink-500 text-white' : 'border border-pink-500/40 text-pink-300 hover:bg-pink-500/20'} disabled:opacity-60`}
                  >
                    {selectedAsA ? 'A selected' : 'Choose A'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSongBId(trackId)}
                    disabled={isCreating || selectedAsB}
                    className={`rounded-lg px-2.5 py-2 text-[10px] font-bold ${selectedAsB ? 'bg-purple-500 text-white' : 'border border-purple-500/40 text-purple-300 hover:bg-purple-500/20'} disabled:opacity-60`}
                  >
                    {selectedAsB ? 'B selected' : 'Choose B'}
                  </button>
                </div>
              );
            })}
            {filteredTracks.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">No songs match your search.</p>
            )}
          </div>

          {(previewError || battleError) && (
            <p role="alert" className="px-4 pb-2 text-xs text-red-400">{battleError || previewError}</p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-slate-800 p-4">
            <button type="button" onClick={onClose} disabled={isCreating} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-40">
              Cancel
            </button>
            <button type="submit" disabled={isCreating || catalog.length < 2} className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-pink-500/25 disabled:cursor-not-allowed disabled:opacity-50">
              {isCreating ? 'Starting Battle...' : 'Ignite Battle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
