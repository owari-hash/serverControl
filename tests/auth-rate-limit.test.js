const test = require('node:test');
const assert = require('node:assert/strict');
const { authRateLimit } = require('../src/shared/middleware/authRateLimit');

function createRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.payload = data; return this; }
  };
}

test('authRateLimit allows first request', () => {
  const req = { ip: `test-ip-${Date.now()}` };
  const res = createRes();
  let nextCalled = false;
  authRateLimit(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('authRateLimit blocks after threshold', () => {
  const req = { ip: `limited-ip-${Date.now()}` };
  const res = createRes();
  let blocked = false;

  for (let i = 0; i < 30; i += 1) {
    authRateLimit(req, res, () => {});
  }
  if (res.statusCode === 429) blocked = true;
  assert.equal(blocked, true);
});
