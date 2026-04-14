const express = require('express');
const { ok, fail } = require('../../shared/http/response');
const { requireAuth } = require('../../shared/middleware/requireAuth');
const { requireRole } = require('../../shared/middleware/requireRole');
const registryService = require('./registryService');

const router = express.Router();

router.use(requireAuth, requireRole('superadmin'));

router.get('/', async (req, res) => {
  try {
    const definitions = await registryService.listDefinitions({
      category: req.query.category,
      isActive: req.query.isActive === undefined ? undefined : req.query.isActive === 'true',
    });
    res.json(ok({ success: true, definitions }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.put('/:type', async (req, res) => {
  try {
    const definition = await registryService.upsertDefinition(req.params.type, req.body || {});
    res.json(ok({ success: true, definition }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.delete('/:type', async (req, res) => {
  try {
    await registryService.deleteDefinition(req.params.type);
    res.json(ok({ success: true }));
  } catch (error) {
    res.status(404).json(fail(error.message));
  }
});

module.exports = router;
