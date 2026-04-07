const express = require('express');
const projectController = require('./projectController');

const router = express.Router();

router.get('/', projectController.getAllProjects);
router.get('/:name', projectController.getProject);
router.post('/', projectController.createProject);
router.patch('/:name', projectController.updateProject);
router.delete('/:name', projectController.deleteProject);

router.post('/:name/stop', projectController.stopProject);
router.post('/:name/build', projectController.buildProject);
router.post('/generate', projectController.generateSite);

router.get('/:name/logs/live', projectController.streamLogs);

module.exports = router;
