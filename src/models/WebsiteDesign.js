const mongoose = require('mongoose');

// Component Instance (the bridge between library and site structure)
const ComponentInstanceSchema = new mongoose.Schema({
  type: { type: String, required: true }, // must exist in ComponentLibrary
  props: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  order: { type: Number, default: 0 }
});

// Page Schema
const PageSchema = new mongoose.Schema({
  route: { type: String, required: true }, // e.g., '/', '/about', '/pricing'
  title: { type: String, required: true },
  description: String,
  components: [ComponentInstanceSchema]
});

// Website Design Schema (The root document)
const WebsiteDesignSchema = new mongoose.Schema({
  projectName: { type: String, required: true, unique: true },
  domain: String,
  theme: {
    primaryColor: { type: String, default: '#3b82f6' },
    secondaryColor: { type: String, default: '#1f2937' },
    fontFamily: { type: String, default: 'Inter' },
    darkMode: { type: Boolean, default: false }
  },
  pages: [PageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp on save
WebsiteDesignSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('WebsiteDesign', WebsiteDesignSchema);
