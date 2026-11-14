import React, { useEffect, useState } from 'react';
import { Swords, Vote, Trophy, Sparkles, CheckCircle2, Music2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';

export const SoundclashArena = ({ onOpenCreateModal }) => {
  const { currentRoom, soundclash, voteSoundclash, endSoundclash } = useRoom();
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [voting, setVoting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState('');
  const [previewingId, setPreviewingId] = useState('');
  const previewRef = React.useRef(null);

  const userId = String(user?._id || user?.id || '');
  const savedVotesA = soundclash?.votesA || [];
  const savedVotesB = soundclash?.votesB || [];
  const storedVote = savedVotesA.some(id => String(id) === userId)
    ? 'A'
    : savedVotesB.some(id => String(id) === userId) ? 'B' : null;

  useEffect(() => {
    setUserVote(storedVote);
    setHasVoted(Boolean(storedVote));
    setError('');
  }, [soundclash?.clashId, storedVote]);

  useEffect(() => () => {
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current = null;
    }
  }, []);

  const togglePreview = async (track) => {
    const trackId = String(track?.id || track?._id || '');
    if (!track?.audioUrl) {
      setError('This contender does not have a playable audio source.');
      return;
    }
    if (previewingId === trackId && previewRef.current) {
      previewRef.current.pause();
      setPreviewingId('');
      return;
    }

    if (!previewRef.current) previewRef.current = new Audio();
    const audio = previewRef.current;
    audio.pause();
    audio.src = track.audioUrl;
    audio.currentTime = 0;
    audio.onended = () => setPreviewingId('');
    audio.onerror = () => {
      setPreviewingId('');
      setError(`Could not play "${track.title}".`);
    };
    try {
      setError('');
      await audio.play();
      setPreviewingId(trackId);
    } catch (err) {
      console.error('Contender preview failed:', err);
      setError('Could not play this preview. Check your connection and try again.');
    }
  };

  const handleVote = async (choice) => {
    if (hasVoted || voting) return;
    setVoting(true);
    setError('');
    try {
      const result = await voteSoundclash(choice);
      if (result?.success) {
        setUserVote(choice);
        setHasVoted(true);
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      } else {
        setError(result?.message || 'Your vote could not be submitted.');
      }
    } finally {
      setVoting(false);
    }
  };

  const handleEndBattle = async () => {
    setEnding(true);
    setError('');
    try {
      const result = await endSoundclash();
      if (!result.success) setError(result.message || 'The battle could not be concluded.');
    } catch (err) {
      console.error('Failed to conclude Soundclash:', err);
      setError(err.message || 'Unable to conclude the battle.');
    } finally {
      setEnding(false);
    }
  };

  if (!soundclash || !soundclash.active) {
    return (
      <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 text-center relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-pink-500/10 rounded-full border border-pink-500/30 text-pink-400">
            <Swords size={28} className="animate-pulse" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Soundclash Battle Arena</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
          {soundclash?.lastWinner
            ? `The winner, ${soundclash.lastWinner.title}, has been added to the room queue.`
            : 'Pit two tracks against each other. You can listen and vote solo, or invite your group to vote together.'}
        </p>
        {soundclash?.lastWinner && <Trophy size={22} className="mx-auto mb-3 text-amber-400" />}
        {currentRoom && <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-lg shadow-pink-500/20 transition-all flex items-center space-x-1.5 mx-auto"
        >
          <Swords size={15} />
          <span>Start New Battle</span>
        </button>}
      </div>
    );
  }

  const { songA, songB, votesA = [], votesB = [], votesACount = 0, votesBCount = 0, aiPrediction, round = 1 } = soundclash;
  const totalVotes = (votesACount || votesA.length) + (votesBCount || votesB.length);
  const pctA = totalVotes > 0 ? Math.round(((votesACount || votesA.length) / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? 100 - pctA : 50;

  const isHost = String(currentRoom?.host?.id || '') === userId;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-pink-500/30 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-pink-500/20 rounded-lg text-pink-400">
            <Swords size={18} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-pink-400">Live Soundclash</span>
            <span className="text-xs text-slate-400 ml-2 font-mono">Round #{round}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20 flex items-center space-x-1">
            <Vote size={13} />
            <span>{totalVotes} Votes</span>
          </div>
          {isHost && (
            <button
              onClick={handleEndBattle}
              disabled={ending}
              className="rounded-lg border border-amber-500/40 px-2.5 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
            >
              {ending ? 'Finishing...' : 'Finish battle'}
            </button>
          )}
        </div>
      </div>

      {/* AI Prediction Spotlight */}
      {aiPrediction && (
        <div className="mb-4 p-2.5 bg-dark-900/80 rounded-xl border border-purple-500/30 flex items-start space-x-2.5">
          <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400 mt-0.5">
            <Sparkles size={16} />
          </div>
          <div className="text-xs flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-purple-300">AI Win Prediction:</span>
              <span className="text-neon-cyan font-bold font-mono">{aiPrediction.confidence_score}% Confidence</span>
            </div>
            <p className="text-slate-300 mt-0.5">
              Favors <span className="text-white font-semibold">{aiPrediction.predicted_winner_title}</span>
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5 italic">{aiPrediction.reasoning}</p>
          </div>
        </div>
      )}

      {/* Competing Songs Arena */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Track A */}
        <div className={`p-3 rounded-xl border transition-all ${userVote === 'A' ? 'bg-pink-900/30 border-pink-500 ring-1 ring-pink-500' : 'bg-dark-900/60 border-slate-700/50 hover:border-pink-500/40'}`}>
          <img src={songA?.artwork} alt={songA?.title} className="w-full h-24 object-cover rounded-lg mb-2" />
          <h4 className="font-bold text-xs text-white truncate">{songA?.title}</h4>
          <p className="text-[11px] text-slate-400 truncate">{songA?.artist}</p>
          <button onClick={() => togglePreview(songA)} className="mt-2 text-[10px] font-semibold text-pink-300 hover:text-white">
            {previewingId === String(songA?.id || songA?._id || '') ? 'Pause preview' : 'Preview Song A'}
          </button>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">{songA?.genre}</span>
            <span className="text-xs font-bold text-pink-400">{pctA}%</span>
          </div>
          <button
            onClick={() => handleVote('A')}
            disabled={hasVoted || voting}
            className={`w-full mt-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
              userVote === 'A'
                ? 'bg-pink-500 text-white'
                : hasVoted || voting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-pink-500/20 hover:bg-pink-500 text-pink-300 hover:text-white border border-pink-500/30'
            }`}
          >
            {userVote === 'A' ? <CheckCircle2 size={14} /> : <Vote size={14} />}
            <span>{userVote === 'A' ? 'Voted A' : voting ? 'Voting...' : 'Vote Song A'}</span>
          </button>
        </div>

        {/* Track B */}
        <div className={`p-3 rounded-xl border transition-all ${userVote === 'B' ? 'bg-purple-900/30 border-purple-500 ring-1 ring-purple-500' : 'bg-dark-900/60 border-slate-700/50 hover:border-purple-500/40'}`}>
          <img src={songB?.artwork} alt={songB?.title} className="w-full h-24 object-cover rounded-lg mb-2" />
          <h4 className="font-bold text-xs text-white truncate">{songB?.title}</h4>
          <p className="text-[11px] text-slate-400 truncate">{songB?.artist}</p>
          <button onClick={() => togglePreview(songB)} className="mt-2 text-[10px] font-semibold text-purple-300 hover:text-white">
            {previewingId === String(songB?.id || songB?._id || '') ? 'Pause preview' : 'Preview Song B'}
          </button>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">{songB?.genre}</span>
            <span className="text-xs font-bold text-purple-400">{pctB}%</span>
          </div>
          <button
            onClick={() => handleVote('B')}
            disabled={hasVoted || voting}
            className={`w-full mt-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all ${
              userVote === 'B'
                ? 'bg-purple-500 text-white'
                : hasVoted || voting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/30'
            }`}
          >
            {userVote === 'B' ? <CheckCircle2 size={14} /> : <Vote size={14} />}
            <span>{userVote === 'B' ? 'Voted B' : voting ? 'Voting...' : 'Vote Song B'}</span>
          </button>
        </div>
      </div>

      {/* Battle Live Voting Tally Bar */}
      <div className="h-2 w-full bg-dark-950 rounded-full overflow-hidden flex border border-white/5">
        <div style={{ width: `${pctA}%` }} className="bg-pink-500 transition-all duration-300" />
        <div style={{ width: `${pctB}%` }} className="bg-purple-500 transition-all duration-300" />
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  );
};
