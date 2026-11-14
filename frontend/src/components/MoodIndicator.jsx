import React from 'react';
import { Sparkles, Zap, Heart, Coffee, Smile, Frown } from 'lucide-react';

const EMOTION_META = {
  happy: { label: 'Happy', emoji: '😊', color: 'from-amber-400 to-yellow-500', text: 'text-amber-400', icon: Heart },
  excited: { label: 'Excited', emoji: '🔥', color: 'from-pink-500 to-rose-600', text: 'text-pink-400', icon: Zap },
  energetic: { label: 'Energetic', emoji: '⚡', color: 'from-purple-500 to-indigo-600', text: 'text-purple-400', icon: Sparkles },
  relaxed: { label: 'Relaxed', emoji: '☕', color: 'from-cyan-400 to-teal-500', text: 'text-cyan-400', icon: Coffee },
  sad: { label: 'Deep/Sad', emoji: '💔', color: 'from-blue-600 to-indigo-800', text: 'text-blue-400', icon: Frown },
  frustrated: { label: 'Restless', emoji: '😡', color: 'from-red-500 to-orange-600', text: 'text-red-400', icon: Frown }
};

export const MoodIndicator = ({ mood, compact = false }) => {
  const emotions = mood?.emotions || { happy: 35, excited: 25, energetic: 20, relaxed: 15, sad: 5, frustrated: 0 };
  const dominant = mood?.dominantEmotion || 'happy';
  const meta = EMOTION_META[dominant] || EMOTION_META.happy;
  const energy = Math.round((mood?.collectiveEnergy || 0.65) * 100);
  const trajectory = mood?.trajectory || 'Groovy & Upbeat';

  if (compact) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-dark-900 border border-purple-500/30">
        <span className="text-base">{meta.emoji}</span>
        <span className="text-xs font-semibold capitalize text-purple-300">{dominant}</span>
        <span className="text-xs text-slate-400 border-l border-slate-700 pl-2">⚡ {energy}%</span>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 rounded-xl border border-purple-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl animate-bounce">{meta.emoji}</span>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Room Vibe:</span>
              <span className={`text-sm font-bold capitalize ${meta.text}`}>{dominant}</span>
            </div>
            <p className="text-xs text-slate-400">{trajectory}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-slate-400">Energy Level</span>
          <div className="flex items-center space-x-1 justify-end">
            <Zap size={14} className="text-neon-cyan animate-pulse" />
            <span className="text-sm font-bold text-neon-cyan">{energy}%</span>
          </div>
        </div>
      </div>

      {/* Emotion Distribution Bars */}
      <div className="space-y-1.5 pt-1">
        {Object.entries(emotions).map(([key, value]) => {
          if (key === 'neutral' && value === 0) return null;
          const eMeta = EMOTION_META[key] || { label: key, color: 'from-slate-500 to-slate-600', emoji: '✨' };
          const pct = Math.max(0, Math.min(100, Math.round(value)));

          return (
            <div key={key} className="flex items-center text-xs">
              <span className="w-20 truncate text-slate-300 flex items-center space-x-1">
                <span>{eMeta.emoji}</span>
                <span className="capitalize">{key}</span>
              </span>
              <div className="flex-1 h-2 bg-dark-950 rounded-full mx-2 overflow-hidden border border-white/5">
                <div
                  className={`h-full bg-gradient-to-r ${eMeta.color} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-slate-400">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
