const mongoose = require('mongoose');
const config = require('../config');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

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

// Project Management Schema
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  port: { type: Number, required: true },
  path: { type: String, required: true },
  status: { type: String, enum: ['RUNNING', 'STOPPED', 'BUILDING', 'ERROR'], default: 'STOPPED' },
  githubRepo: String,
  pid: Number, // Current process ID (null if not running)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Project = mongoose.model('Project', ProjectSchema);

// Arbitrary Project Data Schema
const ProjectDataSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  key: { type: String, required: true },
  value: mongoose.Schema.Types.Mixed,
  updatedAt: { type: Date, default: Date.now }
});

// Ensure a single key per project
ProjectDataSchema.index({ projectName: 1, key: 1 }, { unique: true });

const ProjectData = mongoose.model('ProjectData', ProjectDataSchema);

module.exports = { WebsiteDesign, ComponentLibrary, Project, ProjectData };
