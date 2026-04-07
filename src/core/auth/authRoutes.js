const express = require('express');
const authController = require('./authController');
const { requireAuth } = require('../../shared/middleware/requireAuth');

const router = express.Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
