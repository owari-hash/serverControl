const express = require('express');
const router = express.Router();
const componentController = require('../controllers/componentController');

// Component CRUD
router.get('/', componentController.getAllComponents);
router.get('/:type', componentController.getComponent);
router.post('/', componentController.saveComponent);
router.put('/:type', componentController.saveComponent);
router.delete('/:type', componentController.deleteComponent);

module.exports = router;
