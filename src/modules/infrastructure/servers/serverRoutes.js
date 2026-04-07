const express = require('express');
const service = require('./serverRegistryService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const servers = await service.listServers();
    res.json({ success: true, servers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const server = await service.registerServer(req.body || {});
    res.status(201).json({ success: true, server });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/exec', async (req, res) => {
  try {
    const result = await service.runCommand(req.params.id, req.body && req.body.command);
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
