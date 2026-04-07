const test = require('node:test');
const assert = require('node:assert/strict');
const {
  requestContext,
  requireProjectContext,
  requireModuleContext
} = require('../src/shared/middleware/requestContext');

function createReq(overrides = {}) {
  return {
    headers: {},
    query: {},
    body: {},
    params: {},
    ...overrides
  };
}

function createRes() {
  return {
    statusCode: 200,
    payload: null,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    }
  };
}

test('requestContext sets request id and projectId', () => {
  const req = createReq({ headers: { 'x-project-id': 'proj-a' } });
  const res = createRes();
  let nextCalled = false;
  requestContext(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.context.projectId, 'proj-a');
  assert.ok(req.context.requestId);
});

test('requireProjectContext blocks missing projectId', () => {
  const req = createReq({ context: {} });
  const res = createRes();
  requireProjectContext(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('requireModuleContext blocks unsupported module', () => {
  const req = createReq({ context: { module: 'unknown' } });
  const res = createRes();
  requireModuleContext(req, res, () => {});
  assert.equal(res.statusCode, 400);
});
