const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Project Data CRUD
router.get('/:name', dataController.getProjectData);
router.get('/:name/:key', dataController.getSpecificData);
router.post('/:name', dataController.setProjectData);
router.delete('/:name/:key', dataController.deleteProjectData);

module.exports = router;
