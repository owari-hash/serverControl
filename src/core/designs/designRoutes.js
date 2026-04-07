const express = require('express');
const designService = require('./designService');
const { ok, fail } = require('../../shared/http/response');
const { requireAuth } = require('../../shared/middleware/requireAuth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const designs = await designService.getAllDesigns();
    res.json(ok({ success: true, designs }));
  } catch (error) {
    res.status(500).json(fail(error.message));
  }
});

router.get('/:name', async (req, res) => {
  try {
    const design = await designService.getDesignByProject(req.params.name);
    res.json(ok({ success: true, design }));
  } catch (error) {
    const status = error.message === 'Design not found for this project' ? 404 : 500;
    res.status(status).json(fail(error.message));
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { projectName } = req.body || {};
    if (!projectName) {
      return res.status(400).json(fail('projectName is required'));
    }
    const design = await designService.createOrUpdateDesign(projectName, req.body || {});
    res.status(201).json(ok({ success: true, design }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.patch('/:name', requireAuth, async (req, res) => {
  try {
    const design = await designService.createOrUpdateDesign(req.params.name, req.body || {});
    res.json(ok({ success: true, design }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.delete('/:name', requireAuth, async (req, res) => {
  try {
    await designService.deleteDesign(req.params.name);
    res.json(ok({ success: true, message: `Design ${req.params.name} deleted` }));
  } catch (error) {
    const status = error.message === 'Design not found for this project' ? 404 : 500;
    res.status(status).json(fail(error.message));
  }
});

module.exports = router;
