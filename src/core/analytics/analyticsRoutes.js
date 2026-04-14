const express = require('express');
const { ok, fail } = require('../../shared/http/response');
const { requireAuth } = require('../../shared/middleware/requireAuth');
const { requireRole } = require('../../shared/middleware/requireRole');
const AuditEvent = require('../../models/AuditEvent');
const Template = require('../../models/Template');

const router = express.Router();

router.use(requireAuth, requireRole('superadmin'));

router.get('/overview', async (_req, res) => {
  try {
    const [templateCount, auditCount, recentEvents] = await Promise.all([
      Template.countDocuments({}),
      AuditEvent.countDocuments({}),
      AuditEvent.find({}).sort({ createdAt: -1 }).limit(20),
    ]);
    const applyEvents = await AuditEvent.countDocuments({ action: 'template.apply' });
    res.json(
      ok({
        success: true,
        metrics: {
          templateCount,
          auditCount,
          applyEvents,
        },
        recentEvents,
      }),
    );
  } catch (error) {
    res.status(400).json(fail(error.message));
  }
});

module.exports = router;
