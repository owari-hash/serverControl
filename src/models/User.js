const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['superadmin', 'client-admin', 'editor'],
    default: 'client-admin'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'DISABLED'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
