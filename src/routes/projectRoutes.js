const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// CRUD Operations
router.get('/', projectController.getAllProjects);
router.get('/:name', projectController.getProject);
router.post('/', projectController.createProject);
router.patch('/:name', projectController.updateProject);
router.delete('/:name', projectController.deleteProject);

// Operations
router.post('/:name/stop', projectController.stopProject);
router.post('/:name/build', projectController.buildProject);
router.post('/generate', projectController.generateSite);

// Logs
router.get('/:name/logs/live', projectController.streamLogs);

module.exports = router;
