import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, Disc3, Flame, MessageSquare, Users, Zap } from 'lucide-react';
import { api } from '../services/api';
import { useRoom } from '../context/RoomContext';

const moodIcons = {
  happy: '😊',
  excited: '🎉',
  energetic: '⚡',
  relaxed: '😌',
  sad: '💙',
  frustrated: '😤',
  neutral: '😐'
};

export const AnalyticsPage = () => {
  const { currentRoom } = useRoom();
  const roomId = currentRoom?.roomId;
  const [globalStats, setGlobalStats] = useState(null);
  const [roomStats, setRoomStats] = useState(null);
  const [globalError, setGlobalError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setGlobalError('');
    setRoomError('');

    const fetchResult = async (request) => {
      try {
        return { response: await request() };
      } catch (error) {
        return { error };
      }
    };

    const fetchAnalytics = async () => {
      const [globalResult, roomResult] = await Promise.all([
        fetchResult(() => api.getGlobalAnalytics()),
        roomId ? fetchResult(() => api.getAnalytics(roomId)) : Promise.resolve({ response: null })
      ]);

      if (!active) return;

      if (globalResult.error || !globalResult.response?.success) {
        setGlobalStats(null);
        setGlobalError(
          globalResult.error?.message ||
          globalResult.response?.message ||
          'Global analytics could not be loaded.'
        );
      } else {
        setGlobalStats(globalResult.response.analytics);
      }

      if (!roomId) {
        setRoomStats(null);
      } else if (roomResult.error || !roomResult.response?.success) {
        setRoomStats(null);
        setRoomError(
          roomResult.error?.message ||
          roomResult.response?.message ||
          'Room analytics could not be loaded.'
        );
      } else {
        setRoomStats(roomResult.response.analytics);
      }

      setLoading(false);
    };

    fetchAnalytics();
    return () => {
      active = false;
    };
  }, [roomId]);

  const genreEntries = Object.entries(globalStats?.topPreferredGenres || {})
    .filter(([, count]) => Number.isFinite(Number(count)) && Number(count) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const maxGenreCount = Math.max(1, ...genreEntries.map(([, count]) => Number(count)));
  const dominantEmotion = roomStats?.dominantEmotion;
  const energy = roomStats?.collectiveEnergy;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/25">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
          <Activity size={14} className="text-neon-cyan" />
          <span>Aggregates from Saved Records</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Music & Social Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Counts and mood summaries are calculated from registered profiles, rooms, battles, and saved chat messages.
        </p>
      </div>

      {globalError && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200">
          {globalError}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Rooms</span>
            <Disc3 size={18} className="text-neon-purple" />
          </div>
          <span className="text-2xl font-black text-white">{loading ? '…' : (globalStats?.totalRooms ?? '—')}</span>
          <p className="text-[11px] text-slate-400 mt-1">Saved listening rooms</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Registered Listeners</span>
            <Users size={18} className="text-neon-cyan" />
          </div>
          <span className="text-2xl font-black text-white">{loading ? '…' : (globalStats?.totalUsers ?? '—')}</span>
          <p className="text-[11px] text-slate-400 mt-1">Saved user profiles</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Catalog Tracks</span>
            <Flame size={18} className="text-neon-pink" />
          </div>
          <span className="text-2xl font-black text-white">{loading ? '…' : (globalStats?.catalogTrackCount ?? '—')}</span>
          <p className="text-[11px] text-slate-400 mt-1">Tracks returned by the music catalog</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed Soundclashes</span>
            <Zap size={18} className="text-amber-400" />
          </div>
          <span className="text-2xl font-black text-white">{loading ? '…' : (globalStats?.completedSoundclashes ?? '—')}</span>
          <p className="text-[11px] text-slate-400 mt-1">Battles marked completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <BarChart3 size={16} className="text-neon-purple" />
            <span>Listener Genre Preferences</span>
          </h3>

          {loading ? (
            <p className="text-xs text-slate-400">Loading saved preferences…</p>
          ) : genreEntries.length ? (
            <div className="space-y-2.5">
              {genreEntries.map(([genre, count]) => (
                <div key={genre} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">{genre}</span>
                    <span className="text-neon-cyan font-mono">{count} listeners</span>
                  </div>
                  <div className="h-2 bg-dark-950 rounded-full overflow-hidden border border-white/5">
                    <div
                      style={{ width: `${(Number(count) / maxGenreCount) * 100}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              {globalError ? 'Preferences are unavailable until analytics load.' : 'No listener genre preferences have been recorded yet.'}
            </p>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <MessageSquare size={16} className="text-neon-pink" />
            <span>Room Mood & Chat Sentiment</span>
          </h3>

          {loading ? (
            <p className="text-xs text-slate-400">Loading room analytics…</p>
          ) : roomError ? (
            <p role="alert" className="text-xs text-red-300">{roomError}</p>
          ) : !roomStats ? (
            <p className="text-xs text-slate-400">Join a room to see its current mood and chat sentiment.</p>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-dark-950/60 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-2">Current Room Emotion</span>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{moodIcons[dominantEmotion] || '🎧'}</span>
                  <div>
                    <h4 className="font-bold text-base text-white capitalize">
                      {dominantEmotion || 'No mood data'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {Number.isFinite(energy) ? `Energy: ${Math.round(energy * 100)}%` : 'Energy unavailable'}
                      {roomStats.trajectory ? ` · ${roomStats.trajectory}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-dark-900 rounded-xl border border-slate-800">
                  <span className="text-neon-green font-bold text-lg block">
                    {roomStats.sentimentBreakdown?.positive ?? 0}
                  </span>
                  <span className="text-slate-400">Positive</span>
                </div>
                <div className="p-3 bg-dark-900 rounded-xl border border-slate-800">
                  <span className="text-slate-300 font-bold text-lg block">
                    {roomStats.sentimentBreakdown?.neutral ?? 0}
                  </span>
                  <span className="text-slate-400">Neutral</span>
                </div>
                <div className="p-3 bg-dark-900 rounded-xl border border-slate-800">
                  <span className="text-neon-pink font-bold text-lg block">
                    {roomStats.sentimentBreakdown?.negative ?? 0}
                  </span>
                  <span className="text-slate-400">Negative</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
