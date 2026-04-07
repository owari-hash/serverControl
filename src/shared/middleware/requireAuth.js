const { fail } = require('../http/response');
const { verifyAccessToken } = require('../../core/auth/tokenService');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json(fail('Authorization token is required'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      email: payload.sub,
      role: payload.role,
      type: payload.type
    };
    return next();
  } catch (error) {
    return res.status(401).json(fail('Invalid or expired token', error.message));
  }
}

module.exports = {
  requireAuth
};
