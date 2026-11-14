const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const { protect } = require('../middleware/auth');

router.get('/search', musicController.search);
router.get('/youtube-search', protect, musicController.searchYouTube);
router.get('/catalog', musicController.getCatalog);
router.get('/recommendations', protect, musicController.getRecommendations);
router.post('/queue', protect, musicController.addToQueue);
router.delete('/queue', protect, musicController.removeFromQueue);
router.put('/queue/reorder', protect, musicController.reorderQueue);

module.exports = router;
