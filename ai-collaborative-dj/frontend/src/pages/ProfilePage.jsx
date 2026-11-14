import React, { useState } from 'react';
import { User, Mail, Music, Check, Disc3, Clock, Trophy, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ALL_GENRES = [
  'Kannada', 'Hindi', 'English', 'Telugu', 'Tamil',
  'Pop', 'Rock', 'EDM', 'Lo-fi', 'Classical', 'Jazz', 'Hip-Hop'
];

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [selectedGenres, setSelectedGenres] = useState(user?.preferredGenres || ['Kannada', 'EDM', 'Pop']);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter(g => g !== genre));
      }
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        displayName,
        profilePic,
        preferredGenres: selectedGenres
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/25 flex flex-col sm:flex-row items-center gap-6">
        <img
          src={profilePic || user?.profilePic || AVATARS[0]}
          alt={user?.username}
          className="w-24 h-24 rounded-2xl object-cover border-2 border-neon-purple shadow-xl shadow-purple-500/20"
        />
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-black text-white">{displayName || user?.username}</h1>
          <p className="text-xs text-purple-300 font-mono">@{user?.username}</p>
          <p className="text-xs text-slate-400 mt-1">{user?.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Clock size={15} className="text-neon-cyan" />
              <span>{user?.totalListeningMinutes || 45} mins listened</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Trophy size={15} className="text-amber-400" />
              <span>{user?.soundclashWins || 3} Clash Wins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/20 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-white">Music Preferences & Identity</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure how the AI DJ recommendation engine and conflict balancer represent you
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-purple"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Avatar Preset</label>
            <div className="flex items-center space-x-2 pt-1">
              {AVATARS.map((av, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setProfilePic(av)}
                  className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                    profilePic === av ? 'border-neon-purple scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={av} alt="avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Favorite Genres Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Your Preferred Music Genres ({selectedGenres.length} selected)
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_GENRES.map(g => {
              const active = selectedGenres.includes(g);
              return (
                <button
                  type="button"
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all ${
                    active
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20'
                      : 'bg-dark-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {active && <Check size={13} />}
                  <span>{g}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-neon-purple hover:bg-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center space-x-1.5 transition-all"
          >
            {savedSuccess ? <CheckCircle2 size={15} /> : <Save size={15} />}
            <span>{savedSuccess ? 'Profile Updated!' : saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
