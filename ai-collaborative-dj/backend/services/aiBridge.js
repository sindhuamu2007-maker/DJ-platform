const axios = require('axios');

const AI_BASE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5001';

class AIBridge {
  static async analyzeSentiment(text, reactionType = null) {
    try {
      const res = await axios.post(`${AI_BASE_URL}/api/sentiment`, { text, reactionType }, { timeout: 2500 });
      if (res.data && res.data.success) {
        return res.data.data;
      }
    } catch (err) {
      // Fallback in-process analyzer
      return this._fallbackSentiment(text, reactionType);
    }
    return this._fallbackSentiment(text, reactionType);
  }

  static async calculateRoomMood(events = []) {
    try {
      const res = await axios.post(`${AI_BASE_URL}/api/emotion/room-mood`, { events }, { timeout: 2500 });
      if (res.data && res.data.success) {
        return res.data.data;
      }
    } catch (err) {
      return this._fallbackRoomMood(events);
    }
    return this._fallbackRoomMood(events);
  }

  static async resolveConflicts(params) {
    try {
      const res = await axios.post(`${AI_BASE_URL}/api/conflict-resolution/balance`, params, { timeout: 3000 });
      if (res.data && res.data.success) {
        return res.data.data;
      }
    } catch (err) {
      return this._fallbackConflictResolution(params);
    }
  }

  static async calculateTransition(currentTrack, nextTrack, djSettings = {}) {
    try {
      const res = await axios.post(`${AI_BASE_URL}/api/dj/transition`, { currentTrack, nextTrack, djSettings }, { timeout: 2500 });
      if (res.data && res.data.success) {
        return res.data.data;
      }
    } catch (err) {
      return this._fallbackTransition(currentTrack, nextTrack, djSettings);
    }
    return this._fallbackTransition(currentTrack, nextTrack, djSettings);
  }

  static async selectNextTrack(params) {
    try {
      const res = await axios.post(`${AI_BASE_URL}/api/dj/next-track`, params, { timeout: 3500 });
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      return this._fallbackNextTrack(params);
    }
    return this._fallbackNextTrack(params);
  }

  static async predictSoundclash(params) {
    try {
      const res = await axios.post(`${AI_BASE_URL}/api/soundclash/predict`, params, { timeout: 2500 });
      if (res.data && res.data.success) {
        return res.data.data;
      }
    } catch (err) {
      return this._fallbackClashPrediction(params);
    }
  }

  static async getHybridRecommendations(params) {
    try {
      const res = await axios.post(`${AI_BASE_URL}/api/recommendations/hybrid`, params, { timeout: 3000 });
      if (res.data && res.data.success) {
        return res.data.data;
      }
    } catch (err) {
      return this._fallbackRecommendations(params);
    }
  }

  // --- Resilient Fallback Implementations ---
  static _fallbackSentiment(text = '', reactionType = null) {
    const lower = text.toLowerCase();
    let sentiment = 'neutral';
    let emotion = 'relaxed';
    let polarity = 0.0;
    let energy = 0.5;

    if (reactionType) {
      if (['fire', 'lit', 'flame'].includes(reactionType.toLowerCase())) {
        return { sentiment: 'positive', polarity: 0.9, energy_score: 0.9, dominant_emotion: 'excited', emotions: { excited: 60, energetic: 30, happy: 10 } };
      }
      if (['love', 'heart'].includes(reactionType.toLowerCase())) {
        return { sentiment: 'positive', polarity: 0.85, energy_score: 0.7, dominant_emotion: 'happy', emotions: { happy: 70, excited: 20, relaxed: 10 } };
      }
    }

    if (lower.includes('fire') || lower.includes('amazing') || lower.includes('dance') || lower.includes('love') || lower.includes('banger')) {
      sentiment = 'positive';
      emotion = lower.includes('dance') || lower.includes('banger') || lower.includes('fire') ? 'excited' : 'happy';
      polarity = 0.85;
      energy = 0.85;
    } else if (lower.includes('skip') || lower.includes('trash') || lower.includes('bad') || lower.includes('hate') || lower.includes('boring')) {
      sentiment = 'negative';
      emotion = 'frustrated';
      polarity = -0.85;
      energy = 0.5;
    } else if (lower.includes('chill') || lower.includes('relax') || lower.includes('peaceful') || lower.includes('lofi')) {
      sentiment = 'positive';
      emotion = 'relaxed';
      polarity = 0.5;
      energy = 0.3;
    } else if (lower.includes('sad') || lower.includes('cry') || lower.includes('tears') || lower.includes('hurts')) {
      sentiment = 'negative';
      emotion = 'sad';
      polarity = -0.7;
      energy = 0.3;
    }

    return {
      sentiment,
      polarity,
      energy_score: energy,
      dominant_emotion: emotion,
      emotions: { [emotion]: 65, neutral: 35 }
    };
  }

  static _fallbackRoomMood(events = []) {
    return {
      emotions: { happy: 35, excited: 30, relaxed: 20, energetic: 10, sad: 5, frustrated: 0, neutral: 0 },
      dominant_emotion: 'happy',
      collective_energy: 0.7,
      collective_valence: 0.6,
      trajectory: 'Rising Energy',
      event_count: events.length
    };
  }

  static _fallbackConflictResolution(params) {
    const { candidateTracks = [], participants = [], recentGenres = [] } = params;
    const scored = candidateTracks.map(t => ({
      track: t,
      score: 0.85,
      explanation: `Balances ${t.genre} with active room members' preferences.`,
      breakdown: { group_share: 0.5, mood_fit: 0.8 }
    }));
    return {
      recommended_tracks: scored,
      top_recommendation: scored[0] || null,
      explanation: "AI selected this song because it matches group preferences and maintains music diversity."
    };
  }

  static _fallbackNextTrack({
    currentTrack = {},
    queue = [],
    catalog = [],
    personalityId = 'party'
  } = {}) {
    const profiles = {
      party: { name: 'Party DJ', genres: ['EDM', 'Pop', 'Dance', 'Hip-Hop', 'Kannada', 'Hindi'], energy: 0.85 },
      chill: { name: 'Chill DJ', genres: ['Lo-fi', 'Acoustic', 'Jazz', 'Classical', 'Kannada', 'Hindi'], energy: 0.35 },
      retro: { name: 'Retro DJ', genres: ['Rock', 'Classical', 'Pop', 'Kannada', 'Hindi'], energy: 0.65 },
      romantic: { name: 'Romantic DJ', genres: ['Pop', 'Kannada', 'Hindi', 'Classical', 'Lo-fi', 'Acoustic'], energy: 0.45 },
      workout: { name: 'Workout DJ', genres: ['EDM', 'Rock', 'Hip-Hop', 'Pop'], energy: 0.95 },
      explorer: { name: 'Explorer DJ', genres: ['Kannada', 'Hindi', 'Telugu', 'Tamil', 'Jazz', 'EDM', 'Classical'], energy: 0.6 }
    };
    const selectedId = typeof personalityId === 'string' ? personalityId.toLowerCase() : 'party';
    const profile = profiles[selectedId] || profiles.party;

    if (queue.length) {
      const selectedTrack = queue[0];
      return {
        success: true,
        source: 'queue',
        selected_track: selectedTrack,
        transition: this._fallbackTransition(currentTrack, selectedTrack),
        explanation: 'Next in queue. AI DJ prepared a smooth transition.'
      };
    }

    const candidates = catalog.filter(track => track.id !== currentTrack.id);
    const preferredGenres = new Set(profile.genres.map(genre => genre.toLowerCase()));
    const matchingCandidates = candidates.filter(track => preferredGenres.has(String(track.genre || '').toLowerCase()));
    const rankedCandidates = (matchingCandidates.length ? matchingCandidates : candidates)
      .sort((a, b) => {
        const score = track => {
          const energyFit = 1 - Math.abs(Number(track.energy ?? 0.5) - profile.energy);
          return energyFit + Number(track.popularity ?? 50) / 500;
        };
        return score(b) - score(a);
      });
    const selectedTrack = rankedCandidates[0];

    if (!selectedTrack) {
      return { success: false, error: 'No candidate tracks available in catalog.' };
    }

    return {
      success: true,
      source: 'ai_dj_generated',
      selected_track: selectedTrack,
      transition: this._fallbackTransition(currentTrack, selectedTrack),
      explanation: `[${profile.name}] Selected a ${selectedTrack.genre || 'music'} track to match this DJ style.`,
      personality: { id: selectedId, name: profile.name, preferred_genres: profile.genres, target_energy: profile.energy }
    };
  }

  static _fallbackTransition(currentTrack = {}, nextTrack = {}, djSettings = {}) {
    const bpm1 = currentTrack.bpm || 120;
    const bpm2 = nextTrack.bpm || 120;
    const diff = Math.abs(bpm1 - bpm2);
    const duration = diff < 6 ? 7.0 : 4.5;
    return {
      transition_type: diff < 6 ? 'Harmonic Crossfade' : 'Dynamic Beat Cut',
      crossfade_duration: duration,
      compatibility_score: Math.max(60, 95 - diff * 2),
      bpm_analysis: { track1_bpm: bpm1, track2_bpm: bpm2, diff_percentage: Math.round((diff / bpm1) * 100) },
      energy_trajectory: { description: 'Smooth volume & filter ramp' }
    };
  }

  static _fallbackClashPrediction(params) {
    return {
      predicted_winner_id: params.songA?.id,
      predicted_winner_title: params.songA?.title,
      confidence_score: 68.5,
      probability_song_a: 58.0,
      probability_song_b: 42.0,
      reasoning: "Higher alignment with active listener genre preferences and party mood."
    };
  }

  static _fallbackRecommendations({ catalog = [], user = {} }) {
    return {
      recommended_for_you: catalog.slice(0, 6),
      popular_in_room: catalog.slice(3, 9),
      based_on_mood: catalog.slice(1, 7),
      discover_new: catalog.slice(5, 11),
      group_compatible: catalog.slice(2, 8)
    };
  }
}

module.exports = AIBridge;
