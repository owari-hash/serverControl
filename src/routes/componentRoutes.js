const express = require('express');
const router = express.Router();
const ComponentInstance = require('../models/ComponentInstance');

// ==========================================
// Hybrid Architecture - Component Instance Management
// Structure stored in MongoDB, code in TypeScript files
// ==========================================

// Get all component instances for a project page - supports both path and query params
router.get('/instances/:projectName/:pageRoute?', async (req, res) => {
  try {
    const { projectName, pageRoute: pathRoute } = req.params;
    const queryRoute = req.query.pageRoute;
    const decodedRoute = pathRoute 
      ? decodeURIComponent(pathRoute)
      : (queryRoute ? decodeURIComponent(queryRoute) : '/');
    
    const instances = await ComponentInstance.find({
      projectName,
      pageRoute: decodedRoute
    }).sort({ parentId: 1, slot: 1, order: 1 }).lean();
    
    res.json(instances);
  } catch (error) {
    console.error('Error fetching component instances:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get component tree (nested structure) - supports both path and query params
router.get('/tree/:projectName/:pageRoute?', async (req, res) => {
  try {
    const { projectName, pageRoute: pathRoute } = req.params;
    const queryRoute = req.query.pageRoute;
    const decodedRoute = pathRoute 
      ? decodeURIComponent(pathRoute)
      : (queryRoute ? decodeURIComponent(queryRoute) : '/');
    
    const tree = await ComponentInstance.getPageTree(projectName, decodedRoute);
    res.json(tree);
  } catch (error) {
    console.error('Error building component tree:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create component instance
router.post('/instances/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const data = req.body;
    
    if (!data.componentType || !data.pageRoute) {
      return res.status(400).json({
        error: 'Missing required fields: componentType, pageRoute'
      });
    }
    
    const instanceId = `${data.componentType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (data.order === undefined) {
      const lastSibling = await ComponentInstance.findOne({
        projectName,
        pageRoute: data.pageRoute,
        parentId: data.parentId || null,
        slot: data.slot || null
      }).sort({ order: -1 });
      
      data.order = lastSibling ? lastSibling.order + 1 : 0;
    }
    
    const instance = new ComponentInstance({
      instanceId,
      projectName,
      pageRoute: data.pageRoute,
      componentType: data.componentType,
      parentId: data.parentId || null,
      slot: data.slot || null,
      order: data.order,
      props: data.props || {},
      updatedAt: new Date()
    });

    await instance.save();
    res.status(201).json(instance);
  } catch (error) {
    console.error('Error creating component instance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update component instance
router.patch('/instances/:projectName/:instanceId', async (req, res) => {
  try {
    const { projectName, instanceId } = req.params;
    const updates = req.body;
    
    delete updates._id;
    delete updates.instanceId;
    delete updates.projectName;
    
    const instance = await ComponentInstance.findOneAndUpdate(
      { projectName, instanceId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!instance) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json(instance);
  } catch (error) {
    console.error('Error updating component instance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete component instance and children
router.delete('/instances/:projectName/:instanceId', async (req, res) => {
  try {
    const { projectName, instanceId } = req.params;
    await ComponentInstance.deleteTree(projectName, instanceId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting component instance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reorder components
router.post('/reorder/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const { componentOrders } = req.body;
    
    if (!Array.isArray(componentOrders)) {
      return res.status(400).json({ error: 'componentOrders must be an array' });
    }
    
    const bulkOps = componentOrders.map(({ instanceId, order }) => ({
      updateOne: {
        filter: { projectName, instanceId },
        update: { $set: { order, updatedAt: new Date() } }
      }
    }));
    
    await ComponentInstance.bulkWrite(bulkOps);
    res.json({ success: true, updated: componentOrders.length });
  } catch (error) {
    console.error('Error reordering components:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available component types
router.get('/types/registry', (req, res) => {
  const types = [
    { type: 'header', category: 'section', description: 'Navigation header' },
    { type: 'hero', category: 'section', description: 'Hero section' },
    { type: 'about', category: 'section', description: 'About section' },
    { type: 'footer', category: 'section', description: 'Footer' },
    { type: 'twocolumn', category: 'layout', slots: ['left', 'right'], description: 'Two column layout' },
    { type: 'grid', category: 'layout', slots: ['items'], description: 'CSS Grid' },
    { type: 'card', category: 'layout', slots: ['header', 'content', 'footer'], description: 'Card container' },
    { type: 'container', category: 'layout', slots: ['default'], description: 'Max-width container' },
    { type: 'pagination', category: 'primitive', description: 'Page navigation' },
    { type: 'button', category: 'primitive', description: 'Clickable button' },
  ];
  
  res.json(types);
});

module.exports = router;
