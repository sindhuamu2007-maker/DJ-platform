const TrackModel = require('../models/Track');
const { SEED_TRACKS } = require('../data/seedTracks');

class MusicProviderService {
  constructor() {
    this.activeProvider = process.env.MUSIC_PROVIDER || 'demo';
    this.spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
    this.spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  }

  async initializeCatalog() {
    try {
      const existing = await TrackModel.find();
      if (!existing || existing.length === 0) {
        console.log(`[MusicProvider] Seeding ${SEED_TRACKS.length} multi-genre demo tracks into database...`);
        for (const track of SEED_TRACKS) {
          await TrackModel.create(track);
        }
        console.log(`[MusicProvider] Seed completed successfully.`);
      }
    } catch (err) {
      console.warn(`[MusicProvider] Seed error:`, err.message);
    }
  }

  async searchTracks({ query = '', genre = '', language = '', limit = 20 }) {
    let tracks = await TrackModel.find();
    if (!tracks || tracks.length === 0) {
      tracks = SEED_TRACKS;
    }

    let filtered = tracks;
    if (query) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.artist && t.artist.toLowerCase().includes(q)) ||
        (t.album && t.album.toLowerCase().includes(q)) ||
        (t.genre && t.genre.toLowerCase().includes(q))
      );
    }

    if (genre && genre !== 'All') {
      filtered = filtered.filter(t => t.genre && t.genre.toLowerCase() === genre.toLowerCase());
    }

    if (language && language !== 'All') {
      filtered = filtered.filter(t => t.language && t.language.toLowerCase() === language.toLowerCase());
    }

    return filtered.slice(0, limit);
  }

  async getTrackById(id) {
    let track;
    if (typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)) {
      track = await TrackModel.findById(id);
    }
    if (!track) {
      track = (await TrackModel.find()).find(t => String(t.id) === String(id) || String(t._id) === String(id));
    }
    if (!track) {
      track = SEED_TRACKS.find(t => t.id === id);
    }
    return track;
  }

  async getAllCatalog() {
    let tracks = await TrackModel.find();
    if (!tracks || tracks.length === 0) {
      return SEED_TRACKS;
    }
    return tracks;
  }

  getProviderStatus() {
    return {
      activeProvider: this.activeProvider,
      isSpotifyConfigured: Boolean(this.spotifyClientId && this.spotifyClientSecret),
      sampleAudioCount: SEED_TRACKS.length,
      genresCovered: ['Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Pop', 'Rock', 'EDM', 'Classical', 'Jazz', 'Lo-fi']
    };
  }
}

const musicService = new MusicProviderService();
module.exports = musicService;
