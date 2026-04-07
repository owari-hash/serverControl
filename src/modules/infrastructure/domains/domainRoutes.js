const express = require('express');
const service = require('./domainService');
const { ok, fail } = require('../../../shared/http/response');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const domains = await service.listDomains(req.context.projectId);
    res.json(ok({ success: true, domains }));
  } catch (error) {
    res.status(500).json(fail(error.message));
  }
});

router.post('/bind', async (req, res) => {
  try {
    const payload = {
      projectId: req.context.projectId,
      domain: req.body && req.body.domain,
      upstreamHost: req.body && req.body.upstreamHost,
      upstreamPort: req.body && req.body.upstreamPort
    };
    const domain = await service.bindDomain(payload);
    res.status(201).json(ok({ success: true, domain }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.patch('/:domain/enabled', async (req, res) => {
  try {
    const updated = await service.setDomainEnabled(
      req.params.domain,
      Boolean(req.body && req.body.isEnabled)
    );
    res.json(ok({ success: true, domain: updated }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

module.exports = router;
