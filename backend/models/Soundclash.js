const mongoose = require('mongoose');
const { collections } = require('../utils/memoryStore');

const soundclashSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  round: { type: Number, default: 1 },
  songA: { type: Object, required: true },
  songB: { type: Object, required: true },
  votes: [{
    userId: String,
    username: String,
    songChoice: { type: String, enum: ['A', 'B'] },
    timestamp: { type: Date, default: Date.now }
  }],
  aiPrediction: { type: mongoose.Schema.Types.Mixed, default: null },
  winner: { type: Object, default: null },
  winnerChoice: { type: String, default: null },
  votesACount: { type: Number, default: 0 },
  votesBCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
}, { timestamps: true });

const MongooseSoundclash = mongoose.model('Soundclash', soundclashSchema);

class SoundclashModel {
  static async find(query = {}) {
    if (global.USE_MEMORY_STORE) {
      return collections.soundclashes.find(query);
    }
    return MongooseSoundclash.find(query);
  }

  static async findById(id) {
    if (global.USE_MEMORY_STORE) {
      return collections.soundclashes.findById(id);
    }
    return MongooseSoundclash.findById(id);
  }

  static async create(data) {
    if (global.USE_MEMORY_STORE) {
      return collections.soundclashes.create(data);
    }
    const sc = new MongooseSoundclash(data);
    await sc.save();
    return sc;
  }

  static async findByIdAndUpdate(id, update, options = { new: true }) {
    if (global.USE_MEMORY_STORE) {
      return collections.soundclashes.findByIdAndUpdate(id, update, options);
    }
    return MongooseSoundclash.findByIdAndUpdate(id, update, options);
  }
}

module.exports = SoundclashModel;
