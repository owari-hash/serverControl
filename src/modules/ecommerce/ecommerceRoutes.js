const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    module: 'ecommerce',
    projectId: req.context.projectId
  });
});

module.exports = router;
