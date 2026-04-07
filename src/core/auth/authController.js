const { envelope } = require('../../utils/apiContract');
const authService = require('./authService');

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json(envelope({
        success: false,
        error: 'email and password are required'
      }));
    }

    const authResult = authService.login(email, password);
    if (!authResult) {
      return res.status(401).json(envelope({
        success: false,
        error: 'Invalid credentials'
      }));
    }

    return res.json(envelope({
      success: true,
      ...authResult
    }));
  } catch (error) {
    return res.status(500).json(envelope({
      success: false,
      error: error.message
    }));
  }
}

module.exports = {
  login
};
