import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Headphones, Disc3, Sparkles, Swords, BarChart3, Radio, LogOut, User, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRoom } from '../context/RoomContext';
import { MoodIndicator } from './MoodIndicator';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { currentRoom, groupMood } = useRoom();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel border-b border-purple-500/15 sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-cyan-400 text-white shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
            <Headphones size={22} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-purple-200 to-pink-400 bg-clip-text text-transparent">
                AURA DJ
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-neon-purple font-mono font-bold uppercase">
                AI 2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block tracking-wider uppercase">
              Emotion-Aware Group Music
            </p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
          <Link
            to="/dashboard"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              isActive('/dashboard') ? 'bg-purple-600/30 text-neon-purple border border-purple-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio size={14} />
            <span>Rooms</span>
          </Link>

          {currentRoom && (
            <Link
              to={`/room/${currentRoom.roomId}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                location.pathname.startsWith('/room/') ? 'bg-pink-600/30 text-neon-pink border border-pink-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Disc3 size={14} className="animate-spin-slow" />
              <span>Live Room</span>
            </Link>
          )}

          <Link
            to="/ai-dj"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              isActive('/ai-dj') ? 'bg-cyan-600/30 text-neon-cyan border border-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles size={14} />
            <span>AI DJ Hub</span>
          </Link>

          <Link
            to="/recommendations"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              isActive('/recommendations') ? 'bg-purple-600/30 text-neon-purple border border-purple-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass size={14} />
            <span>Discover</span>
          </Link>

          <Link
            to="/soundclash"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              isActive('/soundclash') ? 'bg-pink-600/30 text-neon-pink border border-pink-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Swords size={14} />
            <span>Soundclash</span>
          </Link>

          <Link
            to="/analytics"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              isActive('/analytics') ? 'bg-purple-600/30 text-neon-purple border border-purple-500/30' : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 size={14} />
            <span>Analytics</span>
          </Link>
        </div>

        {/* Right Section: Room Mood + User Auth */}
        <div className="flex items-center space-x-3">
          {currentRoom && (
            <div className="hidden sm:block">
              <MoodIndicator mood={groupMood} compact={true} />
            </div>
          )}

          {user ? (
            <div className="flex items-center space-x-2">
              <Link
                to="/profile"
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-white/5 border border-slate-800 transition-all"
              >
                <img
                  src={user.profilePic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={user.username}
                  className="w-7 h-7 rounded-lg object-cover border border-purple-500/40"
                />
                <span className="text-xs font-semibold text-slate-200 hidden md:inline truncate max-w-[100px]">
                  {user.displayName || user.username}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-500/20 transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
