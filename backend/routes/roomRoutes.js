const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

router.get('/', roomController.listRooms);
router.post('/', protect, roomController.createRoom);
router.get('/:id', protect, roomController.getRoom);
router.delete('/:id', protect, roomController.deleteRoom);
router.post('/:id/join', protect, roomController.joinRoom);
router.post('/:id/leave', protect, roomController.leaveRoom);
router.put('/:id/dj-settings', protect, roomController.updateDJSettings);

module.exports = router;
