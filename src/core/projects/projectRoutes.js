const express = require('express');
const projectController = require('./projectController');
const { requireProjectAccess } = require('../../shared/middleware/requireProjectAccess');
const { requireRole } = require('../../shared/middleware/requireRole');

const router = express.Router();

router.get('/', projectController.getAllProjects);
router.get('/:name', requireProjectAccess('client-admin', 'editor'), projectController.getProject);
router.post('/', requireRole('superadmin'), projectController.createProject);
router.patch('/:name', requireProjectAccess('client-admin'), projectController.updateProject);
router.delete('/:name', requireRole('superadmin'), projectController.deleteProject);

router.post('/:name/stop', requireProjectAccess('client-admin'), projectController.stopProject);
router.post('/:name/build', requireProjectAccess('client-admin'), projectController.buildProject);
router.post('/generate', requireRole('superadmin'), projectController.generateSite);

router.get('/:name/logs/live', requireProjectAccess('client-admin', 'editor'), projectController.streamLogs);

module.exports = router;
