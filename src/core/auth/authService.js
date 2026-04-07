const config = require('../../../config');
const tokenService = require('./tokenService');
const crypto = require('crypto');
const User = require('../../models/User');
const UserProjectBinding = require('../../models/UserProjectBinding');

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

async function login(email, password) {
  const validEmail = config.AUTH_EMAIL || 'admin@demo.com';
  const validPassword = config.AUTH_PASSWORD || '123456';

  let user = null;

  if (email === validEmail && password === validPassword) {
    user = { email, role: 'superadmin', projects: [] };
  } else {
    const dbUser = await User.findOne({ email, status: 'ACTIVE' }).lean();
    if (!dbUser) return null;
    if (dbUser.passwordHash !== hashPassword(password)) return null;

    const bindings = await UserProjectBinding.find({
      userEmail: email,
      status: 'ACTIVE'
    }).lean();
    user = {
      email,
      role: dbUser.role || 'client-admin',
      projects: bindings.map((b) => ({ projectName: b.projectName, roles: b.roles }))
    };
  }

  const tokens = await tokenService.issueTokens(user);

  return {
    user,
    ...tokens
  };
}

module.exports = {
  login,
  hashPassword
};
