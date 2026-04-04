const express = require('express');
const router = express.Router();

const projectRoutes = require('./projectRoutes');
const designRoutes = require('./designRoutes');
const componentRoutes = require('./componentRoutes');
const dataRoutes = require('./dataRoutes');

router.use('/projects', projectRoutes);
router.use('/designs', designRoutes);
router.use('/components', componentRoutes);
router.use('/data', dataRoutes);

// Legacy endpoint mapped for dynamic headless CMS sites
const designController = require('../controllers/designController');
router.get('/sites/:name/content', designController.getDesign);

module.exports = router;
