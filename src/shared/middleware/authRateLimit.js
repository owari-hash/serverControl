const config = require('../../../config');
const { fail } = require('../http/response');

const store = new Map();

function authRateLimit(req, res, next) {
  const key = (req.ip || 'unknown').toString();
  const now = Date.now();
  const windowMs = config.AUTH_RATE_WINDOW_MS;
  const maxAttempts = config.AUTH_RATE_MAX_ATTEMPTS;

  const entry = store.get(key) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  store.set(key, entry);

  if (entry.count > maxAttempts) {
    return res.status(429).json(fail('Too many auth attempts. Try again later.'));
  }
  return next();
}

module.exports = {
  authRateLimit
};
