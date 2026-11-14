const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const TrackModel = require('../models/Track');
const { SEED_TRACKS } = require('../data/seedTracks');

const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup';

class MusicProviderService {
  constructor() {
    this.country = process.env.ITUNES_COUNTRY || 'IN';
    this.developerTokenCache = null;
    this.developerTokenExpiresAt = 0;
  }

  normalizeAppleTrack(track) {
    if (!track?.trackId || !track.trackName || !track.artistName) return null;

    return {
      id: `itunes-${track.trackId}`,
      externalId: String(track.trackId),
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName || 'Single',
      duration: Math.round((track.trackTimeMillis || 30000) / 1000),
      previewDuration: track.previewUrl ? 30 : null,
      artwork: (track.artworkUrl100 || track.artworkUrl60 || '').replace('100x100bb', '400x400bb'),
      audioUrl: track.previewUrl || null,
      trackViewUrl: track.trackViewUrl,
      genre: track.primaryGenreName || 'Music',
      language: '',
      bpm: 120,
      key: '8B',
      energy: 0.7,
      danceability: 0.7,
      valence: 0.6,
      popularity: 70,
      provider: 'itunes'
    };
  }

  async searchAppleTracks(term, limit) {
    const response = await axios.get(ITUNES_SEARCH_URL, {
      params: {
        term,
        entity: 'song',
        country: this.country,
        limit
      },
      timeout: 8000
    });

    return (response.data.results || [])
      .map(track => this.normalizeAppleTrack(track))
      .filter(Boolean);
  }

  async searchTracks({ query = '', genre = '', language = '', limit = 20 }) {
    const term = [query, genre, language]
      .map(value => String(value || '').trim())
      .filter(Boolean)
      .join(' ') || 'top songs';
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    return this.searchAppleTracks(term, safeLimit);
  }

  async getTrackById(id) {
    const trackId = String(id || '');
    const appleMatch = trackId.match(/^itunes-(\d+)$/);

    if (appleMatch) {
      const response = await axios.get(ITUNES_LOOKUP_URL, {
        params: { id: appleMatch[1], country: this.country },
        timeout: 8000
      });
      return this.normalizeAppleTrack(response.data.results?.[0]);
    }

    if (global.USE_MEMORY_STORE || mongoose.Types.ObjectId.isValid(trackId)) {
      const storedTrack = await TrackModel.findById(trackId);
      if (storedTrack) {
        const [playableTrack] = await this.searchAppleTracks(
          `${storedTrack.title} ${storedTrack.artist}`,
          5
        );
        if (playableTrack) return playableTrack;
      }
    }

    const legacyTrack = SEED_TRACKS.find(track => track.id === trackId);
    if (legacyTrack) {
      const [playableTrack] = await this.searchAppleTracks(
        `${legacyTrack.title} ${legacyTrack.artist}`,
        5
      );
      return playableTrack || null;
    }

    return null;
  }

  async getAllCatalog() {
    return this.searchTracks({ query: 'top songs', limit: 25 });
  }

  getProviderStatus() {
    return {
      activeProvider: 'Apple Music',
      fullTrackPlaybackAvailable: Boolean(
        process.env.APPLE_MUSIC_DEVELOPER_TOKEN ||
        (process.env.APPLE_MUSIC_TEAM_ID && process.env.APPLE_MUSIC_KEY_ID && process.env.APPLE_MUSIC_PRIVATE_KEY)
      ),
      previewDurationSeconds: 30,
      genresCovered: ['Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Pop', 'Rock', 'EDM', 'Classical', 'Jazz', 'Lo-fi']
    };
  }

  getAppleMusicConfig() {
    const storefront = this.country;
    const suppliedToken = process.env.APPLE_MUSIC_DEVELOPER_TOKEN;
    if (suppliedToken) {
      return { developerToken: suppliedToken, storefront };
    }

    const teamId = process.env.APPLE_MUSIC_TEAM_ID;
    const keyId = process.env.APPLE_MUSIC_KEY_ID;
    const privateKeyValue = process.env.APPLE_MUSIC_PRIVATE_KEY;
    if (!teamId || !keyId || !privateKeyValue) {
      return { developerToken: null, storefront };
    }

    const now = Math.floor(Date.now() / 1000);
    if (this.developerTokenCache && this.developerTokenExpiresAt > now + 60) {
      return { developerToken: this.developerTokenCache, storefront };
    }

    const privateKey = privateKeyValue.replace(/\\n/g, '\n');
    this.developerTokenCache = jwt.sign(
      { iss: teamId, iat: now, exp: now + 60 * 60 * 24 * 180 },
      privateKey,
      { algorithm: 'ES256', header: { kid: keyId } }
    );
    this.developerTokenExpiresAt = now + 60 * 60 * 24 * 180;
    return { developerToken: this.developerTokenCache, storefront };
  }
}

const musicService = new MusicProviderService();
module.exports = musicService;
