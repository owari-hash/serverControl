const mongoose = require('mongoose');

const ComponentLibrarySchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. 'Hero'
  scope: { type: String, enum: ['GLOBAL', 'PROJECT'], default: 'GLOBAL' },
  projectName: { type: String, default: null }, // Only used if scope is 'PROJECT'
  category: { type: String, required: true }, // Navbar, Hero, etc.
  code: { type: String, required: true }, // The react code string
  description: String,
  defaultProps: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

// Allow the same component 'type' to exist globally (projectName: null) and per-project
ComponentLibrarySchema.index({ type: 1, projectName: 1 }, { unique: true });

module.exports = mongoose.model('ComponentLibrary', ComponentLibrarySchema);
