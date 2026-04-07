const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../../../config');
const AuthSession = require('../../models/AuthSession');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseExpiryToDate(exp) {
  if (typeof exp === 'number') return new Date(Date.now() + exp * 1000);
  const match = String(exp).match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const value = Number(match[1]);
  const unit = match[2];
  const map = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return new Date(Date.now() + value * map[unit]);
}

async function issueTokens(user) {
  const tokenId = crypto.randomUUID();
  const accessToken = jwt.sign(
    { sub: user.email, role: user.role, type: 'access' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRES }
  );
  const refreshToken = jwt.sign(
    { sub: user.email, role: user.role, type: 'refresh', jti: tokenId },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES }
  );

  await AuthSession.create({
    userEmail: user.email,
    tokenId,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: parseExpiryToDate(config.JWT_REFRESH_EXPIRES)
  });

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: config.JWT_ACCESS_EXPIRES
  };
}

async function refreshTokens(refreshToken) {
  const payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
  if (payload.type !== 'refresh' || !payload.jti) throw new Error('Invalid refresh token');

  const session = await AuthSession.findOne({ tokenId: payload.jti });
  if (!session || session.isRevoked) throw new Error('Refresh token revoked');
  if (session.refreshTokenHash !== hashToken(refreshToken)) throw new Error('Refresh token mismatch');

  session.isRevoked = true;
  await session.save();

  return issueTokens({ email: payload.sub, role: payload.role || 'admin' });
}

async function revokeRefreshToken(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    if (!payload.jti) return;
    await AuthSession.updateOne({ tokenId: payload.jti }, { isRevoked: true });
  } catch (_) {
    // Ignore malformed or expired token on logout
  }
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_ACCESS_SECRET);
}

module.exports = {
  issueTokens,
  refreshTokens,
  revokeRefreshToken,
  verifyAccessToken
};
