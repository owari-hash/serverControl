const express = require('express');
const service = require('./serverRegistryService');
const { ok, fail } = require('../../../shared/http/response');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const servers = await service.listServers();
    res.json(ok({ success: true, servers }));
  } catch (error) {
    res.status(500).json(fail(error.message));
  }
});

router.post('/', async (req, res) => {
  try {
    const server = await service.registerServer(req.body || {});
    res.status(201).json(ok({ success: true, server }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.post('/:id/exec', async (req, res) => {
  try {
    const result = await service.runCommand(req.params.id, req.body && req.body.command);
    res.json(ok({ success: true, result }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

module.exports = router;
