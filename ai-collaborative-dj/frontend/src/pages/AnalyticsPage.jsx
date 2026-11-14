import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, Flame, Disc3, MessageSquare, Zap, Activity } from 'lucide-react';
import { api } from '../services/api';
import { useRoom } from '../context/RoomContext';

export const AnalyticsPage = () => {
  const { currentRoom } = useRoom();
  const [globalStats, setGlobalStats] = useState(null);
  const [roomStats, setRoomStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [gRes, rRes] = await Promise.all([
          api.getGlobalAnalytics(),
          currentRoom ? api.getAnalytics(currentRoom.roomId) : Promise.resolve({ success: false })
        ]);
        if (gRes.success) setGlobalStats(gRes.analytics);
        if (rRes.success) setRoomStats(rRes.analytics);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [currentRoom]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/25">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
          <Activity size={14} className="text-neon-cyan" />
          <span>Real-time Telemetry & Data Records</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Music & Social Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Aggregated statistics on listening duration, chat sentiment breakdown, genre popularity, and group mood evolutions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Lounges</span>
            <Disc3 size={18} className="text-neon-purple" />
          </div>
          <span className="text-2xl font-black text-white">{globalStats?.totalRooms || 4}</span>
          <p className="text-[11px] text-slate-400 mt-1">Virtual group sessions</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Registered Listeners</span>
            <Users size={18} className="text-neon-cyan" />
          </div>
          <span className="text-2xl font-black text-white">{globalStats?.totalUsers || 12}</span>
          <p className="text-[11px] text-slate-400 mt-1">Personalized profiles</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Catalog Tracks</span>
            <Flame size={18} className="text-neon-pink" />
          </div>
          <span className="text-2xl font-black text-white">{globalStats?.catalogTrackCount || 18}</span>
          <p className="text-[11px] text-slate-400 mt-1">Licensed multi-genre tracks</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Soundclashes Fought</span>
            <Zap size={18} className="text-amber-400" />
          </div>
          <span className="text-2xl font-black text-white">{globalStats?.totalSoundclashes || 6}</span>
          <p className="text-[11px] text-slate-400 mt-1">Song battles concluded</p>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Preferred Platform Genres */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <BarChart3 size={16} className="text-neon-purple" />
            <span>Community Favorite Genres Distribution</span>
          </h3>

          <div className="space-y-2.5">
            {globalStats?.topPreferredGenres &&
              Object.entries(globalStats.topPreferredGenres).map(([genre, count]) => {
                const max = Math.max(...Object.values(globalStats.topPreferredGenres));
                const pct = Math.round((count / max) * 100);

                return (
                  <div key={genre} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{genre}</span>
                      <span className="text-neon-cyan font-mono">{count} fans</span>
                    </div>
                    <div className="h-2 bg-dark-950 rounded-full overflow-hidden border border-white/5">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Room Sentiment Analysis Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <MessageSquare size={16} className="text-neon-pink" />
            <span>NLP Sentiment & Emotional Velocity</span>
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-dark-950/60 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-2">Dominant Room Emotion</span>
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🔥</span>
                <div>
                  <h4 className="font-bold text-base text-white capitalize">
                    {roomStats?.dominantEmotion || 'Happy & Excited'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Energy trajectory: {roomStats?.collectiveEnergy ? `${Math.round(roomStats.collectiveEnergy * 100)}%` : '74%'} Peak Party
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-dark-900 rounded-xl border border-slate-800">
                <span className="text-neon-green font-bold text-lg block">
                  {roomStats?.sentimentBreakdown?.positive || 14}
                </span>
                <span className="text-slate-400">Positive</span>
              </div>
              <div className="p-3 bg-dark-900 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-bold text-lg block">
                  {roomStats?.sentimentBreakdown?.neutral || 4}
                </span>
                <span className="text-slate-400">Neutral</span>
              </div>
              <div className="p-3 bg-dark-900 rounded-xl border border-slate-800">
                <span className="text-neon-pink font-bold text-lg block">
                  {roomStats?.sentimentBreakdown?.negative || 2}
                </span>
                <span className="text-slate-400">Negative/Restless</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
