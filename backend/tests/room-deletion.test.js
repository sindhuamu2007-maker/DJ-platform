const assert = require('node:assert/strict');

global.USE_MEMORY_STORE = true;

const RoomModel = require('../models/Room');
const roomController = require('../controllers/roomController');

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const run = async () => {
  const room = await RoomModel.create({
    roomId: 'DJ-TEST',
    name: 'Test Room',
    host: { id: 'host-1' },
    participants: []
  });

  const otherUserResponse = createResponse();
  await roomController.deleteRoom({
    params: { id: room.roomId },
    user: { id: 'guest-1' }
  }, otherUserResponse);
  assert.equal(otherUserResponse.body.success, true);
  assert.equal(await RoomModel.findOne({ roomId: room.roomId }), null);

  const legacyRoom = await RoomModel.create({
    roomId: 'DJ-OLD1',
    name: 'Legacy Room',
    host: { username: 'alice' },
    participants: []
  });
  const legacyOwnerResponse = createResponse();
  await roomController.deleteRoom({
    params: { id: legacyRoom.roomId },
    user: { id: 'host-1', username: 'Alice' }
  }, legacyOwnerResponse);
  assert.equal(legacyOwnerResponse.body.success, true);
  assert.equal(await RoomModel.findOne({ roomId: legacyRoom.roomId }), null);

  const missingResponse = createResponse();
  await roomController.deleteRoom({
    params: { id: 'DJ-MISSING' },
    user: { id: 'host-1' }
  }, missingResponse);
  assert.equal(missingResponse.statusCode, 404);

  console.log('Room deletion tests passed.');
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
