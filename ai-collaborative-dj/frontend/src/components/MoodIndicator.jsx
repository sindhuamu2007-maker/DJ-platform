import React from 'react';
import { Sparkles, Zap, Heart, Coffee, Smile, Frown } from 'lucide-react';

const EMOTION_META = {
  happy: { label: 'Happy', emoji: '😊', color: 'from-amber-400 to-yellow-500', text: 'text-amber-400', solid: '#fbbf24', icon: Heart },
  excited: { label: 'Excited', emoji: '🔥', color: 'from-pink-500 to-rose-600', text: 'text-pink-400', solid: '#ec4899', icon: Zap },
  energetic: { label: 'Energetic', emoji: '⚡', color: 'from-purple-500 to-indigo-600', text: 'text-purple-400', solid: '#8b5cf6', icon: Sparkles },
  relaxed: { label: 'Relaxed', emoji: '☕', color: 'from-cyan-400 to-teal-500', text: 'text-cyan-400', solid: '#22d3ee', icon: Coffee },
  sad: { label: 'Deep/Sad', emoji: '💔', color: 'from-blue-600 to-indigo-800', text: 'text-blue-400', solid: '#3b82f6', icon: Frown },
  frustrated: { label: 'Restless', emoji: '😡', color: 'from-red-500 to-orange-600', text: 'text-red-400', solid: '#f97316', icon: Frown }
};

export const MoodIndicator = ({ mood, compact = false }) => {
  const emotions = mood?.emotions || { happy: 35, excited: 25, energetic: 20, relaxed: 15, sad: 5, frustrated: 0 };
  const dominant = mood?.dominantEmotion || 'happy';
  const meta = EMOTION_META[dominant] || EMOTION_META.happy;
  const energy = Math.round(Math.max(0, Math.min(1, Number(mood?.collectiveEnergy ?? 0.65))) * 100);
  const trajectory = mood?.trajectory || 'Groovy & Upbeat';
  const emotionEntries = Object.entries(emotions)
    .filter(([key]) => key !== 'neutral' || emotions[key] > 0)
    .map(([key, value]) => ({
      key,
      value: Math.max(0, Number(value) || 0),
      meta: EMOTION_META[key] || { label: key, emoji: '✨', solid: '#94a3b8' }
    }))
    .sort((a, b) => b.value - a.value);
  const emotionTotal = emotionEntries.reduce((sum, item) => sum + item.value, 0);
  let segmentStart = 0;
  const ringSegments = emotionEntries.map(item => {
    const segmentEnd = segmentStart + (emotionTotal ? item.value / emotionTotal * 100 : 0);
    const segment = `${item.meta.solid} ${segmentStart}% ${segmentEnd}%`;
    segmentStart = segmentEnd;
    return segment;
  });
  const dominantValue = emotionEntries.find(item => item.key === dominant)?.value || emotionEntries[0]?.value || 0;
  const dominantPercent = emotionTotal ? Math.round(dominantValue / emotionTotal * 100) : 0;

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
    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-purple-500/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
            {meta.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Room vibe</p>
            <p className={`truncate text-base font-bold capitalize ${meta.text}`}>{dominant}</p>
            <p className="truncate text-xs text-slate-400">{trajectory}</p>
          </div>
        </div>

        <div className="flex-shrink-0 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Energy</p>
          <div className="flex items-center justify-end gap-1">
            <Zap size={13} className="text-neon-cyan" />
            <span className="text-sm font-bold text-neon-cyan">{energy}%</span>
          </div>
        </div>
      </div>

      <div
        className="mt-5 grid grid-cols-1 items-center gap-5 sm:grid-cols-[136px_minmax(0,1fr)]"
        aria-label={`Room emotion mix. ${emotionEntries.map(item => `${item.meta.label} ${Math.round(item.value)}%`).join(', ')}`}
      >
        <div
          className="mx-auto flex h-32 w-32 items-center justify-center rounded-full p-2"
          style={{ background: `conic-gradient(${ringSegments.join(', ') || '#1e293b'})` }}
          role="img"
          aria-label={`${dominant} is the leading mood at ${dominantPercent}%`}
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/5 bg-dark-950">
            <span className={`text-2xl font-black ${meta.text}`}>{dominantPercent}%</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500">top mood</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          {emotionEntries.map(({ key, value, meta: emotionMeta }) => (
            <div key={key} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-800 bg-dark-950/50 px-2.5 py-2">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: emotionMeta.solid }}
              />
              <span className="truncate text-xs text-slate-300">{emotionMeta.label}</span>
              <span className="ml-auto font-mono text-xs font-semibold text-white">{Math.round(value)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
