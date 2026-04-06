const mongoose = require('mongoose');

/**
 * WebsiteDesign Model - Hybrid Architecture
 * Stores project-level settings only (theme, domain, metadata)
 * Component structure stored separately in ComponentInstance collection
 */

const WebsiteDesignSchema = new mongoose.Schema({
  projectName: { type: String, required: true, unique: true },
  domain: String,
  theme: {
    primaryColor: { type: String, default: '#3b82f6' },
    secondaryColor: { type: String, default: '#1f2937' },
    fontFamily: { type: String, default: 'Inter' },
    darkMode: { type: Boolean, default: false },
    customTokens: { type: Map, of: String, default: {} }
  },
  // Keep lightweight page metadata for routing/title/description compatibility.
  // Component tree/content remains in ComponentInstance collection.
  pages: [{
    route: { type: String, required: true },
    title: { type: String, default: 'Untitled' },
    description: { type: String, default: '' }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp on save
WebsiteDesignSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('WebsiteDesign', WebsiteDesignSchema);
