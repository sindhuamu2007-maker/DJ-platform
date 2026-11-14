import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, Disc3, Sparkles, Scale, Swords, Mic, Play, Pause, Zap, ArrowRight, Radio, Heart } from 'lucide-react';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { audioEngine } from '../utils/audioEngine';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim().toUpperCase()}`);
    }
  };

  const toggleDemoAudio = () => {
    const audio = document.getElementById('demo-landing-audio');
    if (!audio) return;
    if (isPlayingDemo) {
      audio.pause();
      setIsPlayingDemo(false);
    } else {
      audioEngine.resumeContext();
      audio.play().then(() => setIsPlayingDemo(true)).catch(e => console.warn(e));
    }
  };

  const PERSONALITIES = [
    { name: 'Party DJ', emoji: '🎉', desc: 'High-octane club energy & fast drops', color: 'from-pink-500 to-rose-600' },
    { name: 'Chill DJ', emoji: '☕', desc: 'Lo-fi beats & tranquil ambient waves', color: 'from-cyan-400 to-teal-600' },
    { name: 'Retro DJ', emoji: '📻', desc: 'Classic rock & nostalgic vintage disco', color: 'from-amber-500 to-orange-600' },
    { name: 'Romantic DJ', emoji: '🌹', desc: 'Acoustic ballads & soulful harmonies', color: 'from-red-500 to-pink-600' },
    { name: 'Workout DJ', emoji: '⚡', desc: 'Relentless driving basslines & stamina', color: 'from-green-400 to-emerald-600' },
    { name: 'Explorer DJ', emoji: '🧭', desc: 'Kannada, Hindi & Global underground', color: 'from-purple-500 to-indigo-600' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-white relative overflow-hidden">
      {/* Background Neon Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none" />

      {/* Hidden demo audio player for interactive preview */}
      <audio id="demo-landing-audio" src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" preload="none" />

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-6 shadow-lg shadow-purple-500/10">
          <Sparkles size={14} className="text-neon-cyan animate-pulse" />
          <span>Next-Generation Emotion-Aware Social DJ Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Music that <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-neon-cyan bg-clip-text text-transparent">feels</span> what your room is feeling.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Step into virtual music rooms where AI understands your group's collective emotions, harmonically transitions between tracks, and balances conflicting tastes automatically.
        </p>

        {/* Audio Visualizer Preview */}
        <div className="max-w-md mx-auto my-8 p-4 glass-card rounded-2xl border border-purple-500/30">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neon-green animate-ping" />
              <span className="font-semibold text-slate-300">Live Web Audio Spectrum</span>
            </div>
            <button
              onClick={toggleDemoAudio}
              className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600 text-neon-purple hover:text-white rounded-lg transition-all flex items-center space-x-1 font-semibold"
            >
              {isPlayingDemo ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlayingDemo ? 'Pause Test Audio' : 'Preview Live Audio'}</span>
            </button>
          </div>
          <div className="h-16 w-full">
            <AudioVisualizer isPlaying={isPlayingDemo} height={64} barCount={36} />
          </div>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-500/25 flex items-center justify-center space-x-2 transition-all"
          >
            <Radio size={18} />
            <span>Launch Virtual Room</span>
            <ArrowRight size={16} />
          </Link>

          <form onSubmit={handleJoinByCode} className="w-full sm:w-auto flex items-center space-x-2">
            <input
              type="text"
              placeholder="Enter Room Code (e.g. DJ-A7X2)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="bg-dark-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-purple uppercase font-mono tracking-wider"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all"
            >
              Join
            </button>
          </form>
        </div>
      </header>

      {/* The Two Major Innovations Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-neon-cyan uppercase tracking-widest">Two Groundbreaking AI Innovations</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Genuine Intelligence. Zero Hardcoded Gimmicks.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Innovation 1: Emotion-Adaptive AI DJ */}
          <div className="glass-panel p-8 rounded-3xl border border-pink-500/30 relative overflow-hidden group hover:border-pink-500/60 transition-all">
            <div className="p-3 bg-pink-500/20 rounded-2xl w-fit text-pink-400 mb-5 border border-pink-500/30">
              <Zap size={28} />
            </div>
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">Major Innovation 1</span>
            <h3 className="text-2xl font-bold text-white mt-1 mb-3">Emotion-Adaptive AI DJ</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              NLP-driven sentiment analysis continuously monitors room messages, reactions (❤️, 🔥, ⚡, 😴, 💔), and song skip rates. The AI calculates the collective emotional vector with time decay and adapts the energy curve seamlessly.
            </p>
            <div className="p-4 bg-dark-950/80 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Room Mood: <strong className="text-pink-400">Excited (74%)</strong></span>
                <span className="text-neon-cyan font-mono">BPM Target: 126-134</span>
              </div>
              <div className="w-full bg-dark-900 h-2 rounded-full overflow-hidden flex">
                <div style={{ width: '45%' }} className="bg-pink-500" />
                <div style={{ width: '35%' }} className="bg-purple-500" />
                <div style={{ width: '20%' }} className="bg-cyan-500" />
              </div>
              <p className="text-[11px] text-slate-400 italic">
                AI DJ detected peak party high: automatically ramping energy with Kannada EDM fusion and club anthems.
              </p>
            </div>
          </div>

          {/* Innovation 2: AI Music Conflict Resolution */}
          <div className="glass-panel p-8 rounded-3xl border border-cyan-500/30 relative overflow-hidden group hover:border-cyan-500/60 transition-all">
            <div className="p-3 bg-cyan-500/20 rounded-2xl w-fit text-cyan-400 mb-5 border border-cyan-500/30">
              <Scale size={28} />
            </div>
            <span className="text-xs font-bold text-neon-cyan uppercase tracking-wider">Major Innovation 2</span>
            <h3 className="text-2xl font-bold text-white mt-1 mb-3">AI Music Conflict Resolution</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              When 5 users have conflicting tastes (e.g. Kannada vs Hindi vs EDM), our Weighted Fair Queueing algorithm prevents any single genre monopoly, applies repetition cooldowns, and ensures minority preferences receive guaranteed slots.
            </p>
            <div className="p-4 bg-dark-950/80 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Fair-Share Allocation</span>
                <span className="text-neon-green font-mono">Diversity Score: 94/100</span>
              </div>
              <p className="text-slate-300 font-medium">
                "AI selected 'Avicii - Starlight' because: Gives Charlie their preferred EDM music after 2 Kannada and 1 Hindi track."
              </p>
              <div className="flex gap-1.5 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 font-mono">Kannada: 40%</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pink-900/40 text-pink-300 font-mono">Hindi: 40%</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 font-mono">EDM: 20%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DJ Personalities Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 border-t border-slate-900">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Customizable Intelligence</span>
          <h2 className="text-3xl font-extrabold text-white mt-2">6 Distinct AI DJ Personalities</h2>
          <p className="text-xs text-slate-400 mt-2">Each personality adopts unique BPM curves, genre weights, and commentary.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PERSONALITIES.map((p) => (
            <div key={p.name} className="glass-card p-4 rounded-2xl text-center border border-slate-800 hover:border-purple-500/40 transition-all group">
              <div className="text-3xl mb-2 group-hover:scale-125 transition-transform">{p.emoji}</div>
              <h4 className="font-bold text-xs text-white mb-1">{p.name}</h4>
              <p className="text-[11px] text-slate-400 leading-snug">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 border-t border-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <Swords className="text-pink-400 mb-3" size={24} />
            <h4 className="font-bold text-sm text-white mb-1">Soundclash Music Battles</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time song-vs-song arena with participant voting, AI prediction confidence scoring, and automatic queue injection for winners.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <Disc3 className="text-neon-cyan mb-3" size={24} />
            <h4 className="font-bold text-sm text-white mb-1">Harmonic Track Transitions</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyzes BPM compatibility, Camelot wheel keys, and energy deltas to execute smooth equal-power Web Audio API crossfades.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <Mic className="text-neon-green mb-3" size={24} />
            <h4 className="font-bold text-sm text-white mb-1">Voice-Controlled AI DJ</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hands-free voice recognition: "Play energetic songs", "Skip track", "Add Kannada songs", and "Make playlist relaxing".
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
