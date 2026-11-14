const mongoose = require('mongoose');
const { collections } = require('../utils/memoryStore');

const analyticsSchema = new mongoose.Schema({
  userId: { type: String },
  roomId: { type: String },
  eventType: { type: String, required: true }, // 'play', 'skip', 'reaction', 'clash_vote', 'clash_win'
  metadata: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const MongooseAnalytics = mongoose.model('Analytics', analyticsSchema);

class AnalyticsModel {
  static async create(data) {
    if (global.USE_MEMORY_STORE) {
      return collections.analytics.create(data);
    }
    const an = new MongooseAnalytics(data);
    await an.save();
    return an;
  }

  static async find(query = {}) {
    if (global.USE_MEMORY_STORE) {
      return collections.analytics.find(query);
    }
    return MongooseAnalytics.find(query);
  }
}

module.exports = AnalyticsModel;
