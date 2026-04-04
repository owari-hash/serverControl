const mongoose = require('mongoose');

const ProjectDataSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  key: { type: String, required: true },
  value: mongoose.Schema.Types.Mixed,
  updatedAt: { type: Date, default: Date.now }
});

// Ensure a single key per project
ProjectDataSchema.index({ projectName: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('ProjectData', ProjectDataSchema);
