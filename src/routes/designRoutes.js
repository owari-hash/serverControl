const express = require('express');
const router = express.Router();
const designController = require('../controllers/designController');

// Project Design CRUD (theme, settings - NOT component structure)
router.get('/', designController.getAllDesigns);
router.get('/:name', designController.getDesign);
router.post('/', designController.saveDesign);
router.patch('/:name', designController.saveDesign);
router.delete('/:name', designController.deleteDesign);

// NOTE: Page component structure now managed via /api/components/instances/* routes

module.exports = router;
