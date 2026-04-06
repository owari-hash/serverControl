const express = require('express');
const router = express.Router();

const projectRoutes = require('./projectRoutes');
const designRoutes = require('./designRoutes');
const componentRoutes = require('./componentRoutes');
const dataRoutes = require('./dataRoutes');
const adminRoutes = require('./adminRoutes');
const designService = require('../services/designService');

router.use('/projects', projectRoutes);
router.use('/designs', designRoutes);
router.use('/components', componentRoutes);
router.use('/data', dataRoutes);
router.use('/admin', adminRoutes);

// Legacy endpoint mapped for dynamic headless CMS sites
router.get('/sites/:name/content', async (req, res) => {
  try {
    // Keep this endpoint legacy-compatible (raw design payload),
    // because existing generated clients expect design.pages directly.
    const design = await designService.getDesignByProject(req.params.name);
    res.json(design);
  } catch (error) {
    res.status(error.message === 'Design not found for this project' ? 404 : 500).json({ error: error.message });
  }
});

module.exports = router;
