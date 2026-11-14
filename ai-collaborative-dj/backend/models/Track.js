const mongoose = require('mongoose');
const { collections } = require('../utils/memoryStore');

const trackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String, default: 'Single' },
  duration: { type: Number, required: true }, // in seconds
  artwork: { type: String, default: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80' },
  audioUrl: { type: String, required: true },
  genre: { type: String, required: true },
  language: { type: String, default: 'English' },
  bpm: { type: Number, default: 120 },
  key: { type: String, default: '8B' }, // Camelot or standard
  energy: { type: Number, default: 0.7 }, // 0.0 to 1.0
  danceability: { type: Number, default: 0.7 },
  valence: { type: Number, default: 0.6 },
  popularity: { type: Number, default: 70 },
  provider: { type: String, enum: ['demo', 'spotify', 'local'], default: 'demo' },
  externalId: { type: String }
}, { timestamps: true });

const MongooseTrack = mongoose.model('Track', trackSchema);

class TrackModel {
  static async find(query = {}) {
    if (global.USE_MEMORY_STORE) {
      return collections.tracks.find(query);
    }
    return MongooseTrack.find(query);
  }

  static async findById(id) {
    if (global.USE_MEMORY_STORE) {
      return collections.tracks.findById(id);
    }
    return MongooseTrack.findById(id);
  }

  static async findOne(query) {
    if (global.USE_MEMORY_STORE) {
      return collections.tracks.findOne(query);
    }
    return MongooseTrack.findOne(query);
  }

  static async create(data) {
    if (global.USE_MEMORY_STORE) {
      return collections.tracks.create(data);
    }
    const track = new MongooseTrack(data);
    await track.save();
    return track;
  }
}

module.exports = TrackModel;
