const express = require('express');
const designService = require('./designService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const designs = await designService.getAllDesigns();
    res.json({ success: true, designs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:name', async (req, res) => {
  try {
    const design = await designService.getDesignByProject(req.params.name);
    res.json({ success: true, design });
  } catch (error) {
    const status = error.message === 'Design not found for this project' ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { projectName } = req.body || {};
    if (!projectName) {
      return res.status(400).json({ success: false, error: 'projectName is required' });
    }
    const design = await designService.createOrUpdateDesign(projectName, req.body || {});
    res.status(201).json({ success: true, design });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:name', async (req, res) => {
  try {
    const design = await designService.createOrUpdateDesign(req.params.name, req.body || {});
    res.json({ success: true, design });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:name', async (req, res) => {
  try {
    await designService.deleteDesign(req.params.name);
    res.json({ success: true, message: `Design ${req.params.name} deleted` });
  } catch (error) {
    const status = error.message === 'Design not found for this project' ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

module.exports = router;
