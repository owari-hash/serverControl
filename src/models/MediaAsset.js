const mongoose = require('mongoose');

const MediaAssetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
  sizeBytes: { type: Number, default: 0 },
  tags: { type: [String], default: [] },
  folder: { type: String, default: 'root' },
  projectName: { type: String, default: null },
  uploadedBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

MediaAssetSchema.pre('save', function onSave(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MediaAsset', MediaAssetSchema);
