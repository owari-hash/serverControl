const express = require('express');
const service = require('./serverRegistryService');
const { ok, fail } = require('../../../shared/http/response');
const { requireRole } = require('../../../shared/middleware/requireRole');
const { auditLog } = require('../../../shared/logging/auditLog');

const router = express.Router();

router.get('/', requireRole('superadmin'), async (req, res) => {
  try {
    const servers = await service.listServers();
    res.json(ok({ success: true, servers }));
  } catch (error) {
    res.status(500).json(fail(error.message));
  }
});

router.post('/', requireRole('superadmin'), async (req, res) => {
  try {
    const server = await service.registerServer(req.body || {});
    auditLog(req, 'infra.server.create', { serverName: server.name });
    res.status(201).json(ok({ success: true, server }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.post('/:id/exec', requireRole('superadmin'), async (req, res) => {
  try {
    const result = await service.runCommand(req.params.id, req.body && req.body.command);
    auditLog(req, 'infra.server.exec', { serverId: req.params.id });
    res.json(ok({ success: true, result }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

module.exports = router;
