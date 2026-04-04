const express = require('express');
const router = express.Router();
const designController = require('../controllers/designController');

// Design CRUD
router.get('/', designController.getAllDesigns);
router.get('/:name', designController.getDesign);
router.post('/', designController.saveDesign);
router.patch('/:name', designController.saveDesign);
router.delete('/:name', designController.deleteDesign);

// Page CRUD (nested under design/project)
router.post('/:name/pages/:route', designController.updatePage);
router.delete('/:name/pages/:route', designController.deletePage);

module.exports = router;
