const UserModel = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { email, username, password, displayName, preferredGenres, preferredLanguages } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: 'Email, username, and password are required.' });
    }

    const existingEmail = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const existingUsername = await UserModel.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username is already taken.' });
    }

    const user = await UserModel.create({
      email: email.toLowerCase(),
      username,
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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await UserModel.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
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
