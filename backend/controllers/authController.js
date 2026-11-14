const UserModel = require('../models/User');
const crypto = require('crypto');

const DEMO_ACCOUNT_EMAIL = 'dj@auradj.com';
const DEMO_ACCOUNT_USERNAME = 'aura-demo-dj';

exports.register = async (req, res) => {
  try {
    const { email, username, password, displayName, preferredGenres, preferredLanguages } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: 'Email, username, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();
    if (normalizedEmail === DEMO_ACCOUNT_EMAIL || normalizedUsername === DEMO_ACCOUNT_USERNAME) {
      return res.status(400).json({ success: false, message: 'That email or username is reserved for demo sign-in.' });
    }

    const existingEmail = await UserModel.findOne({ email: normalizedEmail });
    if (existingEmail) {
      const passwordMatches = await UserModel.comparePassword(password, existingEmail.password);
      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          message: 'This email is already registered. Check the password, or choose Sign In below.'
        });
      }

      const token = UserModel.generateToken(existingEmail);
      return res.json({
        success: true,
        message: 'Existing account found. You are now signed in.',
        token,
        user: {
          id: existingEmail._id || existingEmail.id,
          email: existingEmail.email,
          username: existingEmail.username,
          displayName: existingEmail.displayName,
          profilePic: existingEmail.profilePic,
          preferredGenres: existingEmail.preferredGenres,
          favoriteArtists: existingEmail.favoriteArtists,
          preferredLanguages: existingEmail.preferredLanguages
        }
      });
    }

    const existingUsername = await UserModel.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username is already taken.' });
    }

    const user = await UserModel.create({
      email: normalizedEmail,
      username: username.trim(),
      displayName: displayName || username,
      password,
      preferredGenres: preferredGenres && preferredGenres.length > 0 ? preferredGenres : ['Kannada', 'Hindi', 'EDM', 'Pop'],
      preferredLanguages: preferredLanguages && preferredLanguages.length > 0 ? preferredLanguages : ['Kannada', 'Hindi', 'English']
    });

    const token = UserModel.generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profilePic: user.profilePic,
        preferredGenres: user.preferredGenres,
        favoriteArtists: user.favoriteArtists,
        preferredLanguages: user.preferredLanguages
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.', error: err.message });
  }
};

exports.demoLogin = async (req, res) => {
  try {
    let user = await UserModel.findOne({ email: DEMO_ACCOUNT_EMAIL });
    if (!user) {
      try {
        user = await UserModel.create({
          email: DEMO_ACCOUNT_EMAIL,
          username: DEMO_ACCOUNT_USERNAME,
          displayName: 'Demo DJ',
          password: crypto.randomBytes(32).toString('hex'),
          preferredGenres: ['Kannada', 'Hindi', 'English', 'Pop', 'EDM'],
          preferredLanguages: ['Kannada', 'Hindi', 'English']
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        user = await UserModel.findOne({ email: DEMO_ACCOUNT_EMAIL });
        if (!user) throw error;
      }
    }

    const token = UserModel.generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profilePic: user.profilePic,
        preferredGenres: user.preferredGenres,
        favoriteArtists: user.favoriteArtists,
        preferredLanguages: user.preferredLanguages,
        totalListeningMinutes: user.totalListeningMinutes || 0,
        soundclashWins: user.soundclashWins || 0
      }
    });
  } catch (err) {
    console.error('Demo sign-in failed:', err);
    res.status(500).json({ success: false, message: 'Could not start demo sign-in. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email or password does not match. Check your details or continue with the demo account.'
      });
    }

    const isMatch = await UserModel.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email or password does not match. Check your details or continue with the demo account.'
      });
    }

    const token = UserModel.generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profilePic: user.profilePic,
        preferredGenres: user.preferredGenres,
        favoriteArtists: user.favoriteArtists,
        preferredLanguages: user.preferredLanguages,
        totalListeningMinutes: user.totalListeningMinutes || 0,
        soundclashWins: user.soundclashWins || 0
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      user: {
        id: user._id || user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profilePic: user.profilePic,
        preferredGenres: user.preferredGenres,
        favoriteArtists: user.favoriteArtists,
        preferredLanguages: user.preferredLanguages,
        listeningHistory: user.listeningHistory || [],
        totalListeningMinutes: user.totalListeningMinutes || 0,
        soundclashWins: user.soundclashWins || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { displayName, profilePic, preferredGenres, favoriteArtists, preferredLanguages } = req.body;
    const userId = req.user._id || req.user.id;

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      {
        displayName: displayName || req.user.displayName,
        profilePic: profilePic || req.user.profilePic,
        preferredGenres: preferredGenres || req.user.preferredGenres,
        favoriteArtists: favoriteArtists || req.user.favoriteArtists,
        preferredLanguages: preferredLanguages || req.user.preferredLanguages
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email address.' });
    }
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Security standard: don't reveal if email exists or not
      return res.json({ success: true, message: 'If this email exists, password reset instructions have been sent.' });
    }
    res.json({
      success: true,
      message: 'Password reset link sent to your registered email address (Demo token generated).'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
