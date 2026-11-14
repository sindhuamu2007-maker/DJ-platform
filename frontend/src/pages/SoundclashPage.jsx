import React, { useState, useEffect } from 'react';
import { Swords, Trophy, Award, Headphones, Users, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useRoom } from '../context/RoomContext';
import { SoundclashArena } from '../components/SoundclashArena';
import { SoundclashBattleModal } from '../components/SoundclashBattleModal';
import { useAuth } from '../context/AuthContext';

export const SoundclashPage = () => {
  const { currentRoom, joinRoom, createSoundclash } = useRoom();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [creatingBattle, setCreatingBattle] = useState(false);
  const [startingSolo, setStartingSolo] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState('');
  const [roomError, setRoomError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbRes, catRes, roomsRes] = await Promise.all([
          api.getLeaderboard(),
          api.getCatalog(),
          api.listRooms()
        ]);
        if (lbRes.success) setLeaderboard(lbRes);
        if (catRes.success) setCatalog(catRes.tracks || []);
        if (roomsRes.success) setRooms(roomsRes.rooms || []);
      } catch (err) {
        console.error('Failed to load Soundclash data:', err);
        setRoomError('Could not load music or rooms. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartBattle = async (songAId, songBId) => {
    if (creatingBattle) return;
    setCreatingBattle(true);
    try {
      const res = await createSoundclash(songAId, songBId);
      if (!res.success) return res;
      setShowCreateModal(false);
      confetti({ particleCount: 50, spread: 70 });
      return res;
    } catch (err) {
      console.error('Failed to start clash:', err);
      throw err;
    } finally {
      setCreatingBattle(false);
    }
  };

  const handleStartSolo = async () => {
    if (startingSolo) return;
    setRoomError('');
    setStartingSolo(true);
    try {
      const displayName = user?.displayName || user?.username || 'My';
      const res = await api.createRoom({
        name: `${displayName}'s Solo Session`,
        description: 'Private personal listening and Soundclash session',
        mode: 'solo'
      });
      if (!res.success || !res.room) {
        setRoomError(res.message || 'Could not create a personal listening session.');
        return;
      }

      const joined = await joinRoom(res.room.roomId);
      if (!joined?.success) {
        setRoomError(joined?.message || 'Your session was created, but could not be opened.');
      }
    } catch (err) {
      console.error('Failed to start solo session:', err);
      setRoomError(err.message || 'Unable to connect to the server.');
    } finally {
      setStartingSolo(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    if (joiningRoomId) return;
    setRoomError('');
    setJoiningRoomId(roomId);
    try {
      const res = await joinRoom(roomId);
      if (!res?.success) setRoomError(res?.message || 'Could not join this room.');
    } finally {
      setJoiningRoomId('');
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

      {!currentRoom && (
        <section className="glass-panel rounded-2xl border border-purple-500/25 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Headphones size={18} className="text-neon-purple" />
            <h2 className="font-bold text-white">Choose how to listen</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              onClick={handleStartSolo}
              disabled={startingSolo}
              className="rounded-xl border border-purple-500/30 bg-purple-950/30 p-4 text-left hover:border-purple-400 disabled:opacity-50"
            >
              <span className="block text-sm font-bold text-white">{startingSolo ? 'Starting...' : 'Start a private solo session'}</span>
              <span className="mt-1 block text-xs text-slate-400">Listen alone, preview tracks, and run a one-person Soundclash.</span>
            </button>
            <div className="rounded-xl border border-slate-700 bg-dark-900/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                <Users size={15} className="text-neon-cyan" />
                Join a group room
              </div>
              {rooms.length ? (
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {rooms.map(room => (
                    <button
                      key={room.roomId}
                      onClick={() => handleJoinRoom(room.roomId)}
                      disabled={Boolean(joiningRoomId)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-800 p-2 text-left hover:border-cyan-500/50 disabled:opacity-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-white">{room.name}</span>
                        <span className="text-[10px] text-slate-400">{room.participantCount} listeners · {room.roomId}</span>
                      </span>
                      <span className="ml-2 text-[10px] font-bold text-cyan-300">{joiningRoomId === room.roomId ? 'Joining...' : 'Join'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No group rooms are available. Create one from Rooms to invite friends.</p>
              )}
            </div>
          </div>
          {roomError && <p role="alert" className="mt-3 text-xs text-red-400">{roomError}</p>}
        </section>
      )}

      {currentRoom && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-dark-900/50 px-4 py-3">
          <p className="text-xs text-slate-300">
            Active session: <span className="font-semibold text-white">{currentRoom.name}</span>
            <span className="ml-2 rounded-full bg-purple-500/15 px-2 py-1 text-[10px] uppercase text-purple-300">
              {currentRoom.mode === 'solo' ? 'Solo' : 'Group'}
            </span>
          </p>
          <button onClick={() => setShowCreateModal(true)} disabled={catalog.length < 2} className="text-xs font-semibold text-pink-300 disabled:opacity-50">
            Create a battle
          </button>
        </div>
      )}

      {/* Main Arena Component */}
      {currentRoom && <SoundclashArena onOpenCreateModal={() => setShowCreateModal(true)} />}

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

      <SoundclashBattleModal
        isOpen={showCreateModal}
        catalog={catalog}
        isCreating={creatingBattle}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleStartBattle}
      />
    </div>
  );
};
