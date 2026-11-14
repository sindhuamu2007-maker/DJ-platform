const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/room/:roomId', analyticsController.getRoomAnalytics);
router.get('/global', analyticsController.getGlobalAnalytics);

module.exports = router;
