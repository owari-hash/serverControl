const mongoose = require('mongoose');

/**
 * WebsiteDesign Model - Hybrid Architecture
 * Stores project-level settings only (theme, domain, metadata)
 * Component structure stored separately in ComponentInstance collection
 */

const WebsiteDesignSchema = new mongoose.Schema({
  projectName: { type: String, required: true, unique: true },
  domain: String,
  template: {
    name: { type: String, default: '' },
    version: { type: String, default: '1.0.0' },
    layoutMode: { type: String, enum: ['legacy', 'structured', 'absolute', 'grid'], default: 'legacy' }
  },
  theme: {
    primaryColor: { type: String, default: '#3b82f6' },
    secondaryColor: { type: String, default: '#1f2937' },
    fontFamily: { type: String, default: 'Inter' },
    darkMode: { type: Boolean, default: false },
    /** Main page canvas background (CSS color); optional */
    pageBackground: { type: String, default: '' },
    // Canonical token namespace for renderer/editor.
    tokens: { type: Map, of: String, default: {} },
    // Backward-compatible legacy namespace.
    customTokens: { type: Map, of: String, default: {} }
  },
  responsive: {
    breakpoints: {
      mobile: { type: Number, default: 375 },
      tablet: { type: Number, default: 768 },
      desktop: { type: Number, default: 1440 }
    },
    pages: [{
      route: { type: String, required: true },
      canvas: {
        width: { type: Number, default: null },
        height: { type: Number, default: null }
      },
      components: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
    }]
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
