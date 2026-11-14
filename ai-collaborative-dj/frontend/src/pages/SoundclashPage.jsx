import React, { useState, useEffect } from 'react';
import { Swords, Trophy, Vote, Sparkles, Plus, CheckCircle2, Flame, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useRoom } from '../context/RoomContext';
import { SoundclashArena } from '../components/SoundclashArena';

export const SoundclashPage = () => {
  const { currentRoom } = useRoom();
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [songA, setSongA] = useState('');
  const [songB, setSongB] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbRes, catRes] = await Promise.all([
          api.getLeaderboard(),
          api.getCatalog()
        ]);
        if (lbRes.success) setLeaderboard(lbRes);
        if (catRes.success) {
          setCatalog(catRes.tracks);
          if (catRes.tracks.length >= 2) {
            setSongA(catRes.tracks[0].id);
            setSongB(catRes.tracks[1].id);
          }
        }
      } catch (err) {
        console.error('Failed to load Soundclash data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartBattle = async (e) => {
    e.preventDefault();
    if (songA && songB && songA !== songB && currentRoom) {
      try {
        await api.createBattle(currentRoom.roomId, songA, songB);
        setShowCreateModal(false);
        confetti({ particleCount: 50, spread: 70 });
      } catch (err) {
        console.error('Failed to start clash:', err);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-pink-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-pink-950 border border-pink-500/30 text-pink-300 text-xs font-semibold mb-2">
            <Swords size={14} />
            <span>Interactive Music Battle Arena</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Soundclash Battles & Predictions</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Two songs enter, one song leaves. Room members vote in real-time while AI forecasts the likely winner.
          </p>
        </div>

        {currentRoom && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-pink-500/25 flex items-center space-x-1.5"
          >
            <Plus size={16} />
            <span>Launch New Battle</span>
          </button>
        )}
      </div>

      {/* Main Arena Component */}
      <SoundclashArena onOpenCreateModal={() => setShowCreateModal(true)} />

      {/* Leaderboard Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Victorious Songs */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800">
            <Trophy size={18} className="text-amber-400" />
            <h3 className="font-bold text-sm text-white">Top Battle Winning Songs</h3>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="text-center py-8 text-slate-500 text-xs animate-pulse">Loading stats...</div>
            ) : leaderboard?.topTracks?.length > 0 ? (
              leaderboard.topTracks.map((t, idx) => (
                <div key={idx} className="p-3 bg-dark-900/70 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-mono font-bold text-amber-400 w-5">#{idx + 1}</span>
                    <span className="text-xs font-semibold text-white">{t.title}</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {t.wins} {t.wins === 1 ? 'Win' : 'Wins'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No battles concluded yet. Start the first clash to crown a champion!
              </div>
            )}
          </div>
        </div>

        {/* Most Dominant Battle Genres */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-800">
            <Award size={18} className="text-neon-cyan" />
            <h3 className="font-bold text-sm text-white">Dominant Battle Genres</h3>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="text-center py-8 text-slate-500 text-xs animate-pulse">Loading stats...</div>
            ) : leaderboard?.topGenres?.length > 0 ? (
              leaderboard.topGenres.map((g, idx) => (
                <div key={idx} className="p-3 bg-dark-900/70 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-mono font-bold text-neon-cyan w-5">#{idx + 1}</span>
                    <span className="text-xs font-semibold text-white">{g.genre}</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-neon-cyan border border-cyan-500/20">
                    {g.wins} {g.wins === 1 ? 'Victory' : 'Victories'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Genre statistics will update dynamically as clashes finish.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Battle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-pink-500/30">
            <h3 className="text-lg font-bold text-white mb-1">Create Soundclash Battle</h3>
            <p className="text-xs text-slate-400 mb-4">
              Pick two tracks from the catalog to compete for the next queue spot!
            </p>

            <form onSubmit={handleStartBattle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-pink-400 mb-1">Contender 1 (Song A)</label>
                <select
                  value={songA}
                  onChange={(e) => setSongA(e.target.value)}
                  className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  {catalog.map(t => (
                    <option key={t.id} value={t.id}>{t.title} - {t.artist} ({t.genre})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-400 mb-1">Contender 2 (Song B)</label>
                <select
                  value={songB}
                  onChange={(e) => setSongB(e.target.value)}
                  className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {catalog.map(t => (
                    <option key={t.id} value={t.id}>{t.title} - {t.artist} ({t.genre})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25"
                >
                  Launch Battle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
