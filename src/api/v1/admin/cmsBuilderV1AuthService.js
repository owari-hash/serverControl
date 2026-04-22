const config = require('../../../../config');
const authService = require('../../../core/auth/authService');
const tokenService = require('../../../core/auth/tokenService');

/**
 * CMS Builder v1 login: username/password.
 * Non-email usernames match CMS_V1_ADMIN_* env credentials; email-shaped usernames use core auth (DB + env bootstrap).
 */
async function login(username, password) {
  const u = String(username ?? '').trim();
  const p = String(password ?? '');
  if (!u || !p) return null;

  if (!u.includes('@')) {
    if (u === config.CMS_V1_ADMIN_USERNAME && p === config.CMS_V1_ADMIN_PASSWORD) {
      const tokens = await tokenService.issueTokens({
        email: config.CMS_V1_ADMIN_TOKEN_EMAIL,
        role: config.CMS_V1_ADMIN_ROLE,
        projects: [],
      });
      return tokens.accessToken;
    }
    return null;
  }

  const authResult = await authService.login(u, p);
  if (!authResult) return null;
  return authResult.accessToken;
}

module.exports = {
  login,
};
