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

router.patch('/:email', requireRole('superadmin'), async (req, res) => {
  try {
    const { password, role, status } = req.body || {};
    const targetEmail = req.params.email;
    const u = await User.findOne({ email: targetEmail });
    if (!u) return res.status(404).json(fail('User not found'));
    const updates = {};
    if (password) updates.passwordHash = hashPassword(String(password));
    if (role && ['superadmin', 'client-admin', 'editor'].includes(String(role))) {
      if (u.role === 'superadmin' && String(role) !== 'superadmin') {
        return res.status(400).json(fail('Cannot demote superadmin'));
      }
      updates.role = String(role);
    }
    if (status && ['ACTIVE', 'DISABLED'].includes(String(status).toUpperCase())) {
      updates.status = String(status).toUpperCase();
    }
    if (Object.keys(updates).length === 0) {
      return res.json(ok({ success: true, user: { email: u.email, role: u.role, status: u.status } }));
    }
    updates.updatedAt = new Date();
    const next = await User.findOneAndUpdate(
      { email: targetEmail },
      { $set: updates },
      { returnDocument: 'after', lean: true },
    );
    if (!next) return res.status(404).json(fail('User not found'));
    res.json(ok({ success: true, user: { email: next.email, role: next.role, status: next.status } }));
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

router.delete('/:email', requireRole('superadmin'), async (req, res) => {
  try {
    if (String(req.params.email) === String(req.auth?.email)) {
      return res.status(400).json(fail('Cannot delete your own account'));
    }
    const u = await User.findOne({ email: req.params.email });
    if (!u) return res.status(404).json(fail('User not found'));
    if (u.role === 'superadmin') {
      return res.status(400).json(fail('Cannot delete superadmin users'));
    }
    await UserProjectBinding.deleteMany({ userEmail: u.email });
    await User.deleteOne({ _id: u._id });
    res.json(ok({ success: true }));
  } catch (error) {
    res.status(500).json(fail(error.message));
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
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
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
