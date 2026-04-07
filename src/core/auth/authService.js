const config = require('../../../config');
const tokenService = require('./tokenService');

async function login(email, password) {
  const validEmail = config.AUTH_EMAIL || 'admin@demo.com';
  const validPassword = config.AUTH_PASSWORD || '123456';

  if (email !== validEmail || password !== validPassword) {
    return null;
  }

  const user = { email, role: 'admin' };
  const tokens = await tokenService.issueTokens(user);

  return {
    user,
    ...tokens
  };
}

module.exports = {
  login
};
