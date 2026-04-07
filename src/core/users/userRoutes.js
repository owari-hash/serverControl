const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    users: [],
    message: 'Users module foundation ready'
  });
});

module.exports = router;
