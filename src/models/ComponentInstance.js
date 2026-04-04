const mongoose = require('mongoose');

/**
 * ComponentInstance Model - Hybrid Architecture
 * Stores component structure (flat with parent references)
 * Component code lives in TypeScript files
 */

const ComponentInstanceSchema = new mongoose.Schema({
  instanceId: {
    type: String,
    required: true,
    index: true
  },
  
  projectName: {
    type: String,
    required: true,
    index: true
  },
  
  pageRoute: {
    type: String,
    required: true,
    index: true
  },
  
  componentType: {
    type: String,
    required: true,
    index: true
  },
  
  parentId: {
    type: String,
    default: null,
    index: true
  },
  
  slot: {
    type: String,
    default: null
  },
  
  order: {
    type: Number,
    required: true,
    default: 0
  },
  
  props: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
ComponentInstanceSchema.index({ projectName: 1, pageRoute: 1, order: 1 });
ComponentInstanceSchema.index({ projectName: 1, parentId: 1, slot: 1, order: 1 });
ComponentInstanceSchema.index({ projectName: 1, instanceId: 1 }, { unique: true });

// Pre-save hook to ensure instanceId uniqueness per project
ComponentInstanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get page tree
ComponentInstanceSchema.statics.getPageTree = async function(projectName, pageRoute) {
  const instances = await this.find({
    projectName,
    pageRoute
  }).sort({ parentId: 1, slot: 1, order: 1 }).lean();
  
  return buildTree(instances);
};

// Static method to get all routes for a project
ComponentInstanceSchema.statics.getProjectRoutes = async function(projectName) {
  const routes = await this.distinct('pageRoute', { projectName });
  return routes.sort();
};

// Static method to delete component and all children recursively
ComponentInstanceSchema.statics.deleteTree = async function(projectName, instanceId) {
  const deleteRecursive = async (parentId) => {
    const children = await this.find({ projectName, parentId }).lean();
    
    for (const child of children) {
      await deleteRecursive(child.instanceId);
    }
    
    await this.deleteOne({ projectName, instanceId: parentId });
  };
  
  await deleteRecursive(instanceId);
};

// Helper: Build tree from flat list
function buildTree(instances) {
  const map = new Map();
  const roots = [];
  
  // First pass: create nodes
  instances.forEach(inst => {
    map.set(inst.instanceId, {
      ...inst,
      children: []
    });
  });
  
  // Second pass: link parents
  instances.forEach(inst => {
    const node = map.get(inst.instanceId);
    
    if (inst.parentId === null) {
      roots.push(node);
    } else {
      const parent = map.get(inst.parentId);
      if (parent) {
        let slotNode = parent.children.find(s => s.slot === inst.slot);
        if (!slotNode) {
          slotNode = { slot: inst.slot || 'default', components: [] };
          parent.children.push(slotNode);
        }
        slotNode.components.push(node);
      }
    }
  });
  
  // Sort
  roots.sort((a, b) => a.order - b.order);
  roots.forEach(root => {
    root.children.forEach(slot => {
      slot.components.sort((a, b) => a.order - b.order);
    });
  });
  
  return roots;
}

module.exports = mongoose.model('ComponentInstance', ComponentInstanceSchema);
