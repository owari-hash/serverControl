const mongoose = require('mongoose');

const ComponentDefinitionSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  category: { type: String, default: 'section' },
  icon: { type: String, default: '' },
  defaultProps: { type: mongoose.Schema.Types.Mixed, default: {} },
  defaultStyles: { type: mongoose.Schema.Types.Mixed, default: {} },
  defaultSize: {
    width: { type: Number, default: 1200 },
    height: { type: Number, default: 320 },
  },
  allowedChildren: { type: [String], default: [] },
  resizable: { type: Boolean, default: true },
  draggable: { type: Boolean, default: true },
  droppable: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ComponentDefinitionSchema.pre('save', function onSave(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ComponentDefinition', ComponentDefinitionSchema);
