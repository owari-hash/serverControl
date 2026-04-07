const mongoose = require('mongoose');

const AuthSessionSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  tokenId: { type: String, required: true, unique: true, index: true },
  refreshTokenHash: { type: String, required: true },
  isRevoked: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('AuthSession', AuthSessionSchema);
