import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, Lock, Mail, User, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_GENRES = [
  'Kannada', 'Hindi', 'English', 'Telugu', 'Tamil',
  'Pop', 'Rock', 'EDM', 'Lo-fi', 'Classical', 'Jazz', 'Hip-Hop'
];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedGenres, setSelectedGenres] = useState(['Kannada', 'EDM', 'Pop']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter(g => g !== genre));
      }
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register({
        username,
        displayName: displayName || username,
        email,
        password,
        preferredGenres: selectedGenres
      });

      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="glass-panel w-full max-w-lg p-8 rounded-3xl border border-purple-500/30 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white mb-2 shadow-lg shadow-purple-500/30">
            <Headphones size={26} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Join AURA DJ</h2>
          <p className="text-xs text-slate-400 mt-1">
            Personalize your musical profile for intelligent AI curation
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="vibemaster"
                  className="w-full bg-dark-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Vibe Master"
                className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-dark-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-dark-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple"
              />
            </div>
          </div>

          {/* Favorite Genres Selection */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300">
                Your Preferred Music Genres ({selectedGenres.length} selected)
              </label>
              <span className="text-[10px] text-neon-cyan">Used by AI Recommender</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-dark-950/60 rounded-xl border border-slate-800">
              {AVAILABLE_GENRES.map(g => {
                const isSelected = selectedGenres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`text-xs px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all ${
                      isSelected
                        ? 'bg-neon-purple text-white font-semibold shadow-sm'
                        : 'bg-dark-900 text-slate-400 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{g}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center space-x-2 transition-all mt-4"
          >
            <span>{loading ? 'Creating Profile...' : 'Complete Registration'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-neon-pink font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
