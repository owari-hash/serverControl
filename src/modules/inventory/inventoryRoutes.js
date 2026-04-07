const express = require('express');
const { ok } = require('../../shared/http/response');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json(ok({
    success: true,
    module: 'inventory',
    projectId: req.context.projectId
  }));
});

module.exports = router;
