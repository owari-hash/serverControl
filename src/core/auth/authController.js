const { ok, fail } = require('../../shared/http/response');
const authService = require('./authService');
const tokenService = require('./tokenService');
const UserProjectBinding = require('../../models/UserProjectBinding');
const config = require('../../../config');

function setRefreshCookie(res, refreshToken) {
  if (!config.AUTH_USE_HTTP_ONLY_COOKIE) return;
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/v2/core/auth'
  });
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json(fail('email and password are required'));
    }

    const authResult = await authService.login(email, password);
    if (!authResult) {
      return res.status(401).json(fail('Invalid credentials'));
    }
    setRefreshCookie(res, authResult.refreshToken);

    return res.json(ok({
      success: true,
      ...authResult
    }));
  } catch (error) {
    return res.status(500).json(fail(error.message));
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};
    const incomingRefreshToken = refreshToken || req.cookies?.refreshToken;
    if (!incomingRefreshToken) return res.status(400).json(fail('refreshToken is required'));
    const tokens = await tokenService.refreshTokens(incomingRefreshToken);
    setRefreshCookie(res, tokens.refreshToken);
    return res.json(ok({ success: true, ...tokens }));
  } catch (error) {
    return res.status(401).json(fail('Failed to refresh token', error.message));
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body || {};
    const incomingRefreshToken = refreshToken || req.cookies?.refreshToken;
    if (incomingRefreshToken) await tokenService.revokeRefreshToken(incomingRefreshToken);
    if (config.AUTH_USE_HTTP_ONLY_COOKIE) {
      res.clearCookie('refreshToken', { path: '/api/v2/core/auth' });
    }
    return res.json(ok({ success: true, message: 'Logged out' }));
  } catch (error) {
    return res.status(500).json(fail(error.message));
  }
}

async function me(req, res) {
  const bindings = req.auth.role === 'superadmin'
    ? []
    : await UserProjectBinding.find({
      userEmail: req.auth.email,
      status: 'ACTIVE'
    }).lean();

  return res.json(ok({
    success: true,
    user: {
      email: req.auth.email,
      role: req.auth.role,
      projects: bindings.map((b) => ({ projectName: b.projectName, roles: b.roles }))
    }
  }));
}

module.exports = {
  login,
  refresh,
  logout,
  me
};
