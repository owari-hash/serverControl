const { ok, fail } = require('../../shared/http/response');
const authService = require('./authService');
const tokenService = require('./tokenService');

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
    if (!refreshToken) return res.status(400).json(fail('refreshToken is required'));
    const tokens = await tokenService.refreshTokens(refreshToken);
    return res.json(ok({ success: true, ...tokens }));
  } catch (error) {
    return res.status(401).json(fail('Failed to refresh token', error.message));
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) await tokenService.revokeRefreshToken(refreshToken);
    return res.json(ok({ success: true, message: 'Logged out' }));
  } catch (error) {
    return res.status(500).json(fail(error.message));
  }
}

async function me(req, res) {
  return res.json(ok({
    success: true,
    user: {
      email: req.auth.email,
      role: req.auth.role
    }
  }));
}

module.exports = {
  login,
  refresh,
  logout,
  me
};
