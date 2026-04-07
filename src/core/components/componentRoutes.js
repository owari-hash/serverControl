const express = require('express');
const componentService = require('./componentService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const components = await componentService.list(
      req.context.projectId,
      req.query.pageRoute
    );
    res.json({ success: true, components });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/tree', async (req, res) => {
  try {
    const components = await componentService.tree(
      req.context.projectId,
      req.query.pageRoute
    );
    res.json({ success: true, components });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const component = await componentService.create(req.context.projectId, req.body || {});
    res.status(201).json({ success: true, component });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:instanceId', async (req, res) => {
  try {
    const component = await componentService.update(
      req.context.projectId,
      req.params.instanceId,
      req.body || {}
    );
    res.json({ success: true, component });
  } catch (error) {
    const status = error.message === 'Component instance not found' ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.delete('/:instanceId', async (req, res) => {
  try {
    await componentService.remove(req.context.projectId, req.params.instanceId);
    res.json({ success: true, message: `Component ${req.params.instanceId} deleted` });
  } catch (error) {
    const status = error.message === 'Component instance not found' ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.post('/reorder', async (req, res) => {
  try {
    await componentService.reorder(req.context.projectId, req.body && req.body.instances);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
