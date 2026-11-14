import React from 'react';
import { Scale, Sparkles, RefreshCw, Users, ShieldAlert } from 'lucide-react';
import { useRoom } from '../context/RoomContext';

export const ConflictResolutionBanner = () => {
  const { conflictResolution, triggerConflictResolution, currentRoom } = useRoom();

  const explanation = conflictResolution?.explanation ||
    "AI is actively balancing individual preferences, genre fairness, and room energy.";
  const distribution = conflictResolution?.groupGenreDistribution || {};

  return (
    <div className="glass-panel p-3.5 rounded-xl border border-neon-cyan/30 bg-gradient-to-r from-cyan-950/30 via-purple-950/20 to-transparent">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2.5">
          <div className="p-2 bg-neon-cyan/10 rounded-lg text-neon-cyan mt-0.5 border border-neon-cyan/20">
            <Scale size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1">
                <span>AI Music Conflict Resolution</span>
                <Sparkles size={13} className="text-neon-cyan" />
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan font-semibold">
                Neutral DJ Active
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {explanation}
            </p>

            {/* Group Taste Distribution Badges */}
            {Object.keys(distribution).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400 mr-1 flex items-center space-x-1">
                  <Users size={12} />
                  <span>Taste Share:</span>
                </span>
                {Object.entries(distribution).map(([genre, pct]) => (
                  <span
                    key={genre}
                    className="text-[10px] px-2 py-0.5 rounded bg-dark-900 border border-slate-700 text-slate-300 font-mono"
                  >
                    {genre.toUpperCase()}: <span className="text-neon-cyan font-bold">{pct}%</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={triggerConflictResolution}
          title="Rebalance room preferences now"
          className="p-1.5 rounded-lg bg-dark-900/80 hover:bg-neon-cyan/20 text-slate-400 hover:text-neon-cyan border border-slate-700 transition-all flex items-center space-x-1 text-xs"
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline text-[11px]">Rebalance</span>
        </button>
      </div>
    </div>
  );
};
