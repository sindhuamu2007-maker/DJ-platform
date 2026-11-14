import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, Send } from 'lucide-react';
import { useRoom } from '../context/RoomContext';

export const VoiceControlModal = ({ isOpen, onClose }) => {
  const { sendVoiceCommand } = useRoom();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [textFallback, setTextFallback] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setTranscript('');
      setFeedback(null);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedback({ type: 'warning', text: 'Browser Speech Recognition not supported. Use text command below.' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setFeedback({ type: 'info', text: 'Listening for DJ command...' });
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
    };

    recognition.onerror = (event) => {
      console.warn('Speech error:', event.error);
      setIsListening(false);
      setFeedback({ type: 'error', text: `Voice recognition notice: ${event.error}. You can type below.` });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.start();
    }

    return () => {
      recognition.stop();
    };
  }, [isOpen, isListening]);

  if (!isOpen) return null;

  const handleExecuteVoice = () => {
    if (transcript.trim()) {
      sendVoiceCommand(transcript);
      setFeedback({ type: 'success', text: `AI DJ received: "${transcript}"` });
      setTimeout(() => onClose(), 1400);
    }
  };

  const handleExecuteText = (e) => {
    e.preventDefault();
    if (textFallback.trim()) {
      sendVoiceCommand(textFallback);
      setFeedback({ type: 'success', text: `AI DJ executing: "${textFallback}"` });
      setTextFallback('');
      setTimeout(() => onClose(), 1200);
    }
  };

  const QUICK_COMMANDS = [
    "Play energetic songs",
    "Skip this song",
    "Add Kannada songs",
    "Make playlist relaxing",
    "Start Soundclash"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-purple-500/30 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-purple-500/10 rounded-full border border-purple-500/30 text-purple-400 mb-3">
            <Volume2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">Voice-Controlled AI DJ</h3>
          <p className="text-xs text-slate-400 mt-1">
            Speak natural voice instructions or pick quick commands below
          </p>
        </div>

        {/* Microphone Button */}
        <div className="flex flex-col items-center justify-center mb-6">
          <button
            onClick={() => setIsListening(!isListening)}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-500/20 shadow-lg shadow-red-500/50'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/30'
            }`}
          >
            {isListening ? <Mic size={32} /> : <MicOff size={32} />}
          </button>
          <span className="text-xs text-slate-400 mt-3 font-medium">
            {isListening ? 'Listening now... Speak your request' : 'Click microphone to talk'}
          </span>
        </div>

        {/* Live Transcript */}
        {transcript && (
          <div className="p-3 bg-dark-900 rounded-xl border border-slate-700 mb-4 text-center">
            <span className="text-xs text-slate-400">Recognized speech:</span>
            <p className="text-sm font-semibold text-white mt-1 italic">"{transcript}"</p>
            <button
              onClick={handleExecuteVoice}
              className="mt-2 px-3 py-1 bg-neon-purple text-white text-xs font-semibold rounded-lg"
            >
              Confirm & Execute
            </button>
          </div>
        )}

        {/* Feedback message */}
        {feedback && (
          <div className="p-2.5 rounded-lg bg-dark-900 border border-purple-500/20 text-xs text-purple-300 text-center mb-4">
            {feedback.text}
          </div>
        )}

        {/* Quick Command Pills */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Example Commands:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_COMMANDS.map(cmd => (
              <button
                key={cmd}
                onClick={() => {
                  sendVoiceCommand(cmd);
                  setFeedback({ type: 'success', text: `Executing: "${cmd}"` });
                  setTimeout(() => onClose(), 1000);
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-dark-900 hover:bg-purple-600 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center space-x-1"
              >
                <Sparkles size={11} className="text-neon-cyan" />
                <span>{cmd}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text Fallback Form */}
        <form onSubmit={handleExecuteText} className="flex items-center space-x-2 pt-3 border-t border-slate-800">
          <input
            type="text"
            placeholder="Or type DJ command here..."
            value={textFallback}
            onChange={(e) => setTextFallback(e.target.value)}
            className="flex-1 bg-dark-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="p-2 bg-neon-purple hover:bg-purple-600 text-white rounded-lg transition-all"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
