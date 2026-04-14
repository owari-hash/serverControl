const express = require('express');
const { ok, fail } = require('../../shared/http/response');
const { requireAuth } = require('../../shared/middleware/requireAuth');
const { requireRole } = require('../../shared/middleware/requireRole');
const templateService = require('./templateService');

const router = express.Router();

router.use(requireAuth, requireRole('superadmin'));

router.get('/', async (req, res) => {
  try {
    const templates = await templateService.listTemplates({
      category: req.query.category,
      isActive: req.query.isActive === undefined ? undefined : req.query.isActive === 'true',
      search: req.query.search,
    });
    res.json(ok({ success: true, templates }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const analytics = await templateService.listTemplateAnalytics();
    res.json(ok({ success: true, analytics }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.get('/design-snapshots/:projectName', async (req, res) => {
  try {
    const snapshots = await templateService.listDesignSnapshots(req.params.projectName);
    res.json(ok({ success: true, snapshots }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.post('/', async (req, res) => {
  try {
    const template = await templateService.createTemplate(req.body || {}, req.auth.email);
    res.status(201).json(ok({ success: true, template }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.post('/import', async (req, res) => {
  try {
    const template = await templateService.importTemplate(req.body || {}, req.auth.email);
    res.status(201).json(ok({ success: true, template }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.get('/:id/export', async (req, res) => {
  try {
    const template = await templateService.exportTemplate(req.params.id);
    res.json(ok({ success: true, template }));
  } catch (error) {
    res.status(404).json(fail(error.message));
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    res.json(ok({ success: true, template }));
  } catch (error) {
    res.status(404).json(fail(error.message));
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body || {}, req.auth.email);
    res.json(ok({ success: true, template }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.post('/:id/duplicate', async (req, res) => {
  try {
    const name = req.body?.name;
    if (!name) return res.status(400).json(fail('name is required'));
    const template = await templateService.duplicateTemplate(req.params.id, name, req.auth.email);
    res.status(201).json(ok({ success: true, template }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.post('/:id/activate', async (req, res) => {
  try {
    const template = await templateService.setTemplateActive(req.params.id, req.body?.isActive !== false, req.auth.email);
    res.json(ok({ success: true, template }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.post('/:id/rollback', async (req, res) => {
  try {
    const version = Number(req.body?.version);
    if (!Number.isFinite(version)) return res.status(400).json(fail('version must be a number'));
    const template = await templateService.rollbackTemplateVersion(req.params.id, version, req.auth.email);
    res.json(ok({ success: true, template }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.post('/:id/apply', async (req, res) => {
  try {
    const projectName = req.body?.projectName;
    if (!projectName) return res.status(400).json(fail('projectName is required'));
    const template = await templateService.applyTemplateToProject({
      templateId: req.params.id,
      projectName,
      overwriteRoute: req.body?.overwriteRoute !== false,
      actorEmail: req.auth.email,
    });
    res.json(ok({ success: true, template }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await templateService.deleteTemplate(req.params.id);
    res.json(ok({ success: true, message: 'Template deleted' }));
  } catch (error) {
    res.status(404).json(fail(error.message));
  }
});

module.exports = router;
