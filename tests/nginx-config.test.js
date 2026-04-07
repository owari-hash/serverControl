const test = require('node:test');
const assert = require('node:assert/strict');
const { renderConfig, isValidDomain } = require('../src/shared/infra/nginxConfigManager');

test('isValidDomain validates common domain format', () => {
  assert.equal(isValidDomain('example.com'), true);
  assert.equal(isValidDomain('bad_domain'), false);
});

test('renderConfig returns nginx config text', () => {
  const conf = renderConfig({
    domain: 'example.com',
    upstreamHost: '127.0.0.1',
    upstreamPort: 5001
  });
  assert.ok(conf.includes('server_name example.com;'));
  assert.ok(conf.includes('proxy_pass http://127.0.0.1:5001;'));
});
