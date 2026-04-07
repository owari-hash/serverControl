const config = require('../../../config');

function login(email, password) {
  const validEmail = config.AUTH_EMAIL || 'admin@demo.com';
  const validPassword = config.AUTH_PASSWORD || '123456';

  if (email !== validEmail || password !== validPassword) {
    return null;
  }

  const tokenPayload = `${email}:${Date.now()}`;
  const token = Buffer.from(tokenPayload).toString('base64url');

  return {
    user: { email, role: 'admin' },
    token,
    expiresIn: 60 * 60 * 24
  };
}

module.exports = {
  login
};
