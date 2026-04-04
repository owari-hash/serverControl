const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// SuperAdmin Dashboard Stats
router.get('/dashboard', adminController.getDashboardStats);

// Bulk Management
router.post('/components/import', adminController.bulkImportComponents);

// Project specific logs (Proxy to PM2)
const projectController = require('../controllers/projectController');
router.get('/projects/:name/logs', projectController.streamLogs);

module.exports = router;
