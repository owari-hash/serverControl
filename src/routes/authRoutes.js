const express = require('express');
const router = express.Router();
const config = require('../../config');
const { envelope } = require('../utils/apiContract');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json(envelope({
        success: false,
        error: 'email and password are required'
      }));
    }

    const validEmail = config.AUTH_EMAIL || 'admin@demo.com';
    const validPassword = config.AUTH_PASSWORD || '123456';

    if (email !== validEmail || password !== validPassword) {
      return res.status(401).json(envelope({
        success: false,
        error: 'Invalid credentials'
      }));
    }

    const tokenPayload = `${email}:${Date.now()}`;
    const token = Buffer.from(tokenPayload).toString('base64url');

    return res.json(envelope({
      success: true,
      user: {
        email,
        role: 'admin'
      },
      token,
      expiresIn: 60 * 60 * 24
    }));
  } catch (error) {
    return res.status(500).json(envelope({
      success: false,
      error: error.message
    }));
  }
});

module.exports = router;
