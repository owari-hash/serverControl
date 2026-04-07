const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    permissions: [],
    message: 'Permissions module foundation ready'
  });
});

module.exports = router;
