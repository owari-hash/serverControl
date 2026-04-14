const mongoose = require('mongoose');

const AuditEventSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actorEmail: { type: String, default: '' },
  actorRole: { type: String, default: '' },
  projectName: { type: String, default: null },
  targetType: { type: String, default: '' },
  targetId: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditEvent', AuditEventSchema);
