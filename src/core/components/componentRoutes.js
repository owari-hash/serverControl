const express = require('express');
const componentService = require('./componentService');
const { ok, fail } = require('../../shared/http/response');
const { requireAuth } = require('../../shared/middleware/requireAuth');
const { requireProjectAccess } = require('../../shared/middleware/requireProjectAccess');
const { auditLog } = require('../../shared/logging/auditLog');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const components = await componentService.list(
      req.context.projectId,
      req.query.pageRoute
    );
    res.json(ok({ success: true, components }));
  } catch (error) {
    res.status(500).json(fail(error.message));
  }
});

router.get('/tree', async (req, res) => {
  try {
    const components = await componentService.tree(
      req.context.projectId,
      req.query.pageRoute
    );
    res.json(ok({ success: true, components }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.post('/', requireAuth, requireProjectAccess('client-admin', 'editor'), async (req, res) => {
  try {
    const component = await componentService.create(req.context.projectId, req.body || {});
    auditLog(req, 'component.create', { projectName: req.context.projectId, componentType: req.body && req.body.componentType });
    res.status(201).json(ok({ success: true, component }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.patch('/:instanceId', requireAuth, requireProjectAccess('client-admin', 'editor'), async (req, res) => {
  try {
    const component = await componentService.update(
      req.context.projectId,
      req.params.instanceId,
      req.body || {}
    );
    auditLog(req, 'component.patch', { projectName: req.context.projectId, instanceId: req.params.instanceId });
    res.json(ok({ success: true, component }));
  } catch (error) {
    const status = error.message === 'Component instance not found' ? 404 : 400;
    res.status(status).json(fail(error.message));
  }
});

router.delete('/:instanceId', requireAuth, requireProjectAccess('client-admin'), async (req, res) => {
  try {
    await componentService.remove(req.context.projectId, req.params.instanceId);
    auditLog(req, 'component.delete', { projectName: req.context.projectId, instanceId: req.params.instanceId });
    res.json(ok({ success: true, message: `Component ${req.params.instanceId} deleted` }));
  } catch (error) {
    const status = error.message === 'Component instance not found' ? 404 : 400;
    res.status(status).json(fail(error.message));
  }
});

router.post('/reorder', requireAuth, requireProjectAccess('client-admin', 'editor'), async (req, res) => {
  try {
    await componentService.reorder(req.context.projectId, req.body && req.body.instances);
    auditLog(req, 'component.reorder', { projectName: req.context.projectId });
    res.json(ok({ success: true }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

module.exports = router;
