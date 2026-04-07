const mongoose = require('mongoose');

const ServerTargetSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  host: { type: String, required: true },
  port: { type: Number, default: 22 },
  user: { type: String, required: true },
  authMode: { type: String, enum: ['ssh-key', 'password', 'agent'], default: 'ssh-key' },
  sshKeyPath: { type: String, default: '' },
  knownHostsPath: { type: String, default: '' },
  labels: { type: [String], default: [] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ServerTarget', ServerTargetSchema);
