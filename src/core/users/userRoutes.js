const express = require('express');
const { ok, fail } = require('../../shared/http/response');
const { requireRole } = require('../../shared/middleware/requireRole');
const User = require('../../models/User');
const UserProjectBinding = require('../../models/UserProjectBinding');
const { hashPassword } = require('../auth/authService');

const router = express.Router();

router.get('/', requireRole('superadmin'), async (req, res) => {
  try {
    const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
    res.json(ok({ success: true, users }));
  } catch (error) {
    res.status(500).json(fail(error.message));
  }
});

router.post('/', requireRole('superadmin'), async (req, res) => {
  try {
    const { email, password, role = 'client-admin' } = req.body || {};
    if (!email || !password) return res.status(400).json(fail('email and password are required'));
    const user = await User.create({
      email,
      passwordHash: hashPassword(password),
      role,
      status: 'ACTIVE'
    });
    res.status(201).json(ok({
      success: true,
      user: { email: user.email, role: user.role, status: user.status }
    }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.get('/:email/bindings', requireRole('superadmin'), async (req, res) => {
  try {
    const bindings = await UserProjectBinding.find({ userEmail: req.params.email }).lean();
    res.json(ok({ success: true, bindings }));
  } catch (error) {
    res.status(500).json(fail(error.message));
  }
});

router.post('/:email/bindings', requireRole('superadmin'), async (req, res) => {
  try {
    const { projectName, roles = ['editor'] } = req.body || {};
    if (!projectName) return res.status(400).json(fail('projectName is required'));
    const binding = await UserProjectBinding.findOneAndUpdate(
      { userEmail: req.params.email, projectName },
      { userEmail: req.params.email, projectName, roles, status: 'ACTIVE' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(ok({ success: true, binding }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.delete('/:email/bindings/:projectName', requireRole('superadmin'), async (req, res) => {
  try {
    await UserProjectBinding.deleteOne({
      userEmail: req.params.email,
      projectName: req.params.projectName
    });
    res.json(ok({ success: true }));
  } catch (error) {
    res.status(500).json(fail(error.message));
  }
});

module.exports = router;
