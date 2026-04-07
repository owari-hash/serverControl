const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    module: 'landing',
    projectId: req.context.projectId
  });
});

module.exports = router;
