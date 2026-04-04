const mongoose = require('mongoose');

const ComponentLibrarySchema = new mongoose.Schema({
  type: { type: String, required: true },
  scope: { type: String, enum: ['GLOBAL', 'PROJECT'], default: 'GLOBAL' },
  name: { type: String },
  description: { type: String },
  props: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ComponentLibrary', ComponentLibrarySchema);
