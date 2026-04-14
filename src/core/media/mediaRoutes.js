const express = require('express');
const { ok, fail } = require('../../shared/http/response');
const { requireAuth } = require('../../shared/middleware/requireAuth');
const { requireRole } = require('../../shared/middleware/requireRole');
const mediaService = require('./mediaService');

const router = express.Router();

router.use(requireAuth, requireRole('superadmin'));

router.get('/', async (req, res) => {
  try {
    const assets = await mediaService.listAssets({
      folder: req.query.folder,
      tag: req.query.tag,
      projectName: req.query.projectName,
    });
    res.json(ok({ success: true, assets }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.post('/', async (req, res) => {
  try {
    const asset = await mediaService.createAsset(req.body || {}, req.auth.email);
    res.status(201).json(ok({ success: true, asset }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await mediaService.deleteAsset(req.params.id);
    res.json(ok({ success: true }));
  } catch (error) {
    res.status(404).json(fail(error.message));
  }
});

module.exports = router;
