const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/sentiment', aiController.analyzeSentiment);
router.get('/mood/:roomId', aiController.getRoomMood);
router.post('/conflict-resolution', aiController.resolveConflict);
router.post('/dj/transition', aiController.getTransition);
router.post('/dj/next-track', aiController.getNextTrack);
router.get('/dj/personalities', aiController.getPersonalities);

module.exports = router;
