const test = require('node:test');
const assert = require('node:assert/strict');
const { requireRole } = require('../src/shared/middleware/requireRole');
const { requireProjectAccess } = require('../src/shared/middleware/requireProjectAccess');
const UserProjectBinding = require('../src/models/UserProjectBinding');

function createRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.payload = data; return this; }
  };
}

test('requireRole blocks disallowed role', () => {
  const middleware = requireRole('superadmin');
  const req = { auth: { role: 'editor' } };
  const res = createRes();
  middleware(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test('requireProjectAccess rejects missing project context', async () => {
  const middleware = requireProjectAccess('editor');
  const req = { auth: { email: 'u@test.com', role: 'editor' }, context: {} };
  const res = createRes();
  await middleware(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('requireProjectAccess allows superadmin bypass', async () => {
  const middleware = requireProjectAccess('editor');
  const req = { auth: { email: 'admin@test.com', role: 'superadmin' }, context: { projectId: 'x' } };
  const res = createRes();
  let nextCalled = false;
  await middleware(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('requireProjectAccess allows valid binding role', async () => {
  const originalFindOne = UserProjectBinding.findOne;
  UserProjectBinding.findOne = () => ({
    lean: async () => ({ userEmail: 'user@test.com', projectName: 'nihao1', roles: ['editor'], status: 'ACTIVE' })
  });

  try {
    const middleware = requireProjectAccess('editor');
    const req = { auth: { email: 'user@test.com', role: 'editor' }, context: { projectId: 'nihao1' } };
    const res = createRes();
    let nextCalled = false;
    await middleware(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
  } finally {
    UserProjectBinding.findOne = originalFindOne;
  }
});
