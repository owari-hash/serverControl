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
  // NOTE: Page component structure now stored in ComponentInstance collection
  // pages: [] - Removed in hybrid architecture v2
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp on save
WebsiteDesignSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('WebsiteDesign', WebsiteDesignSchema);
