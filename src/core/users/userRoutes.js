const express = require('express');
const { ok } = require('../../shared/http/response');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(ok({
    success: true,
    users: [],
    message: 'Users module foundation ready'
  }));
});

module.exports = router;
