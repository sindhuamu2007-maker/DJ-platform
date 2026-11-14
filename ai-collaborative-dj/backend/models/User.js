const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { collections } = require('../utils/memoryStore');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    default: function() { return this.username; }
  },
  password: {
    type: String,
    required: true
  },
  profilePic: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  preferredGenres: {
    type: [String],
    default: ['EDM', 'Pop']
  },
  favoriteArtists: {
    type: [String],
    default: []
  },
  preferredLanguages: {
    type: [String],
    default: ['Kannada', 'Hindi', 'English']
  },
  listeningHistory: [{
    trackId: String,
    title: String,
    artist: String,
    genre: String,
    playedAt: { type: Date, default: Date.now }
  }],
  soundclashWins: {
    type: Number,
    default: 0
  },
  totalListeningMinutes: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'dj', 'admin'],
    default: 'user'
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateToken = function() {
  const secret = process.env.JWT_SECRET || 'ai_dj_platform_super_secret_jwt_key_2026';
  return jwt.sign(
    { id: this._id, username: this.username, role: this.role },
    secret,
    { expiresIn: '7d' }
  );
};

const MongooseUser = mongoose.model('User', userSchema);

// Hybrid model adapter that handles both real MongoDB and in-memory store
class UserModel {
  static async findOne(query) {
    if (global.USE_MEMORY_STORE) {
      return collections.users.findOne(query);
    }
    return MongooseUser.findOne(query);
  }

  static async findById(id) {
    if (global.USE_MEMORY_STORE) {
      return collections.users.findById(id);
    }
    return MongooseUser.findById(id);
  }

  static async find(query) {
    if (global.USE_MEMORY_STORE) {
      return collections.users.find(query);
    }
    return MongooseUser.find(query);
  }

  static async create(data) {
    if (data.password && !data.password.startsWith('$2a$') && !data.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }
    if (!data.displayName) {
      data.displayName = data.username;
    }
    if (global.USE_MEMORY_STORE) {
      return collections.users.create(data);
    }
    const user = new MongooseUser(data);
    await user.save();
    return user;
  }

  static async findByIdAndUpdate(id, update, options) {
    if (global.USE_MEMORY_STORE) {
      return collections.users.findByIdAndUpdate(id, update, options);
    }
    return MongooseUser.findByIdAndUpdate(id, update, options);
  }

  static async comparePassword(candidate, hash) {
    return bcrypt.compare(candidate, hash);
  }

  static generateToken(user) {
    const secret = process.env.JWT_SECRET || 'ai_dj_platform_super_secret_jwt_key_2026';
    return jwt.sign(
      { id: user._id || user.id, username: user.username, role: user.role || 'user' },
      secret,
      { expiresIn: '7d' }
    );
  }
}

module.exports = UserModel;
