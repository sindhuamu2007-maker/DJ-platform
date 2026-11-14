const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

global.USE_MEMORY_STORE = true;

const authController = require('../controllers/authController');
const { collections } = require('../utils/memoryStore');

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
  const firstResponse = createResponse();
  await authController.demoLogin({}, firstResponse);
  assert.equal(firstResponse.body.success, true);
  assert.equal(firstResponse.body.user.email, 'dj@auradj.com');
  jwt.verify(firstResponse.body.token, process.env.JWT_SECRET || 'ai_dj_platform_super_secret_jwt_key_2026');

  const secondResponse = createResponse();
  await authController.demoLogin({}, secondResponse);
  assert.equal(secondResponse.body.user.id, firstResponse.body.user.id);
  assert.equal(collections.users.documents.size, 1);

  const registerResponse = createResponse();
  await authController.register({
    body: { email: 'dj@auradj.com', username: 'other-name', password: 'password123' }
  }, registerResponse);
  assert.equal(registerResponse.statusCode, 400);

  const accountResponse = createResponse();
  await authController.register({
    body: {
      email: 'new-user@example.com',
      username: 'new-user',
      password: 'password123'
    }
  }, accountResponse);
  assert.equal(accountResponse.statusCode, 201);

  const existingAccountResponse = createResponse();
  await authController.register({
    body: {
      email: 'new-user@example.com',
      username: 'different-name',
      password: 'password123'
    }
  }, existingAccountResponse);
  assert.equal(existingAccountResponse.body.success, true);
  assert.equal(existingAccountResponse.body.user.id, accountResponse.body.user.id);
  assert.equal(collections.users.documents.size, 2);

  const wrongPasswordResponse = createResponse();
  await authController.register({
    body: {
      email: 'new-user@example.com',
      username: 'different-name',
      password: 'wrong-password'
    }
  }, wrongPasswordResponse);
  assert.equal(wrongPasswordResponse.statusCode, 401);

  const loginResponse = createResponse();
  await authController.login({
    body: { email: ' NEW-USER@EXAMPLE.COM ', password: 'password123' }
  }, loginResponse);
  assert.equal(loginResponse.body.success, true);

  const invalidLoginResponse = createResponse();
  await authController.login({
    body: { email: 'new-user@example.com', password: 'wrong-password' }
  }, invalidLoginResponse);
  assert.equal(invalidLoginResponse.statusCode, 401);
  assert.match(invalidLoginResponse.body.message, /demo account/);

  console.log('Demo authentication tests passed.');
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
