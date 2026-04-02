const mongoose = require('mongoose');
const config = require('../config');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const ComponentLibrarySchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, // e.g. 'Hero'
  category: { type: String, required: true }, // Navbar, Hero, etc.
  code: { type: String, required: true }, // The react code string
  description: String,
  defaultProps: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

const ComponentLibrary = mongoose.model('ComponentLibrary', ComponentLibrarySchema);

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
WebsiteDesignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const WebsiteDesign = mongoose.model('WebsiteDesign', WebsiteDesignSchema);

module.exports = { WebsiteDesign, ComponentLibrary };
