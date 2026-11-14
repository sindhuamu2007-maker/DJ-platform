const mongoose = require('mongoose');
const { collections } = require('../utils/memoryStore');

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: 'Collaborative AI DJ Room' },
  host: {
    id: String,
    username: String,
    displayName: String
  },
  participants: [{
    id: String,
    username: String,
    displayName: String,
    profilePic: String,
    preferredGenres: [String],
    joinedAt: { type: Date, default: Date.now }
  }],
  currentTrack: { type: Object, default: null },
  playbackState: {
    isPlaying: { type: Boolean, default: false },
    currentTime: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
    deckA: { type: Object, default: null },
    deckB: { type: Object, default: null },
    crossfadePosition: { type: Number, default: 0 } // 0 = Deck A, 1 = Deck B
  },
  queue: [{
    id: String,
    title: String,
    artist: String,
    album: String,
    duration: Number,
    artwork: String,
    audioUrl: String,
    youtubeVideoId: String,
    genre: String,
    bpm: Number,
    key: String,
    energy: Number,
    addedBy: {
      id: String,
      username: String,
      displayName: String
    },
    addedAt: { type: Date, default: Date.now }
  }],
  chatMessages: [{
    id: String,
    sender: {
      id: String,
      username: String,
      displayName: String,
      profilePic: String
    },
    text: String,
    sentiment: String,
    dominantEmotion: String,
    timestamp: { type: Date, default: Date.now }
  }],
  reactions: [{
    id: String,
    emoji: String,
    reactionType: String,
    sender: {
      id: String,
      username: String
    },
    trackId: String,
    timestamp: { type: Date, default: Date.now }
  }],
  groupMood: {
    emotions: {
      happy: { type: Number, default: 30 },
      excited: { type: Number, default: 25 },
      energetic: { type: Number, default: 20 },
      relaxed: { type: Number, default: 20 },
      sad: { type: Number, default: 5 },
      frustrated: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 }
    },
    dominantEmotion: { type: String, default: 'happy' },
    collectiveEnergy: { type: Number, default: 0.65 },
    collectiveValence: { type: Number, default: 0.5 },
    trajectory: { type: String, default: 'Warming Up' },
    lastCalculated: { type: Date, default: Date.now }
  },
  conflictResolution: {
    explanation: { type: String, default: 'Group preference balancing active.' },
    topRecommendation: { type: Object, default: null },
    groupGenreDistribution: { type: Object, default: {} },
    active: { type: Boolean, default: true }
  },
  djSettings: {
    enabled: { type: Boolean, default: true },
    personality: { type: String, default: 'party' },
    autoTransition: { type: Boolean, default: true },
    transitionDuration: { type: Number, default: 6 },
    energyPreference: { type: Number, default: 0.75 },
    autoQueueFromMood: { type: Boolean, default: true },
    allowGuestAdd: { type: Boolean, default: true }
  },
  soundclash: {
    active: { type: Boolean, default: false },
    round: { type: Number, default: 1 },
    songA: { type: Object, default: null },
    songB: { type: Object, default: null },
    votesA: { type: [String], default: [] }, // userIds
    votesB: { type: [String], default: [] },
    aiPrediction: { type: Object, default: null },
    startedAt: { type: Date, default: null },
    endsAt: { type: Date, default: null }
  },
  history: [{
    trackId: String,
    title: String,
    artist: String,
    genre: String,
    playedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const MongooseRoom = mongoose.model('Room', roomSchema);

class RoomModel {
  static async find(query = {}) {
    if (global.USE_MEMORY_STORE) {
      return collections.rooms.find(query);
    }
    return MongooseRoom.find(query);
  }

  static async findOne(query) {
    if (global.USE_MEMORY_STORE) {
      return collections.rooms.findOne(query);
    }
    return MongooseRoom.findOne(query);
  }

  static async findById(id) {
    if (global.USE_MEMORY_STORE) {
      return collections.rooms.findById(id);
    }
    return MongooseRoom.findById(id);
  }

  static async create(data) {
    if (global.USE_MEMORY_STORE) {
      return collections.rooms.create(data);
    }
    const room = new MongooseRoom(data);
    await room.save();
    return room;
  }

  static async findByIdAndUpdate(id, update, options = { new: true }) {
    if (global.USE_MEMORY_STORE) {
      return collections.rooms.findByIdAndUpdate(id, update, options);
    }
    return MongooseRoom.findByIdAndUpdate(id, update, options);
  }

  static async findOneAndUpdate(query, update, options = { new: true }) {
    if (global.USE_MEMORY_STORE) {
      return collections.rooms.findOneAndUpdate(query, update, options);
    }
    return MongooseRoom.findOneAndUpdate(query, update, options);
  }

  static async deleteOne(query) {
    if (global.USE_MEMORY_STORE) {
      return collections.rooms.deleteOne(query);
    }
    return MongooseRoom.deleteOne(query);
  }
}

module.exports = RoomModel;
