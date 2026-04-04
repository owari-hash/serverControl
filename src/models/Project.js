const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  port: { type: Number, required: true },
  path: { type: String, required: true },
  status: { type: String, enum: ['RUNNING', 'STOPPED', 'BUILDING', 'ERROR'], default: 'STOPPED' },
  githubRepo: mongoose.Schema.Types.Mixed,
  pid: String, // PM2 identifier (string or number)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ProjectSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Project', ProjectSchema);
