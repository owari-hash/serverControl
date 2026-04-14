const mongoose = require('mongoose');

const TemplateComponentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    parentId: { type: String, default: null },
    slot: { type: String, default: null },
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const TemplatePageSchema = new mongoose.Schema(
  {
    route: { type: String, required: true },
    components: { type: [TemplateComponentSchema], default: [] },
  },
  { _id: false },
);

const TemplateVersionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: '' },
  },
  { _id: false },
);

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, default: 'General' },
  thumbnail: { type: String, default: '' },
  pages: { type: [TemplatePageSchema], default: [] },
  isActive: { type: Boolean, default: true },
  tags: { type: [String], default: [] },
  currentVersion: { type: Number, default: 1 },
  versions: { type: [TemplateVersionSchema], default: [] },
  createdBy: { type: String, default: '' },
  updatedBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TemplateSchema.pre('save', function onSave() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Template', TemplateSchema);
