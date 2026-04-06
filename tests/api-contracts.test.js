const test = require('node:test');
const assert = require('node:assert/strict');
const { envelope, validateComponentPayload } = require('../src/utils/apiContract');

test('envelope wraps payload with version', () => {
  const payload = { ok: true };
  const wrapped = envelope(payload);
  assert.equal(wrapped.version, '1.1.0');
  assert.deepEqual(wrapped.data, payload);
});

test('component payload validator rejects invalid values', () => {
  const invalid = validateComponentPayload({ componentType: '', pageRoute: '' });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 2);
});

test('component payload validator accepts valid minimal payload', () => {
  const valid = validateComponentPayload({
    componentType: 'hero',
    pageRoute: '/',
    order: 0
  });
  assert.equal(valid.valid, true);
});
