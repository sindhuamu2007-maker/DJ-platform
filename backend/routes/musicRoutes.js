const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const { protect } = require('../middleware/auth');

router.get('/youtube-search', protect, musicController.searchYouTube);
router.get('/search', musicController.search);
router.get('/catalog', musicController.getCatalog);
router.get('/apple-music/config', musicController.getAppleMusicConfig);
router.get('/recommendations', protect, musicController.getRecommendations);
router.post('/queue', protect, musicController.addToQueue);
router.post('/queue/play', protect, musicController.playQueueTrack);
router.delete('/queue', protect, musicController.removeFromQueue);
router.put('/queue/reorder', protect, musicController.reorderQueue);

module.exports = router;
