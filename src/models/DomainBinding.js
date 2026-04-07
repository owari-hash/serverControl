const mongoose = require('mongoose');

const DomainBindingSchema = new mongoose.Schema({
  projectId: { type: String, required: true, index: true },
  domain: { type: String, required: true, unique: true },
  upstreamHost: { type: String, required: true },
  upstreamPort: { type: Number, required: true },
  isEnabled: { type: Boolean, default: true },
  nginxStatus: { type: String, enum: ['PENDING', 'READY', 'ERROR'], default: 'PENDING' },
  nginxConfigPath: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('DomainBinding', DomainBindingSchema);
