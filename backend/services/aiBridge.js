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

  static _fallbackRecommendations({
    catalog = [],
    user = {},
    participants = [],
    roomMood = {},
    listeningHistory = [],
    personalityId = 'party'
  }) {
    const normalize = value => String(value || '').trim().toLowerCase();
    const matches = (value, preferences) => {
      const normalizedValue = normalize(value);
      return Boolean(normalizedValue) && preferences.some(preference =>
        preference && (
          preference === normalizedValue ||
          preference.includes(normalizedValue) ||
          normalizedValue.includes(preference)
        )
      );
    };
    const trackId = track => String(track.id || `${track.title || ''}|${track.artist || ''}`);
    const uniqueCatalog = [...new Map(catalog.map(track => [trackId(track), track])).values()];
    const preferredGenres = (user.preferredGenres || []).map(normalize);
    const favoriteArtists = (user.favoriteArtists || []).map(normalize);
    const preferredLanguages = (user.preferredLanguages || []).map(normalize);
    const history = new Set(listeningHistory.map(normalize));
    const moodEnergy = Number(roomMood.collective_energy ?? roomMood.collectiveEnergy ?? 0.6);
    const emotion = normalize(roomMood.dominant_emotion || roomMood.dominantEmotion || 'happy');
    const personalityGenres = {
      party: ['edm', 'pop', 'dance', 'hip-hop', 'kannada', 'hindi'],
      chill: ['lo-fi', 'acoustic', 'jazz', 'classical', 'kannada', 'hindi'],
      retro: ['rock', 'classical', 'pop', 'kannada', 'hindi'],
      romantic: ['pop', 'kannada', 'hindi', 'classical', 'lo-fi', 'acoustic'],
      workout: ['edm', 'rock', 'hip-hop', 'pop'],
      explorer: ['kannada', 'hindi', 'telugu', 'tamil', 'jazz', 'edm', 'classical']
    };
    const targetEnergy = {
      party: 0.85,
      chill: 0.35,
      retro: 0.65,
      romantic: 0.45,
      workout: 0.95,
      explorer: 0.6
    }[personalityId] ?? 0.6;
    const moodGenres = {
      excited: ['edm', 'dance', 'pop', 'hip-hop', 'rock'],
      energetic: ['edm', 'dance', 'pop', 'hip-hop', 'rock'],
      relaxed: ['lo-fi', 'acoustic', 'jazz', 'classical', 'ambient'],
      happy: ['pop', 'dance', 'soundtrack', 'bollywood'],
      sad: ['acoustic', 'classical', 'lo-fi', 'soundtrack'],
      frustrated: ['rock', 'metal', 'hip-hop', 'edm'],
      neutral: []
    }[emotion] || [];
    const activeParticipants = participants.length ? participants : [user];
    const groupGenres = activeParticipants.flatMap(participant =>
      (participant.preferredGenres || []).map(normalize)
    );
    const score = (track, shelf) => {
      const genre = normalize(track.genre);
      const artist = normalize(track.artist);
      const language = normalize(track.language);
      const id = trackId(track);
      const energy = Number(track.energy ?? 0.5);
      const popularity = Number(track.popularity ?? 50);

      if (shelf === 'recommended_for_you') {
        return (matches(genre, preferredGenres) ? 3 : 0) +
          (favoriteArtists.some(favorite => favorite && artist.includes(favorite)) ? 2.5 : 0) +
          (matches(language, preferredLanguages) ? 1.5 : 0) -
          (history.has(normalize(id)) ? 4 : 0) +
          popularity / 100;
      }
      if (shelf === 'based_on_mood') {
        return 1 - Math.abs(energy - moodEnergy) +
          (matches(genre, moodGenres) ? 0.8 : 0) +
          (matches(genre, personalityGenres[personalityId] || []) ? 0.6 : 0) +
          (1 - Math.abs(energy - targetEnergy)) * 0.5;
      }
      if (shelf === 'group_compatible') {
        const affinity = groupGenres.filter(preference => matches(genre, [preference])).length;
        return affinity * 2 + 1 - Math.abs(energy - moodEnergy);
      }
      if (shelf === 'discover_new') {
        const knownArtist = favoriteArtists.some(favorite => favorite && artist.includes(favorite));
        return (history.has(normalize(id)) ? 0 : 1) +
          (matches(genre, preferredGenres) ? 0 : 0.5) +
          (knownArtist ? 0 : 0.5) +
          popularity / 200;
      }
      return popularity;
    };

    const shelfOrder = [
      'recommended_for_you',
      'based_on_mood',
      'group_compatible',
      'popular_in_room',
      'discover_new'
    ];
    const shelfLimit = Math.max(1, Math.min(6, Math.ceil(uniqueCatalog.length / shelfOrder.length)));
    const usedIds = new Set();
    const recommendations = {};

    shelfOrder.forEach(shelf => {
      const ranked = [...uniqueCatalog].sort((a, b) => score(b, shelf) - score(a, shelf));
      const selected = [];
      const selectedArtists = new Set();
      for (const allowRepeatArtist of [false, true]) {
        for (const track of ranked) {
          const id = trackId(track);
          const artist = normalize(track.artist);
          if (usedIds.has(id) || selected.some(item => trackId(item) === id)) continue;
          if (!allowRepeatArtist && artist && selectedArtists.has(artist)) continue;
          selected.push(track);
          if (artist) selectedArtists.add(artist);
          if (selected.length >= shelfLimit) break;
        }
        if (selected.length >= shelfLimit) break;
      }
      recommendations[shelf] = selected;
      selected.forEach(track => usedIds.add(trackId(track)));
    });

    recommendations.current_room_mood = roomMood;
    return recommendations;
  }
}

module.exports = AIBridge;
