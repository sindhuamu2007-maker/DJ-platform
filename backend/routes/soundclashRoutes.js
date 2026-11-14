const express = require('express');
const router = express.Router();
const soundclashController = require('../controllers/soundclashController');
const { protect } = require('../middleware/auth');

router.post('/', protect, soundclashController.createBattle);
router.post('/vote', protect, soundclashController.vote);
router.post('/end', protect, soundclashController.endBattle);
router.get('/history/:roomId', soundclashController.getBattleHistory);
router.get('/leaderboard', soundclashController.getLeaderboard);

module.exports = router;
