const express = require('express');
const authController = require('./authController');
const { requireAuth } = require('../../shared/middleware/requireAuth');
const { authRateLimit } = require('../../shared/middleware/authRateLimit');

const router = express.Router();

router.post('/login', authRateLimit, authController.login);
router.post('/refresh', authRateLimit, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
