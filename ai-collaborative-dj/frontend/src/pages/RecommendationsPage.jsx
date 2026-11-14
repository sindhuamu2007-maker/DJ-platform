import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Plus, Check, Play, Compass, Flame, Users, Radio, ThumbsUp, ThumbsDown } from 'lucide-react';
import { api } from '../services/api';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';

export const RecommendationsPage = () => {
  const { currentRoom, addToQueue, queue, currentTrack } = useRoom();
  const { user } = useAuth();

  const [shelves, setShelves] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addedMap, setAddedMap] = useState({});

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await api.getRecommendations(currentRoom?.roomId);
        if (res.success && res.recommendations) {
          setShelves(res.recommendations);
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [currentRoom]);

  const handleAddToQueue = (track) => {
    addToQueue(track);
    setAddedMap(prev => ({ ...prev, [track.id]: true }));
    setTimeout(() => {
      setAddedMap(prev => ({ ...prev, [track.id]: false }));
    }, 2000);
  };

  const isInQueue = (id) => {
    return (queue || []).some(t => t.id === id) || currentTrack?.id === id;
  };

  const renderTrackCard = (track) => {
    const already = isInQueue(track.id);
    const justAdded = addedMap[track.id];

    return (
      <div
        key={track.id}
        className="glass-card p-3 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group flex-shrink-0 w-44"
      >
        <div>
          <div className="relative mb-2 rounded-xl overflow-hidden aspect-square">
            <img src={track.artwork} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <span className="absolute bottom-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-purple-300 font-mono font-semibold">
              {track.genre}
            </span>
          </div>
          <h4 className="font-bold text-xs text-white truncate">{track.title}</h4>
          <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
          <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-400 font-mono">
            <span>{track.bpm} BPM</span>
            <span>•</span>
            <span className="text-neon-cyan">Key {track.key}</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={() => handleAddToQueue(track)}
            disabled={already && !justAdded}
            className={`w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
              justAdded
                ? 'bg-neon-green text-dark-950 font-bold'
                : already
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-neon-purple hover:bg-purple-600 text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check size={12} />
                <span>Queued!</span>
              </>
            ) : already ? (
              <span>In Queue</span>
            ) : (
              <>
                <Plus size={12} />
                <span>Queue Track</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderShelf = (title, subtitle, icon, tracks) => {
    if (!tracks || tracks.length === 0) return null;

    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-dark-900 border border-slate-700 text-neon-cyan">
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-stretch space-x-3.5 overflow-x-auto pb-3 pt-1">
          {tracks.map(renderTrackCard)}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/25">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
          <Compass size={14} className="text-neon-cyan" />
          <span>Multi-Engine Hybrid Recommendations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Music Discovery & Smart Curation</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Powered by content audio feature vectors, collaborative room listening histories, group mood congruency, and diversity balancing.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs animate-pulse">
          Computing multi-shelf hybrid music recommendations...
        </div>
      ) : (
        <div className="space-y-8">
          {renderShelf(
            "Recommended for You",
            "Personalized based on your favorite genres and history",
            <Heart size={16} className="text-pink-400" />,
            shelves?.recommended_for_you
          )}

          {renderShelf(
            "Based on Your Mood",
            `Congruent with current room valence & energy`,
            <Sparkles size={16} className="text-neon-cyan" />,
            shelves?.based_on_mood
          )}

          {renderShelf(
            "Group Compatible Tracks",
            "Harmonized across all active participants to resolve taste conflicts",
            <Users size={16} className="text-neon-purple" />,
            shelves?.group_compatible
          )}

          {renderShelf(
            "Popular in Your Room",
            "Highest streaming traction and Soundclash winners",
            <Flame size={16} className="text-amber-400" />,
            shelves?.popular_in_room
          )}

          {renderShelf(
            "Discover New Music",
            "High-energy tracks in unexplored genres to expand your palette",
            <Compass size={16} className="text-neon-green" />,
            shelves?.discover_new
          )}
        </div>
      )}
    </div>
  );
};
